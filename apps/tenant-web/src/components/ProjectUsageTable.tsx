import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

interface ProjectUsage {
  id: string;
  name: string;
  activeSeats: number;
  storageUsed: number;
  lastActivity: string;
  costContribution: number;
}

const projectUsageData: ProjectUsage[] = [
  {
    id: "1",
    name: "Marketing Campaign 2025",
    activeSeats: 12,
    storageUsed: 45.3,
    lastActivity: "2 hours ago",
    costContribution: 892.00
  },
  {
    id: "2",
    name: "Product Development",
    activeSeats: 24,
    storageUsed: 128.7,
    lastActivity: "15 minutes ago",
    costContribution: 1435.00
  },
  {
    id: "3",
    name: "Customer Success Hub",
    activeSeats: 8,
    storageUsed: 22.1,
    lastActivity: "1 day ago",
    costContribution: 520.00
  }
];

export function ProjectUsageTable() {
  const totalCost = projectUsageData.reduce((sum, project) => sum + project.costContribution, 0);
  
  return (
    <Card className="shadow-md rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 style={{ fontWeight: 600 }}>Usage by Project</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Track resource consumption and costs across all projects
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Project Name</TableHead>
              <TableHead className="text-center">Active Seats</TableHead>
              <TableHead className="text-center">Storage Used</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Cost Contribution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectUsageData.map((project) => (
              <TableRow key={project.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <span className="text-white text-xs" style={{ fontWeight: 600 }}>
                        {project.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <span style={{ fontWeight: 500 }}>{project.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-0">
                    {project.activeSeats} seats
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-muted-foreground">{project.storageUsed} GB</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-sm">{project.lastActivity}</span>
                </TableCell>
                <TableCell className="text-right">
                  <span style={{ fontWeight: 600 }}>${project.costContribution.toFixed(2)}</span>
                </TableCell>
              </TableRow>
            ))}
            
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell colSpan={4}>
                <span style={{ fontWeight: 600 }}>Total monthly cost (all projects combined)</span>
              </TableCell>
              <TableCell className="text-right">
                <span style={{ fontWeight: 600, fontSize: '1.125rem', color: '#FF8800' }}>
                  ${totalCost.toFixed(2)}
                </span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
