'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
} from '@uts/design-system/ui';
import { Search, User } from 'lucide-react';

export default function UsersPage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage all users on the platform</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List - Placeholder */}
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Users Management</h3>
            <p className="text-sm">
              User listing and management functionality will be implemented
              once the Identity service admin endpoints are ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
