import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const projects = [
  "Marketing Campaign 2025",
  "Product Development",
  "Customer Success Hub"
];

export function FileUploadModal({ open, onOpenChange }: FileUploadModalProps) {
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedProject) {
      toast.error("Please select a project");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    toast.success(`File uploaded to ${selectedProject}`, {
      description: `${selectedFile.name} has been uploaded successfully.`
    });

    // Reset form
    setSelectedProject("");
    setSelectedFile(null);
    setTags("");
    setDescription("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedProject("");
    setSelectedFile(null);
    setTags("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontWeight: 600 }}>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to one of your projects
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger id="project" className="rounded-xl">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div className="relative">
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-secondary hover:bg-secondary/5 transition-colors"
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
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleUpload}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm"
          >
            <Upload size={16} className="mr-2" />
            Upload
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
