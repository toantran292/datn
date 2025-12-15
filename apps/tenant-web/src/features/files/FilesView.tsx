"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Upload, Filter, Grid3x3, List } from "lucide-react";
import { FileCard, FileItem } from "./components/FileCard";
import { ProjectStorageCard } from "./components/ProjectStorageCard";
import { StorageSummaryWidget } from "./components/StorageSummaryWidget";
import { FileUploadModal } from "./components/FileUploadModal";
import { FilePreviewModal } from "./components/FilePreviewModal";
import { toast } from "sonner";

interface ProjectStorage {
  id: number;
  name: string;
  storageUsed: number;
  storageQuota: number;
  fileCount: number;
  lastUpload: string;
}

const mockFiles: FileItem[] = [
  {
    id: 1,
    name: "Q4-Presentation.pdf",
    type: "pdf",
    owner: "Sarah Chen",
    date: "2 days ago",
    size: "2.4 MB",
    project: "Marketing Campaign 2025"
  },
  {
    id: 2,
    name: "Team-Photo-2024.jpg",
    type: "image",
    owner: "Michael Park",
    date: "5 days ago",
    size: "4.8 MB",
    project: "Product Development",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "Brand-Guidelines.pdf",
    type: "pdf",
    owner: "Emily Rodriguez",
    date: "1 week ago",
    size: "8.2 MB",
    project: "Marketing Campaign 2025"
  },
  {
    id: 4,
    name: "Product-Roadmap.docx",
    type: "document",
    owner: "James Wilson",
    date: "1 week ago",
    size: "156 KB",
    project: "Product Development"
  },
  {
    id: 5,
    name: "Office-Space.jpg",
    type: "image",
    owner: "Lisa Anderson",
    date: "2 weeks ago",
    size: "3.2 MB",
    project: "Customer Success Hub",
    thumbnail: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop"
  },
  {
    id: 6,
    name: "Budget-2024.xlsx",
    type: "spreadsheet",
    owner: "David Kim",
    date: "2 weeks ago",
    size: "892 KB",
    project: "Product Development"
  },
  {
    id: 7,
    name: "Marketing-Strategy.pdf",
    type: "pdf",
    owner: "Jessica Martinez",
    date: "3 weeks ago",
    size: "1.8 MB",
    project: "Marketing Campaign 2025"
  },
  {
    id: 8,
    name: "Design-Mockups.jpg",
    type: "image",
    owner: "Robert Taylor",
    date: "3 weeks ago",
    size: "5.6 MB",
    project: "Product Development",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop"
  },
  {
    id: 9,
    name: "User-Research.docx",
    type: "document",
    owner: "Sarah Chen",
    date: "1 month ago",
    size: "245 KB",
    project: "Customer Success Hub"
  },
  {
    id: 10,
    name: "Analytics-Report.xlsx",
    type: "spreadsheet",
    owner: "Michael Park",
    date: "1 month ago",
    size: "1.2 MB",
    project: "Product Development"
  },
  {
    id: 11,
    name: "Company-Event.jpg",
    type: "image",
    owner: "Emily Rodriguez",
    date: "1 month ago",
    size: "6.1 MB",
    project: "Marketing Campaign 2025",
    thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&h=300&fit=crop"
  },
  {
    id: 12,
    name: "Project-Proposal.pdf",
    type: "pdf",
    owner: "James Wilson",
    date: "2 months ago",
    size: "3.5 MB",
    project: "Customer Success Hub"
  }
];

const projectsData: ProjectStorage[] = [
  {
    id: 1,
    name: "Marketing Campaign 2025",
    storageUsed: 32.5,
    storageQuota: 50,
    fileCount: 45,
    lastUpload: "2 days ago"
  },
  {
    id: 2,
    name: "Product Development",
    storageUsed: 28.3,
    storageQuota: 50,
    fileCount: 67,
    lastUpload: "5 days ago"
  },
  {
    id: 3,
    name: "Customer Success Hub",
    storageUsed: 10.2,
    storageQuota: 25,
    fileCount: 23,
    lastUpload: "2 weeks ago"
  }
];

export function FilesView() {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedProjectView, setSelectedProjectView] = useState<number | null>(null);

  const filteredFiles = mockFiles.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.owner.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || file.project === projectFilter;
    const matchesType = typeFilter === "all" || file.type === typeFilter;
    const matchesProjectView = selectedProjectView === null ||
                                file.project === projectsData.find(p => p.id === selectedProjectView)?.name;
    return matchesSearch && matchesProject && matchesType && matchesProjectView;
  });

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleDownload = (file: FileItem) => {
    toast.success(`Downloading ${file.name}`, {
      description: "Your file will be ready in a moment.",
    });
  };

  const handleDelete = (file: FileItem) => {
    toast.success(`${file.name} deleted`, {
      description: "The file has been removed from your workspace.",
    });
  };

  const handleViewProjectFiles = (projectId: number) => {
    setSelectedProjectView(projectId);
  };

  const uniqueProjects = Array.from(new Set(mockFiles.map((f) => f.project)));

  return (
    <>
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* Main Content */}
          <div>
            {/* Header */}
            <div className="mb-6">
              <h1 className="mb-2" style={{ fontWeight: 600 }}>
                Files & Storage
              </h1>
              <p className="text-muted-foreground">
                Manage uploaded files across your projects
              </p>
            </div>

            {/* Filters Bar */}
            <div className="mb-6 flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search by name or owner..."
                  className="pl-10 rounded-xl bg-white border-border h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full lg:w-52 rounded-xl bg-white h-11">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project} value={project}>
                      {project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full lg:w-44 rounded-xl bg-white h-11">
                  <SelectValue placeholder="File Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setUploadOpen(true)}
                className="bg-secondary hover:bg-secondary/90 text-white rounded-xl shadow-sm h-11 lg:w-auto"
              >
                <Upload size={18} className="mr-2" />
                Upload
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all" className="w-full" onValueChange={() => setSelectedProjectView(null)}>
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-muted rounded-xl p-1">
                  <TabsTrigger value="projects" className="rounded-lg">
                    By Project
                  </TabsTrigger>
                  <TabsTrigger value="all" className="rounded-lg">
                    All Files
                  </TabsTrigger>
                </TabsList>

                {/* View Mode Toggle (only for All Files) */}
                <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-lg h-8 w-8 p-0"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 size={16} />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-lg h-8 w-8 p-0"
                    onClick={() => setViewMode("list")}
                  >
                    <List size={16} />
                  </Button>
                </div>
              </div>

              {/* By Project View */}
              <TabsContent value="projects" className="mt-0">
                {selectedProjectView === null ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projectsData.map((project) => (
                      <ProjectStorageCard
                        key={project.id}
                        projectName={project.name}
                        storageUsed={project.storageUsed}
                        storageQuota={project.storageQuota}
                        fileCount={project.fileCount}
                        lastUpload={project.lastUpload}
                        onViewFiles={() => handleViewProjectFiles(project.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h2 style={{ fontWeight: 600 }}>
                          {projectsData.find(p => p.id === selectedProjectView)?.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {filteredFiles.length} files
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedProjectView(null)}
                        className="rounded-xl"
                      >
                        Back to Projects
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={file}
                          onPreview={handlePreview}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* All Files View */}
              <TabsContent value="all" className="mt-0">
                {filteredFiles.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredFiles.map((file) => (
                        <FileCard
                          key={file.id}
                          file={file}
                          onPreview={handlePreview}
                          onDownload={handleDownload}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                    <div className="mt-6 text-sm text-muted-foreground">
                      Showing {filteredFiles.length} of {mockFiles.length} files
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-2xl flex items-center justify-center">
                      <Filter size={32} className="text-muted-foreground" />
                    </div>
                    <h3 style={{ fontWeight: 600 }} className="mb-2">No files found</h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters or search query
                    </p>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setSearchQuery("");
                        setProjectFilter("all");
                        setTypeFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar - Storage Summary */}
          <div className="hidden lg:block">
            <StorageSummaryWidget />
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <FileUploadModal open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* File Preview Modal */}
      <FilePreviewModal
        file={selectedFile}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </>
  );
}
