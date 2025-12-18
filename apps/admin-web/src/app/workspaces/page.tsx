'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWorkspaces, lockWorkspace, unlockWorkspace, WorkspaceInfo } from '@/lib/api';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Badge,
} from '@uts/design-system/ui';
import { Search, Lock, Unlock, Eye, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'LOCKED' | undefined>();
  const [page, setPage] = useState(1);

  // Lock/Unlock dialog state
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceInfo | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [unlockNote, setUnlockNote] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['workspaces', { search, status: statusFilter, page }],
    queryFn: () => listWorkspaces({ search, status: statusFilter, page, limit: 10 }),
  });

  const lockMutation = useMutation({
    mutationFn: ({ workspaceId, reason }: { workspaceId: string; reason: string }) =>
      lockWorkspace(workspaceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setLockDialogOpen(false);
      setLockReason('');
      setSelectedWorkspace(null);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: ({ workspaceId, note }: { workspaceId: string; note?: string }) =>
      unlockWorkspace(workspaceId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setUnlockDialogOpen(false);
      setUnlockNote('');
      setSelectedWorkspace(null);
    },
  });

  const handleLockClick = (workspace: WorkspaceInfo) => {
    setSelectedWorkspace(workspace);
    setLockDialogOpen(true);
  };

  const handleUnlockClick = (workspace: WorkspaceInfo) => {
    setSelectedWorkspace(workspace);
    setUnlockDialogOpen(true);
  };

  const handleLockSubmit = () => {
    if (selectedWorkspace && lockReason.length >= 10) {
      lockMutation.mutate({ workspaceId: selectedWorkspace.id, reason: lockReason });
    }
  };

  const handleUnlockSubmit = () => {
    if (selectedWorkspace) {
      unlockMutation.mutate({ workspaceId: selectedWorkspace.id, note: unlockNote || undefined });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
        <p className="text-gray-500 mt-1">Manage all workspaces on the platform</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search workspaces..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === undefined ? 'default' : 'outline'}
                onClick={() => setStatusFilter(undefined)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'ACTIVE' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'LOCKED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('LOCKED')}
              >
                Locked
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workspaces List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          Failed to load workspaces
        </div>
      ) : (
        <div className="space-y-4">
          {data?.workspaces?.map((workspace) => (
            <Card key={workspace.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold ${
                        workspace.status === 'LOCKED' ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                    >
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                        <Badge variant={workspace.status === 'LOCKED' ? 'destructive' : 'default'}>
                          {workspace.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Owner: {workspace.owner?.displayName || workspace.owner?.email} |{' '}
                        {workspace.memberCount} members
                      </p>
                      {workspace.status === 'LOCKED' && workspace.lockReason && (
                        <p className="text-sm text-red-600 mt-1">
                          Reason: {workspace.lockReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/workspaces/${workspace.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    {workspace.status === 'ACTIVE' ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleLockClick(workspace)}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUnlockClick(workspace)}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data?.workspaces?.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No workspaces found
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Lock Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Lock Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              You are about to lock workspace <strong>{selectedWorkspace?.name}</strong>.
              All members will be notified and will have read-only access.
            </p>
            <div>
              <label className="text-sm font-medium">Reason (required, min 10 characters)</label>
              <Textarea
                value={lockReason}
                onChange={(e) => setLockReason(e.target.value)}
                placeholder="Enter the reason for locking this workspace..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLockSubmit}
              disabled={lockReason.length < 10 || lockMutation.isPending}
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-500" />
              Unlock Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              You are about to unlock workspace <strong>{selectedWorkspace?.name}</strong>.
              All members will regain full access.
            </p>
            <div>
              <label className="text-sm font-medium">Note (optional)</label>
              <Textarea
                value={unlockNote}
                onChange={(e) => setUnlockNote(e.target.value)}
                placeholder="Add a note about unlocking..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnlockSubmit} disabled={unlockMutation.isPending}>
              {unlockMutation.isPending ? 'Unlocking...' : 'Unlock Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
