import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import path from "node:path";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;
const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3 = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  key: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface PresignedUploadUrl {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

export const storageService = {
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return { valid: false, error: "Only PDF, DOC, and DOCX files are accepted." };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: "File size must not exceed 10 MB." };
    }
    return { valid: true };
  },

  generateKey(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${randomUUID().slice(0, 8)}`;
    return `resumes/${uniqueSuffix}${ext}`;
  },

  async upload(file: Express.Multer.File): Promise<UploadResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const key = this.generateKey(file.originalname);

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
        },
      })
    );

    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;

    return {
      key,
      url: publicUrl,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  },

  async delete(key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
  },

  async getPresignedUploadUrl(originalName: string, mimeType: string): Promise<PresignedUploadUrl> {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error("Invalid file type. Only PDF, DOC, and DOCX are allowed.");
    }

    const key = this.generateKey(originalName);
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `${R2_ENDPOINT}/${R2_BUCKET}/${key}`;

    return { uploadUrl, key, publicUrl };
  },

  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    });
    return getSignedUrl(s3, command, { expiresIn: 3600 });
  },
};