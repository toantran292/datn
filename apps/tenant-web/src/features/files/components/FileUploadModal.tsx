import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { FileItem } from "../hooks/useFiles";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, metadata?: { tags?: string[]; description?: string }) => Promise<FileItem | null>;
  onSuccess?: () => void;
}

export function FileUploadModal({ open, onOpenChange, onUpload, onSuccess }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const metadata = {
        tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        description: description || undefined,
      };

      const result = await onUpload(selectedFile, metadata);

      if (result) {
        // Reset form
        setSelectedFile(null);
        setTags("");
        setDescription("");
        onSuccess?.();
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error: any) {
      toast.error("Upload failed", {
        description: error.message || "Please try again later",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setTags("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !isUploading && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[540px] rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontWeight: 600 }}>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to your workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label
                htmlFor="file"
                className={`flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Upload size={24} className="text-secondary" />
                    </div>
                    <div className="text-center">
                      <p style={{ fontWeight: 600 }}>{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {!isUploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      >
                        <X size={16} className="mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Upload size={24} className="text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p style={{ fontWeight: 600 }}>Click to select file</p>
                      <p className="text-sm text-muted-foreground">
                        or drag and drop
                      </p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              placeholder="e.g., design, review, final"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rounded-xl"
              disabled={isUploading}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description for this file..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl resize-none"
              rows={3}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
