import { useState } from "react";
import { setToast, TOAST_TYPE } from "@uts/design-system/ui";

export interface DocumentUploadResponse {
  assetId: string;
  presignedUrl: string;
  objectKey: string;
  expiresIn: number;
}

export interface UploadedDocument {
  assetId: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadStatus: string;
  extractedText?: string;
}

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
  "video/mp4", // .mp4
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/x-matroska", // .mkv
  "video/webm", // .webm
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (increased for video)

export function useDocumentUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDocument, setUploadedDocument] = useState<UploadedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "File quá lớn",
        message: `Kích thước file không được vượt quá ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return false;
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Định dạng file không hỗ trợ",
        message: "Chỉ hỗ trợ file PDF, Word (.doc, .docx), Excel (.xls, .xlsx) và Video (.mp4, .mov, .avi, .mkv, .webm)",
      });
      return false;
    }

    return true;
  };

  const uploadDocument = async (
    file: File,
    options?: {
      projectId?: string;
      orgId?: string;
      userId?: string;
    }
  ): Promise<UploadedDocument | null> => {
    // Validate file
    if (!validateFile(file)) {
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Step 1: Get presigned URL
      setUploadProgress(10);
      const urlResponse = await fetch("/api/ai/documents/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          projectId: options?.projectId,
          orgId: options?.orgId,
          userId: options?.userId,
        }),
      });

      if (!urlResponse.ok) {
        const errorData = await urlResponse.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${urlResponse.status}`);
      }

      const uploadData: DocumentUploadResponse = await urlResponse.json();
      setUploadProgress(30);

      // Step 2: Upload file to presigned URL
      const uploadFileResponse = await fetch(uploadData.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadFileResponse.ok) {
        throw new Error(`Failed to upload file to storage: ${uploadFileResponse.status}`);
      }

      setUploadProgress(70);

      // Step 3: Confirm upload
      const confirmResponse = await fetch("/api/ai/documents/confirm-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: uploadData.assetId,
        }),
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP ${confirmResponse.status}`);
      }

      const confirmData = await confirmResponse.json();
      setUploadProgress(70);

      // Step 4: Extract text from document
      const extractResponse = await fetch(`/api/ai/documents/${uploadData.assetId}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let extractedText: string | undefined;

      if (extractResponse.ok) {
        const extractData = await extractResponse.json();
        extractedText = extractData?.data?.text;
        setUploadProgress(90);
      } else {
        // If extraction fails, continue without text
        console.warn("Text extraction failed, but upload succeeded");
      }

      setUploadProgress(100);

      const uploadedDoc: UploadedDocument = {
        assetId: confirmData.data.assetId,
        fileName: confirmData.data.fileName,
        mimeType: confirmData.data.mimeType,
        size: confirmData.data.size,
        uploadStatus: confirmData.data.uploadStatus,
        extractedText,
      };

      setUploadedDocument(uploadedDoc);
      setIsUploading(false);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Upload thành công",
        message: extractedText
          ? `Đã upload và extract ${file.name}`
          : `Đã upload ${file.name}`,
      });

      return uploadedDoc;
    } catch (err) {
      console.error("Document upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);

      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Lỗi upload",
        message: errorMessage,
      });

      return null;
    }
  };

  const resetUpload = () => {
    setUploadedDocument(null);
    setUploadProgress(0);
    setError(null);
  };

  return {
    uploadDocument,
    isUploading,
    uploadProgress,
    uploadedDocument,
    error,
    resetUpload,
  };
}
