'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkspace,
  getWorkspaceMembers,
  lockWorkspace,
  unlockWorkspace,
  revokeOwnership,
} from '@/lib/api';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@uts/design-system/ui';
import {
  ArrowLeft,
  Lock,
  Unlock,
  UserCog,
  AlertTriangle,
  Calendar,
  Users,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const workspaceId = params.workspaceId as string;

  // Dialog states
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [unlockNote, setUnlockNote] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [removeCurrentOwner, setRemoveCurrentOwner] = useState(false);

  const { data: workspace, isLoading: workspaceLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => getWorkspace(workspaceId),
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId),
  });

  const lockMutation = useMutation({
    mutationFn: (reason: string) => lockWorkspace(workspaceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      setLockDialogOpen(false);
      setLockReason('');
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (note?: string) => unlockWorkspace(workspaceId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      setUnlockDialogOpen(false);
      setUnlockNote('');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: () =>
      revokeOwnership(workspaceId, {
        reason: revokeReason,
        newOwnerId: newOwnerId || undefined,
        removeCurrentOwner,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      setRevokeDialogOpen(false);
      setRevokeReason('');
      setNewOwnerId('');
      setRemoveCurrentOwner(false);
    },
  });

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">Workspace not found</div>
    );
  }

  const nonOwnerMembers = membersData?.members?.filter((m) => m.role !== 'OWNER') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/workspaces">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
            <Badge variant={workspace.status === 'LOCKED' ? 'destructive' : 'default'}>
              {workspace.status}
            </Badge>
          </div>
          <p className="text-gray-500 mt-1">Slug: {workspace.slug}</p>
        </div>
        <div className="flex gap-2">
          {workspace.status === 'ACTIVE' ? (
            <Button variant="destructive" onClick={() => setLockDialogOpen(true)}>
              <Lock className="h-4 w-4 mr-2" />
              Lock Workspace
            </Button>
          ) : (
            <Button onClick={() => setUnlockDialogOpen(true)}>
              <Unlock className="h-4 w-4 mr-2" />
              Unlock Workspace
            </Button>
          )}
          <Button variant="outline" onClick={() => setRevokeDialogOpen(true)}>
            <UserCog className="h-4 w-4 mr-2" />
            Change Owner
          </Button>
        </div>
      </div>

      {/* Lock Info */}
      {workspace.status === 'LOCKED' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-700">Workspace is Locked</h3>
                <p className="text-sm text-red-600 mt-1">
                  <strong>Reason:</strong> {workspace.lockReason}
                </p>
                {workspace.lockedAt && (
                  <p className="text-sm text-red-500 mt-1">
                    Locked at: {new Date(workspace.lockedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workspace Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Owner Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {workspace.owner?.displayName?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="font-medium">{workspace.owner?.displayName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {workspace.owner?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Members
              </span>
              <span className="font-medium">{workspace.memberCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Created
              </span>
              <span className="font-medium">
                {new Date(workspace.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({membersData?.members?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="divide-y">
              {membersData?.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium">
                      {member.displayName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{member.displayName}</p>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      member.role === 'OWNER'
                        ? 'default'
                        : member.role === 'ADMIN'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              You are about to lock workspace <strong>{workspace.name}</strong>. All
              members will be notified and will have read-only access.
            </p>
            <div>
              <label className="text-sm font-medium">
                Reason (required, min 10 characters)
              </label>
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
              onClick={() => lockMutation.mutate(lockReason)}
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
              You are about to unlock workspace <strong>{workspace.name}</strong>. All
              members will regain full access.
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
            <Button
              onClick={() => unlockMutation.mutate(unlockNote || undefined)}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? 'Unlocking...' : 'Unlock Workspace'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Ownership Dialog */}
      <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-orange-500" />
              Change Workspace Owner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Current owner: <strong>{workspace.owner?.displayName}</strong> (
              {workspace.owner?.email})
            </p>

            <div>
              <label className="text-sm font-medium">
                Reason (required, min 10 characters)
              </label>
              <Textarea
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                placeholder="Enter the reason for changing ownership..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium">New Owner (optional)</label>
              <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new owner or leave empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No new owner</SelectItem>
                  {nonOwnerMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.displayName} ({member.email}) - {member.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="removeOwner"
                checked={removeCurrentOwner}
                onChange={(e) => setRemoveCurrentOwner(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="removeOwner" className="text-sm">
                Remove current owner from workspace entirely
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeMutation.mutate()}
              disabled={revokeReason.length < 10 || revokeMutation.isPending}
            >
              {revokeMutation.isPending ? 'Processing...' : 'Change Owner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
