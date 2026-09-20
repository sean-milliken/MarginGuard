#!/usr/bin/env bash
set -euo pipefail

#
# deploy-infra.sh - Deploy CDK infrastructure and frontend to AWS
#
# Usage: npm run deploy [options]
#
# Options:
#   --skip-bootstrap          Skip the CDK bootstrap step
#   --skip-frontend           Skip Amplify frontend deployment
#   --require-approval LEVEL  Approval level for CDK deploy (never/any-change/broadening)
#   --help                    Show this help message
#

# Configuration
DEFAULT_APPROVAL="broadening"
STACK_NAME="MarginGuardStack"
export AWS_PROFILE="${AWS_PROFILE:-default}"

# Color output helpers
print_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

print_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

# Show help message
show_help() {
    cat << 'EOF'
Usage: npm run deploy [-- options]

Deploys the CDK infrastructure to AWS.

Steps performed:
  1. Check prerequisites (node, npm, aws cli, credentials)
  2. Install npm dependencies
  3. Build TypeScript
  4. Run CDK bootstrap (unless --skip-bootstrap)
  5. Run CDK deploy

Options:
  --skip-bootstrap          Skip the CDK bootstrap step (for subsequent deploys)
  --require-approval LEVEL  Approval level for CDK deploy (default: broadening)
                            Values: never, any-change, broadening
  --skip-frontend           Skip Amplify frontend deployment
  --help                    Show this help message

Examples:
  npm run deploy                              # Full deployment with bootstrap
  npm run deploy -- --skip-bootstrap          # Deploy without bootstrap
  npm run deploy -- --require-approval never  # Deploy without approval prompts
  npm run deploy -- --skip-frontend           # Skip frontend Amplify deploy
EOF
    exit 0
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed."
        echo "  Please install Node.js from https://nodejs.org/"
        echo "  Or use a version manager like nvm: https://github.com/nvm-sh/nvm"
        exit 1
    fi
    local node_version
    node_version=$(node --version)
    print_success "Node.js found: $node_version"

    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed."
        echo "  npm should be included with Node.js. Please reinstall Node.js."
        exit 1
    fi
    local npm_version
    npm_version=$(npm --version)
    print_success "npm found: v$npm_version"

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed."
        echo "  Install from: https://aws.amazon.com/cli/"
        exit 1
    fi
    local aws_version
    aws_version=$(aws --version 2>&1 | cut -d' ' -f1)
    print_success "AWS CLI found: $aws_version"

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials are not configured or are invalid."
        echo ""
        echo "  Please configure your AWS credentials:"
        echo "    aws configure"
        echo ""
        echo "  Or set environment variables:"
        echo "    export AWS_ACCESS_KEY_ID=your_key"
        echo "    export AWS_SECRET_ACCESS_KEY=your_secret"
        echo "    export AWS_REGION=us-east-1"
        echo ""
        exit 1
    fi

    local caller_identity
    caller_identity=$(aws sts get-caller-identity --query 'Account' --output text)
    print_success "AWS credentials configured (Account: $caller_identity)"
}

# Install dependencies
install_dependencies() {
    print_info "Installing npm dependencies..."
    (cd .. && npm ci)
    print_success "Dependencies installed"
}

# Build TypeScript
build_package() {
    print_info "Building TypeScript..."
    npm run build -w @marginguard/app
    npm run build
    print_success "TypeScript compiled successfully"
}

# Bootstrap CDK
bootstrap_cdk() {
    print_info "Bootstrapping CDK..."
    npx cdk bootstrap
    print_success "CDK bootstrap complete"
}

# Deploy CDK
deploy_cdk() {
    local approval_level="$1"
    print_info "Deploying CDK stack '$STACK_NAME' (require-approval: $approval_level)..."
    npx cdk deploy "$STACK_NAME" \
        --require-approval "$approval_level" \
        --context nemotronSecretArn=arn:aws:secretsmanager:us-east-1:620214493475:secret:marginguard/nvidia-api-key-XEJViB
    print_success "CDK deployment complete"
}

# Deploy frontend to Amplify via manual zip deployment
deploy_frontend() {
    print_info "Deploying frontend to Amplify..."

    local app_id
    app_id=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
        --output text)

    if [[ -z "$app_id" ]]; then
        print_error "Could not retrieve Amplify App ID from stack outputs."
        exit 1
    fi

    print_info "Amplify App ID: $app_id"

    # Create main branch if it doesn't exist
    if ! aws amplify get-branch --app-id "$app_id" --branch-name main &>/dev/null; then
        print_info "Creating Amplify branch 'main'..."
        aws amplify create-branch --app-id "$app_id" --branch-name main
    fi

    # Write VITE_ env vars from stack outputs so Vite bakes them into the bundle
    print_info "Writing frontend environment variables from stack outputs..."
    local api_url user_pool_id user_pool_client_id region
    api_url=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
        --output text)
    user_pool_id=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
        --output text)
    user_pool_client_id=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' \
        --output text)
    region=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --query 'Stacks[0].Outputs[?OutputKey==`CognitoRegion`].OutputValue' \
        --output text)

    cat > ../frontend/.env <<EOF
VITE_MOCK_MODE=false
VITE_USER_POOL_ID=${user_pool_id}
VITE_USER_POOL_CLIENT_ID=${user_pool_client_id}
VITE_AWS_REGION=${region}
VITE_API_URL=${api_url}
EOF
    print_success "frontend/.env written"

    # Build frontend dist
    print_info "Building frontend..."
    npm run build -w frontend

    # Zip the dist folder
    local zip_path="/tmp/marginguard-frontend.zip"
    (cd ../frontend/dist && zip -qr "$zip_path" .)
    print_success "Frontend zipped: $zip_path"

    # Create deployment and get presigned URL
    local deploy_response
    deploy_response=$(aws amplify create-deployment \
        --app-id "$app_id" \
        --branch-name main)

    local job_id zip_url
    job_id=$(echo "$deploy_response" | jq -r '.jobId')
    zip_url=$(echo "$deploy_response" | jq -r '.zipUploadUrl')

    # Upload zip to presigned S3 URL
    print_info "Uploading frontend bundle..."
    curl -sS -T "$zip_path" "$zip_url"

    # Start the deployment
    aws amplify start-deployment \
        --app-id "$app_id" \
        --branch-name main \
        --job-id "$job_id" > /dev/null

    print_info "Waiting for Amplify deployment to complete (job: $job_id)..."
    local status="PENDING"
    while [[ "$status" == "PENDING" || "$status" == "RUNNING" ]]; do
        sleep 10
        status=$(aws amplify get-job \
            --app-id "$app_id" \
            --branch-name main \
            --job-id "$job_id" \
            --query 'job.summary.status' \
            --output text)
        print_info "  Status: $status"
    done

    if [[ "$status" == "SUCCEED" ]]; then
        print_success "Frontend deployed: https://main.$app_id.amplifyapp.com"
    else
        print_error "Amplify deployment failed with status: $status"
        exit 1
    fi
}

# Main function
main() {
    local skip_bootstrap=false
    local skip_frontend=false
    local require_approval="$DEFAULT_APPROVAL"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --skip-bootstrap)
                skip_bootstrap=true
                shift
                ;;
            --skip-frontend)
                skip_frontend=true
                shift
                ;;
            --require-approval)
                if [[ -n "${2:-}" ]]; then
                    case "$2" in
                        never|any-change|broadening)
                            require_approval="$2"
                            shift 2
                            ;;
                        *)
                            print_error "Invalid approval level: $2"
                            echo "  Valid values: never, any-change, broadening"
                            exit 1
                            ;;
                    esac
                else
                    print_error "--require-approval requires a level (never/any-change/broadening)"
                    exit 1
                fi
                ;;
            --help|-h)
                show_help
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information."
                exit 1
                ;;
        esac
    done

    echo ""
    echo "=================================="
    echo "  CDK Infrastructure Deployment"
    echo "=================================="
    echo ""

    # Check prerequisites
    check_prerequisites
    echo ""

    # Install dependencies
    install_dependencies
    echo ""

    # Build TypeScript
    build_package
    echo ""

    # Bootstrap CDK (unless skipped)
    if [[ "$skip_bootstrap" == false ]]; then
        bootstrap_cdk
        echo ""
    else
        print_info "Skipping CDK bootstrap (--skip-bootstrap flag)"
        echo ""
    fi

    # Deploy CDK
    deploy_cdk "$require_approval"
    echo ""

    # Deploy frontend to Amplify
    if [[ "$skip_frontend" == false ]]; then
        deploy_frontend
        echo ""
    else
        print_info "Skipping frontend deployment (--skip-frontend flag)"
        echo ""
    fi

    # Final success message
    echo "=================================="
    print_success "MarginGuard deployment complete!"
    echo "=================================="
    echo ""
    echo "Next steps:"
    echo "  - View your resources in the AWS Console"
    echo "  - Run 'npx cdk diff' to see pending changes"
    echo "  - Run 'npx cdk destroy' to tear down the stack"
    echo ""
}

# Run main
main "$@"
