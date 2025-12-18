"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Folder, MoreVertical, Trash2, FolderOpen } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FolderItem } from "../hooks/useWorkspaceFiles";

interface FolderCardProps {
  folder: FolderItem;
  onOpen: (folder: FolderItem) => void;
  onDelete?: (folder: FolderItem) => void;
  canDelete?: boolean;
}

export function FolderCard({ folder, onOpen, onDelete, canDelete = false }: FolderCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group bg-white rounded-xl border border-border overflow-hidden transition-all hover:shadow-lg hover:border-secondary/30 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(folder)}
    >
      {/* Folder Icon */}
      <div className="relative aspect-[4/3] bg-amber-50 overflow-hidden flex items-center justify-center">
        {isHovered ? (
          <FolderOpen size={48} className="text-amber-500" />
        ) : (
          <Folder size={48} className="text-amber-500" />
        )}
      </div>

      {/* Folder Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm truncate mb-1" style={{ fontWeight: 600 }}>
              {folder.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {new Date(folder.createdAt).toLocaleDateString()}
            </p>
          </div>
          {canDelete && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(folder);
                  }}
                >
                  <Trash2 size={16} className="mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
