import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, MoreVertical, FileText, Image as ImageIcon, File } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FileItem {
  id: number;
  name: string;
  type: string;
  owner: string;
  date: string;
  size: string;
  project: string;
  thumbnail?: string;
  ownerAvatar?: string;
  url?: string;
}

interface FileCardProps {
  file: FileItem;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export function FileCard({ file, onPreview, onDownload, onDelete }: FileCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getFileIcon = () => {
    switch (file.type) {
      case "image":
        return <ImageIcon size={32} className="text-purple-500" />;
      case "pdf":
        return (
          <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path d="M14 2v6h6" />
          </svg>
        );
      case "document":
        return <FileText size={32} className="text-blue-500" />;
      case "spreadsheet":
        return (
          <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
            <path d="M14 2v6h6M9 13h6M9 17h6M9 9h1" fill="white" />
          </svg>
        );
      default:
        return <File size={32} className="text-gray-500" />;
    }
  };

  const getTypeColor = () => {
    switch (file.type) {
      case "image":
        return { bg: "#F5F3FF", color: "#8B5CF6" };
      case "pdf":
        return { bg: "#FEF2F2", color: "#DC2626" };
      case "document":
        return { bg: "#EFF6FF", color: "#2563EB" };
      case "spreadsheet":
        return { bg: "#F0FDF4", color: "#16A34A" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const getProjectColor = () => {
    const colors = [
      { bg: "bg-orange-50", text: "text-primary", border: "border-primary/20" },
      { bg: "bg-teal-50", text: "text-secondary", border: "border-secondary/20" },
      { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" }
    ];
    const hash = file.project.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const typeColor = getTypeColor();
  const projectColor = getProjectColor();
  const initials = file.owner
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="group bg-white rounded-xl border border-border overflow-hidden transition-all hover:shadow-lg hover:border-secondary/30 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPreview(file)}
    >
      {/* Thumbnail/Preview */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {file.type === "image" && file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: typeColor.bg }}>
            {getFileIcon()}
          </div>
        )}

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file);
              }}
            >
              <Eye size={16} className="mr-1" />
              Preview
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="bg-white/20 hover:bg-white/30 text-white rounded-lg backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file);
              }}
            >
              <Download size={16} className="mr-1" />
              Download
            </Button>
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm truncate mb-2" style={{ fontWeight: 600 }}>{file.name}</h4>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-md capitalize"
                style={{ backgroundColor: typeColor.bg, color: typeColor.color }}
              >
                {file.type}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${projectColor.bg} ${projectColor.text} ${projectColor.border}`}
              >
                {file.project}
              </Badge>
              <span className="text-xs text-muted-foreground">{file.size}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(file);
                }}
              >
                <Eye size={16} className="mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(file);
                }}
              >
                <Download size={16} className="mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(file);
                }}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5">
            <AvatarImage src={file.ownerAvatar} />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span>{file.owner}</span>
          <span>•</span>
          <span>{file.date}</span>
        </div>
      </div>
    </div>
  );
}
