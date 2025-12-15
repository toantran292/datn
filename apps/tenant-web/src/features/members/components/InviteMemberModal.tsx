import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: {
    name: string;
    email: string;
    role: string;
    projects: number[];
  }) => void;
}

const availableProjects = [
  { id: 1, name: "Marketing Campaign 2025" },
  { id: 2, name: "Product Development" },
  { id: 3, name: "Customer Success Hub" }
];

export function InviteMemberModal({ open, onOpenChange, onInvite }: InviteMemberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite({ name, email, role, projects: selectedProjects });
    setName("");
    setEmail("");
    setRole("member");
    setSelectedProjects([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontWeight: 600 }}>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter member name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="member@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Tenant Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Organization-level role for this member
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <Label>Assign to Projects (optional)</Label>
              <p className="text-xs text-muted-foreground -mt-2 mb-2">
                Select projects this member should have access to
              </p>

              <div className="space-y-2.5">
                {availableProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedProjects.includes(project.id)
                        ? 'bg-secondary/5 border-secondary'
                        : 'bg-white border-border hover:border-secondary/30'
                    }`}
                    onClick={() => handleProjectToggle(project.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={() => handleProjectToggle(project.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <span className="text-white text-xs" style={{ fontWeight: 600 }}>
                            {project.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <label
                          htmlFor={`project-${project.id}`}
                          className="text-sm cursor-pointer"
                          style={{ fontWeight: 500 }}
                        >
                          {project.name}
                        </label>
                      </div>
                    </div>
                    {selectedProjects.includes(project.id) && (
                      <Badge className="bg-secondary/10 text-secondary border-0 text-xs">
                        Viewer
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {selectedProjects.length > 0 && (
                <p className="text-xs text-muted-foreground pt-2">
                  {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected.
                  Default role: Viewer (can be changed later)
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl bg-secondary hover:bg-secondary/90 text-white"
            >
              <Mail size={16} className="mr-2" />
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
