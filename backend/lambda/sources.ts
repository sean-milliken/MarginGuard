import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import type { CreateSourceRequest, CreateSourceResponse, Source } from '../../shared/src/types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const s3 = new S3Client({});
const BUCKET = process.env.SOURCES_BUCKET!;
const EXPIRES_IN = 900;

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body required' }),
    };
  }

  const req: CreateSourceRequest = JSON.parse(event.body);
  if (!req.companyId || !req.fileName || !req.contentType) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'companyId, fileName, and contentType are required' }),
    };
  }

  const sourceId = `src-${randomUUID()}`;
  const s3Key = `uploads/${req.companyId}/${sourceId}/${req.fileName}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: req.contentType }),
    { expiresIn: EXPIRES_IN },
  );

  const metadata: Source = {
    sourceId,
    companyId: req.companyId,
    fileName: req.fileName,
    contentType: req.contentType,
    s3Key,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `metadata/${sourceId}.json`,
      Body: JSON.stringify(metadata),
      ContentType: 'application/json',
    }),
  );

  const response: CreateSourceResponse = { sourceId, uploadUrl, expiresIn: EXPIRES_IN };
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
  };
};
