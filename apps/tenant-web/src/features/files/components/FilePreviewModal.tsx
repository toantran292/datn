import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, Trash2, ExternalLink } from "lucide-react";
import { FileItem } from "./FileCard";

interface FilePreviewModalProps {
  file: FileItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export function FilePreviewModal({ file, open, onOpenChange, onDownload, onDelete }: FilePreviewModalProps) {
  if (!file) return null;

  const isImage = file.type === "image";
  const isPDF = file.type === "pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-transparent border-0 shadow-none">
        <div className="relative">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium truncate">{file.name}</h3>
              <p className="text-white/70 text-sm">
                {file.size} • {file.owner} • {file.date}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Preview Content */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-center min-h-[500px] p-8">
              {isImage ? (
                <img
                  src={file.thumbnail || `https://placehold.co/800x600/E5E7EB/6B7280?text=${file.name}`}
                  alt={file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : isPDF ? (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-16 h-16 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                      <path d="M14 2v6h6" />
                      <path d="M9 15h6v-2H9v2zm0 4h6v-2H9v2z" fill="white" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">{file.name}</h4>
                  <p className="text-white/70 text-sm mb-6">PDF Document • {file.size}</p>
                  <Button
                    className="rounded-xl"
                    style={{ backgroundColor: "#00C4AB" }}
                    onClick={() => onDownload(file)}
                  >
                    <Download size={16} className="mr-2" />
                    Download to View
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <svg className="w-16 h-16 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">{file.name}</h4>
                  <p className="text-white/70 text-sm mb-6">Document • {file.size}</p>
                  <Button
                    className="rounded-xl"
                    style={{ backgroundColor: "#00C4AB" }}
                    onClick={() => onDownload(file)}
                  >
                    <Download size={16} className="mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center gap-3 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-xl"
              onClick={() => onDownload(file)}
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
            {isImage && (
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-xl"
              >
                <ExternalLink size={16} className="mr-2" />
                Open Original
              </Button>
            )}
            <Button
              variant="ghost"
              className="text-red-400 hover:bg-white/20 rounded-xl"
              onClick={() => {
                onDelete(file);
                onOpenChange(false);
              }}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
