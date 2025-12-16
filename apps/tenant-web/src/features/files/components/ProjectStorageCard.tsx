import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HardDrive, Clock } from "lucide-react";

interface ProjectStorageCardProps {
  projectName: string;
  storageUsed: number;
  storageQuota: number;
  fileCount: number;
  lastUpload: string;
  onViewFiles: () => void;
}

export function ProjectStorageCard({
  projectName,
  storageUsed,
  storageQuota,
  fileCount,
  lastUpload,
  onViewFiles
}: ProjectStorageCardProps) {
  const usagePercent = (storageUsed / storageQuota) * 100;
  const projectInitials = projectName.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
            <span className="text-white" style={{ fontWeight: 600 }}>
              {projectInitials}
            </span>
          </div>
          <div>
            <h3 style={{ fontWeight: 600 }}>{projectName}</h3>
            <p className="text-sm text-muted-foreground">{fileCount} files</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onViewFiles}
          className="bg-secondary hover:bg-secondary/90 text-white rounded-lg"
        >
          View Files
        </Button>
      </div>

      <div className="space-y-4">
        {/* Storage Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HardDrive size={16} />
              <span>Storage Used</span>
            </div>
            <span className="text-sm" style={{ fontWeight: 600 }}>
              {storageUsed.toFixed(1)} GB / {storageQuota} GB
            </span>
          </div>
          <Progress value={usagePercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {usagePercent.toFixed(0)}% of quota used
          </p>
        </div>

        {/* Last Upload */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={16} />
            <span>Last upload</span>
          </div>
          <span className="text-sm" style={{ fontWeight: 500 }}>
            {lastUpload}
          </span>
        </div>
      </div>
    </Card>
  );
}
