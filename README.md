# MarginGuard

> **Financial Risk Intelligence for Supply Chain Disruptions**

**Hackathon Tracks:** Beyond the Chatbot • Compound • Xtract • Seed Round

---

| Index                         | Description                                         |
|:------------------------------|:----------------------------------------------------|
| [Overview](#overview)         | See what this project does and its key capabilities |
| [Description](#description)   | Learn about the problem and our approach            |
| [Architecture](#architecture) | View the system architecture diagram                |
| [Tech Stack](#tech-stack)     | Technologies and services used                      |
| [Deployment](#deployment)     | How to install and deploy the solution              |
| [Usage](#usage)               | How to use the application                          |
| [Costs](#costs)               | Estimated AWS costs for running the solution        |
| [Credits](#credits)           | Meet the team behind this project                   |
| [License](#license)           | See the project's license information               |
| [Disclaimers](#disclaimers)   | Important legal disclaimers                         |

---

# Overview

> **MarginGuard** is a serverless financial risk intelligence platform designed to help procurement and finance teams quantify the financial impact of supply chain disruptions. The solution combines real-time economic signals from FRED (Federal Reserve Economic Data) with deterministic financial modeling to provide transparent, verifiable impact assessments without relying on opaque AI predictions.

**Key capabilities include:**

- **Real-Time Economic Monitoring**: Tracks commodity prices (aluminum, corrugated packaging, energy) from FRED API and automatically calculates financial exposure based on component costs and production volumes
- **Deterministic Financial Impact Engine**: BigInt-based calculations trace every dollar from raw material price changes through supplier contracts to product-level margin impact—zero hallucination risk
- **Scenario Planning & Response Options**: Pre-configured supply chain disruption scenarios (supplier failures, logistics delays, demand shocks) with calculated response strategies and net financial benefits
- **Source-Transparent Intelligence**: Every data point links to its original source (FRED series, financial inputs, calculation steps)—built for auditability and CFO trust
- **Multi-Event Analysis Pipeline**: Supports AI-powered article classification (via NVIDIA Nemotron) to extract supply chain events from news sources, with human-in-the-loop validation

---

# Description

## Problem Statement

When a supply chain disruption hits—a supplier failure, commodity price spike, or logistics breakdown—procurement and finance teams face an immediate question: **What's the financial impact, and what should we do about it?** Traditional approaches rely on manual spreadsheet modeling (slow, error-prone) or opaque AI predictions (unverifiable, risky for CFO sign-off). Neither approach provides the speed, transparency, and precision needed for real-time decision-making under pressure.

## Our Approach

### Deterministic Financial Engine

MarginGuard's core is a **BigInt-based financial calculation engine** that models supply chains as directed graphs—suppliers provide components at contracted prices, components combine into products with known margins, and disruptions propagate deterministically through the graph. Every calculation is explicit:

- **Cost changes** flow from external data sources (FRED commodity prices) → supplier component costs → product unit economics
- **Scenario impacts** model supplier unavailability, lead time delays, and demand shocks as graph transformations with precise unit and dollar effects
- **Response options** (alternative suppliers, price adjustments, production cuts) are pre-calculated with transparent trade-offs (cost vs. margin vs. units affected)

All calculations use **BigInt arithmetic** to eliminate floating-point drift—critical for financial accuracy at scale.

**Technologies:** TypeScript, Custom financial modeling library

### Real-Time Economic Signals (FRED Integration)

MarginGuard continuously monitors **Federal Reserve Economic Data (FRED)** for commodity price changes that affect modeled supply chains:

- **Aluminum PPI** (PCU331315331315) → aluminum can costs
- **Corrugated boxes PPI** (PCU322121322121) → packaging costs
- **Industrial electricity PPI** (WPU01170301) → energy exposure
- **All commodities PPI** (PPIACO) → general inflation indicator

Each signal is **deterministically calculated** (percentage change, severity level, direction) and linked to affected components via a configuration-driven mapping. Financial impact is calculated by:
1. Projecting new component costs from commodity price changes
2. Calculating monthly volume exposure (units × components per unit)
3. Propagating cost changes to product-level margin impact

**DynamoDB caching** (7-day TTL) reduces API calls while maintaining freshness.

**Technologies:** AWS Secrets Manager (API key storage), DynamoDB (observation cache), FRED API client with retry/timeout logic

### AI-Powered Intelligence Extraction (Optional)

For teams ingesting supply chain news or reports, MarginGuard supports **AI-powered article classification** via NVIDIA Nemotron:

- **Extract structured events** (supplier name, component, disruption type, severity) from unstructured text
- **Deterministic validation**: AI outputs are treated as **suggestions**, not facts—users validate extracted events before financial calculations run
- **Source linking**: Every analysis references the original article (stored in S3) for auditability

This component is **optional**—MarginGuard's core financial engine operates independently of AI and can be driven entirely by manual scenario inputs or external data feeds.

**Technologies:** NVIDIA Nemotron (LLM), AWS Lambda (async processing), S3 (document storage), DynamoDB (analysis results)

### Serverless AWS Infrastructure

MarginGuard is deployed entirely on **AWS serverless services** for scalability and cost efficiency:

- **AWS Lambda** handles all backend logic (API, FRED ingestion, AI analysis)
- **DynamoDB** stores analyses, economic observations, and cached calculations
- **API Gateway (HTTP API)** with Cognito JWT authorization
- **S3** stores uploaded source documents
- **CDK** (Infrastructure as Code) for reproducible deployments

The architecture is **event-driven**: FRED data refreshes trigger signal recalculations, article uploads trigger async AI analysis, scenario runs trigger financial engine execution—all without managing servers.

### Modern React Frontend

The dashboard provides:
- **Economic Signals** section showing real-time FRED indicators with severity badges and expandable financial impact details
- **Critical Risk Card** summarizing current disruption scenario and affected units/cash
- **Supplier Exposure** visualization showing dependency concentration
- **Response Comparison** cards with net benefit calculations
- **3D interactive background** (Three.js) for visual polish

Built with **React**, **TypeScript**, **Tailwind CSS**, and **Framer Motion** for animations.

---

# Architecture

MarginGuard follows a serverless event-driven architecture on AWS:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  - Economic Signals Dashboard - Scenario Planning - Auth (Cognito)│
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              API Gateway (HTTP API + Cognito Auth)               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS Lambda (Application)                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │ FRED Service     │  │ Financial Engine │  │ AI Analysis    ││
│  │ - Cache check    │  │ - Scenario calc  │  │ (Optional)     ││
│  │ - API fetch      │  │ - Impact models  │  │ - Nemotron LLM ││
│  │ - Signal detect  │  │ - Response opts  │  │ - Extraction   ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└────┬────────────┬────────────┬────────────────────┬─────────────┘
     │            │            │                    │
     ▼            ▼            ▼                    ▼
┌─────────┐ ┌──────────┐ ┌──────────┐      ┌──────────────┐
│DynamoDB │ │DynamoDB  │ │   S3     │      │Secrets Manager│
│Economic │ │Analyses  │ │ Source   │      │- FRED API Key │
│  Data   │ │ Table    │ │Documents │      │- NVIDIA Key   │
└─────────┘ └──────────┘ └──────────┘      └──────────────┘
     ▲
     │ Cached observations (7-day TTL)
     │
┌─────────────────────┐
│  FRED API           │
│  (Federal Reserve)  │
└─────────────────────┘
```

**Data Flow:**
1. User logs in via Cognito, accesses React dashboard
2. Dashboard fetches `/fred/signals` to display economic indicators
3. Lambda checks DynamoDB cache → fetches from FRED API if stale → calculates signals → stores in cache
4. User selects scenario → Lambda runs financial engine → returns impact + response options
5. (Optional) User uploads article → Lambda invokes Nemotron → extracts event → user validates → runs scenario

---

# Tech Stack

| Category                      | Technology                                                                                | Purpose                                            |
|:------------------------------|:------------------------------------------------------------------------------------------|:---------------------------------------------------|
| **Amazon Web Services (AWS)** | [Lambda](https://aws.amazon.com/lambda/)                                                  | Serverless backend compute                         |
|                               | [DynamoDB](https://aws.amazon.com/dynamodb/)                                              | NoSQL database for analyses and economic data      |
|                               | [API Gateway](https://aws.amazon.com/api-gateway/)                                        | HTTP API with Cognito JWT authorization            |
|                               | [Cognito](https://aws.amazon.com/cognito/)                                                | User authentication and authorization              |
|                               | [S3](https://aws.amazon.com/s3/)                                                          | Document storage for uploaded articles             |
|                               | [Secrets Manager](https://aws.amazon.com/secrets-manager/)                                | Secure storage for FRED and NVIDIA API keys        |
|                               | [CDK](https://aws.amazon.com/cdk/)                                                        | Infrastructure as Code                             |
| **Backend**                   | [TypeScript](https://www.typescriptlang.org/)                                             | Type-safe backend logic                            |
|                               | [esbuild](https://esbuild.github.io/)                                                     | Lambda bundler                                     |
|                               | [Zod](https://zod.dev/)                                                                   | Runtime schema validation                          |
|                               | [FRED API](https://fred.stlouisfed.org/docs/api/fred/)                                    | Federal Reserve Economic Data                      |
| **AI (Optional)**             | [NVIDIA Nemotron](https://build.nvidia.com/nvidia/llama-3_1-nemotron-70b-instruct)        | LLM for supply chain event extraction              |
| **Frontend**                  | [React](https://react.dev/)                                                               | UI framework                                       |
|                               | [TypeScript](https://www.typescriptlang.org/)                                             | Type-safe frontend logic                           |
|                               | [Vite](https://vite.dev/)                                                                 | Build tool and dev server                          |
|                               | [Tailwind CSS](https://tailwindcss.com/)                                                  | Utility-first styling                              |
|                               | [Framer Motion](https://www.framer.com/motion/)                                           | Animations                                         |
|                               | [Three.js](https://threejs.org/)                                                          | 3D background effects                              |
| **Financial Engine**          | [Custom TypeScript Library](./financial-engine/)                                          | Deterministic supply chain graph modeling          |

---

# Deployment

## Prerequisites

1. An [AWS account](https://signin.aws.amazon.com/signup?request_type=register)
2. **Node.js v20+** — [Download here](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm)
3. **AWS CDK v2.270+** — install via:
   ```bash
   npm install -g aws-cdk@latest
   ```
4. **AWS CLI** — [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
5. **FRED API Key** (free) — [Get yours here](https://fred.stlouisfed.org/docs/api/api_key.html)
6. **NVIDIA API Key** (optional, for AI features) — [Get yours here](https://build.nvidia.com/)

## AWS Configuration

1. **Configure AWS credentials:**
   ```bash
   aws configure
   ```

2. **Bootstrap CDK** *(required once per AWS account/region):*
   ```bash
   cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
   ```

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-org/marginguard.git
cd marginguard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create FRED API secret in AWS

```bash
aws secretsmanager create-secret \
  --name marginguard-fred-api-key \
  --secret-string '{"FRED_API_KEY":"your-fred-api-key-here"}' \
  --description "FRED API key for MarginGuard economic data"
```

Replace `your-fred-api-key-here` with your actual FRED API key.

### 4. Build backend

```bash
cd backend/app
npm install
npm run build
cd ../..
```

### 5. Deploy infrastructure with CDK

```bash
cd infra
npm install
cdk deploy --context fredSecretArn=arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:marginguard-fred-api-key
```

**Note the API Gateway URL and Cognito User Pool details from the CDK output—you'll need these for the frontend.**

### 6. Configure frontend environment

Create `frontend/.env.local`:

```bash
VITE_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com
VITE_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_USER_POOL_DOMAIN=YOUR_DOMAIN.auth.us-east-1.amazoncognito.com
```

Replace the values with your CDK outputs.

### 7. Deploy frontend

```bash
cd frontend
npm install
npm run build
# Deploy dist/ folder to S3 + CloudFront, or run locally:
npm run dev
```

## Local Development

For local development without deploying to AWS:

1. **Create `.env` in project root:**
   ```bash
   FRED_API_KEY=your-fred-api-key
   NVIDIA_API_KEY=your-nvidia-key  # optional
   PORT=3001
   HOST=127.0.0.1
   ```

2. **Run backend and frontend:**
   ```bash
   npm run dev
   ```
   This starts both the backend API (port 3001) and frontend (port 5173).

3. **Access the app at:** `http://localhost:5173`

**Note:** Local mode uses mock authentication and in-memory storage.

---

# Usage

## 1. Access the Application

After deployment, navigate to the frontend URL (from CDK outputs or your local dev server at `http://localhost:5173`).

## 2. Create User Account

**Via AWS Console (for first user):**

<details>
<summary>Manual user creation steps</summary>

1. Open AWS Console → Cognito → User Pools
2. Select your MarginGuard user pool
3. Go to "Users" → "Create user"
4. Set username, temporary password, and email
5. User will be prompted to change password on first login

</details>

**Via AWS CLI:**

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_XXXXXXXXX \
  --username yourname \
  --user-attributes Name=email,Value=you@example.com Name=given_name,Value=Your Name=family_name,Value=Name \
  --temporary-password TempPassword123!
```

## 3. Log In and Explore Dashboard

1. Log in with your credentials (you'll be prompted to change the temporary password)
2. **Dashboard** loads with:
   - **Economic Indicators** section showing current FRED commodity price signals
   - **Critical Risk Card** showing the active supply chain scenario
   - **Financial Overview** metrics (cash impact, affected units, best response)
   - **Supplier Exposure** chart
   - **Monthly Product Contribution** breakdown

## 4. View Economic Signal Details

1. In the **Economic Indicators** section, click **"View financial impact"** on any signal
2. See:
   - Component mapping (e.g., aluminum price → aluminum cans → Foundry Cola)
   - Monthly dollar impact per product
   - Calculation steps for transparency
3. Click the **FRED source link** to verify data at fred.stlouisfed.org

## 5. Run Supply Chain Scenarios

1. Use the **Scenario dropdown** at the top to select a disruption:
   - Supplier failure (e.g., Metro Aluminum unavailable)
   - Logistics delays
   - Demand shocks
2. View calculated impacts:
   - Cash impact (monthly revenue loss)
   - Affected units
   - Supplier exposure changes
3. Navigate to **"Compare response options"** to see:
   - Switch to alternative supplier (cost increase, timeline)
   - Adjust pricing (margin impact, demand elasticity)
   - Reduce production (cost savings, lost revenue)

## 6. (Optional) Upload Articles for AI Analysis

If NVIDIA API key is configured:

1. Navigate to **Intelligence** page
2. Upload a supply chain news article (PDF/text)
3. AI extracts structured event data (supplier, component, disruption type)
4. Validate extracted data
5. Run scenario based on extracted event

---

# Costs

## Estimated Monthly Recurring Costs

| Service              | Estimated Cost | Notes                                                    |
|:---------------------|---------------:|:---------------------------------------------------------|
| Lambda               |           ~$0  | Free tier covers 1M requests/month + 400K GB-seconds    |
| DynamoDB             |            <$1 | On-demand pricing, ~1K reads/writes per day baseline     |
| API Gateway          |           ~$0  | Free tier covers 1M requests/month                       |
| Cognito              |           ~$0  | Free tier covers 50K MAUs                                |
| S3                   |           ~$0  | <1GB storage for documents                               |
| Secrets Manager      |       $0.40    | $0.40/secret/month                                       |
| **Total Baseline**   |   **~$1/month**| **Excluding variable AI and FRED costs**                 |

## Per-Query Costs (AI-Powered Analysis)

If using NVIDIA Nemotron for article analysis:

| Service               | Usage per analysis | Cost     |
|:----------------------|:------------------:|---------:|
| Nemotron (input)      |    ~2,000 tokens   |  ~$0.001 |
| Nemotron (output)     |      ~500 tokens   |  ~$0.001 |
| **Total per article** |                    | **~$0.002** |

**Monthly projections:**
- 100 articles/month: ~$0.20
- 500 articles/month: ~$1.00
- 1,000 articles/month: ~$2.00

## FRED API

The FRED API is **free** with a rate limit of 120 requests/minute. MarginGuard's 7-day DynamoDB cache minimizes API calls—typical usage is <100 requests/month.

> **Note:** Cost estimates based on AWS pricing as of September 2026. Actual costs may vary based on usage patterns.

---

# Credits

**MarginGuard** is a hackathon project developed for Beyond the Chatbot, Compound, Xtract, and Seed Round tracks.

**Development Team:**

- Sean McNeil — Full-stack development, financial engine architecture
- [Team member 2] — [Role]
- [Team member 3] — [Role]

**Technologies Powered By:**

- AWS Serverless Services
- Federal Reserve Economic Data (FRED)
- NVIDIA Nemotron (optional AI features)

---

# License

This project is licensed under the [MIT License](./LICENSE).

---

# Disclaimers

**Customers are responsible for making their own independent assessment of the information in this document.**

**This document:**  
(a) is for informational purposes only,  
(b) references AWS product offerings and practices, which are subject to change without notice,  
(c) does not create any commitments or assurances from AWS and its affiliates, suppliers or licensors. AWS products or services are provided "as is" without warranties, representations, or conditions of any kind, whether express or implied. The responsibilities and liabilities of AWS to its customers are controlled by AWS agreements, and this document is not part of, nor does it modify, any agreement between AWS and its customers, and  
(d) is not to be considered a recommendation or viewpoint of AWS.

**Additionally, you are solely responsible for testing, security and optimizing all code and assets on GitHub repo, and all such code and assets should be considered:**  
(a) as-is and without warranties or representations of any kind,  
(b) not suitable for production environments, or on production or other critical data, and  
(c) to include shortcuts in order to support rapid prototyping such as, but not limited to, relaxed authentication and authorization and a lack of strict adherence to security best practices.

**Financial Disclaimer:**  
MarginGuard is a demonstration project for hackathon evaluation. All financial calculations are deterministic and based on synthetic company data (Steel City Beverages). Real-world deployment requires validation with actual supply chain data and financial controls. Do not use for production financial decision-making without proper testing and compliance review.

**All work produced is open source.** More information can be found in the GitHub repository.
