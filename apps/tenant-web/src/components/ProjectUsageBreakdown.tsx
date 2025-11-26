import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3, List, ExternalLink } from "lucide-react";
import { ProjectUsageDrawer } from "./ProjectUsageDrawer";

interface ProjectUsage {
  id: number;
  name: string;
  members: number;
  storage: number;
  cost: number;
  lastUpdated: string;
  color: string;
}

const projectsData: ProjectUsage[] = [
  {
    id: 1,
    name: "Marketing Campaign 2025",
    members: 12,
    storage: 32.5,
    cost: 892,
    lastUpdated: "2 hours ago",
    color: "#FF8800"
  },
  {
    id: 2,
    name: "Product Development",
    members: 24,
    storage: 28.3,
    cost: 1435,
    lastUpdated: "15 minutes ago",
    color: "#00C4AB"
  },
  {
    id: 3,
    name: "Customer Success Hub",
    members: 8,
    storage: 10.2,
    cost: 520,
    lastUpdated: "1 day ago",
    color: "#8B5CF6"
  }
];

export function ProjectUsageBreakdown() {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [selectedProject, setSelectedProject] = useState<ProjectUsage | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleProjectClick = (project: ProjectUsage) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const chartData = projectsData.map(p => ({
    name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
    fullName: p.name,
    members: p.members,
    storage: p.storage,
    cost: p.cost,
    color: p.color
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-border">
          <p className="mb-2" style={{ fontWeight: 600 }}>{payload[0].payload.fullName}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Members:</span>
              <span style={{ fontWeight: 600 }}>{payload[0].value}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Storage:</span>
              <span style={{ fontWeight: 600 }}>{payload[0].payload.storage} GB</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cost:</span>
              <span style={{ fontWeight: 600 }}>${payload[0].payload.cost}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="p-6 shadow-md rounded-2xl border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 style={{ fontWeight: 600 }}>Usage by Project</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Aggregated metrics across all active projects
            </p>
          </div>
          <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg h-8"
              onClick={() => setViewMode("table")}
            >
              <List size={16} className="mr-1.5" />
              Table
            </Button>
            <Button
              variant={viewMode === "chart" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg h-8"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 size={16} className="mr-1.5" />
              Chart
            </Button>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Project Name</TableHead>
                  <TableHead className="text-center">Members</TableHead>
                  <TableHead className="text-center">Storage Used</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsData.map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleProjectClick(project)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${project.color}15` }}
                        >
                          <span style={{ fontWeight: 600, color: project.color, fontSize: '0.875rem' }}>
                            {project.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <span style={{ fontWeight: 500 }}>{project.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">
                        {project.members} members
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-muted-foreground">{project.storage} GB</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span style={{ fontWeight: 600 }}>${project.cost.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{project.lastUpdated}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg hover:bg-secondary/10 hover:text-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProjectClick(project);
                        }}
                      >
                        <ExternalLink size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  style={{ fontSize: '0.75rem' }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '0.875rem' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="members"
                  fill="#00C4AB"
                  radius={[8, 8, 0, 0]}
                  onClick={(data) => {
                    const project = projectsData.find(p => p.name === data.fullName);
                    if (project) handleProjectClick(project);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <ProjectUsageDrawer
        project={selectedProject}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
