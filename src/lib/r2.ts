import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  maxSize: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: maxSize,
  });
  return getSignedUrl(r2, command, { expiresIn: 900 }); // 15 minutes
}

export async function checkFileExists(
  key: string
): Promise<{ exists: boolean; contentType?: string; contentLength?: number }> {
  try {
    const response = await r2.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key })
    );
    return {
      exists: true,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  } catch {
    return { exists: false };
  }
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`;
}

export { r2, BUCKET };
