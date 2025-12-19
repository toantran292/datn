"use client";

import { useState } from "react";
import { Upload, CheckCircle2, Loader2, X, AlertCircle, Sparkles } from "lucide-react";
import { Button, TextArea } from "@uts/design-system/ui";
import { AnalyzeMeetingResponse } from "../types";

interface MeetingUploadProps {
  projectId: string;
  workspaceSlug: string;
  onAnalysisComplete: (data: AnalyzeMeetingResponse) => void;
}

export function MeetingUpload({ projectId, workspaceSlug, onAnalysisComplete }: MeetingUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("File quá lớn. Tối đa 100MB.");
        return;
      }

      // Validate file type
      const allowedTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/x-matroska",
        "video/webm",
        "audio/mpeg",
        "audio/wav",
        "audio/x-m4a",
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError("File type không được hỗ trợ. Chỉ chấp nhận video (MP4, MOV, AVI, MKV, WebM) và audio (MP3, WAV, M4A).");
        return;
      }

      setFile(selectedFile);
      setTranscript(""); // Clear transcript if file is selected
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file && !transcript.trim()) {
      setError("Vui lòng upload file hoặc nhập transcript.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setProgress("Đang upload...");

    try {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("orgId", workspaceSlug);

      if (file) {
        formData.append("file", file);
        setProgress("Đang transcribe audio...");
      } else {
        formData.append("transcript", transcript);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/meetings/analyze`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to analyze meeting");
      }

      setProgress("Đang phân tích và tạo task previews...");

      const data: AnalyzeMeetingResponse = await response.json();

      setProgress("Hoàn thành!");
      onAnalysisComplete(data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Có lỗi xảy ra khi phân tích meeting.");
    } finally {
      setIsAnalyzing(false);
      setProgress("");
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div className="relative rounded-xl border-2 border-dashed border-custom-border-300 bg-gradient-to-br from-custom-background-90 to-custom-background-80 p-8 transition-all hover:border-custom-primary-100/50 hover:bg-custom-background-90">
        <input
          type="file"
          id="meeting-file-upload"
          accept="video/*,audio/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isAnalyzing}
        />

        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle2 className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-custom-text-100">{file.name}</p>
                <p className="text-xs text-custom-text-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={() => {
                setFile(null);
                setError(null);
              }}
              className="shrink-0"
            >
              <X className="size-4" />
              Xóa
            </Button>
          </div>
        ) : (
          <button
            onClick={() => document.getElementById("meeting-file-upload")?.click()}
            className="w-full text-center space-y-3 cursor-pointer group"
            disabled={isAnalyzing}
          >
            <div className="flex justify-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-custom-primary-100/10 group-hover:bg-custom-primary-100/20 transition-colors">
                <Upload className="size-6 text-custom-primary-100" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-custom-text-200 group-hover:text-custom-primary-100 transition-colors">
                Upload video hoặc audio của meeting
              </p>
              <p className="text-xs text-custom-text-400 mt-1">
                MP4, MOV, AVI, MKV, WebM, MP3, WAV, M4A (Max 100MB)
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-custom-border-200" />
        <span className="text-sm text-custom-text-400">hoặc</span>
        <div className="flex-1 h-px bg-custom-border-200" />
      </div>

      {/* Transcript Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-custom-text-200">Nhập Transcript</label>
        <TextArea
          value={transcript}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setTranscript(e.target.value);
            setFile(null); // Clear file if transcript is entered
            setError(null);
          }}
          placeholder="Paste meeting transcript vào đây..."
          className="min-h-[200px]"
          disabled={isAnalyzing}
        />
        <p className="text-xs text-custom-text-400">
          Hoặc paste trực tiếp transcript text của cuộc họp
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-500">Lỗi</p>
              <p className="text-sm text-custom-text-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      {isAnalyzing && (
        <div className="rounded-lg border border-custom-primary-100/20 bg-custom-primary-100/10 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 animate-spin text-custom-primary-100" />
            <span className="text-sm font-medium text-custom-text-200">{progress}</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <Button
        variant="primary"
        size="md"
        onClick={handleAnalyze}
        disabled={isAnalyzing || (!file && !transcript.trim())}
        className="w-full"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang phân tích...
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Phân tích Meeting với AI
          </>
        )}
      </Button>
    </div>
  );
}
