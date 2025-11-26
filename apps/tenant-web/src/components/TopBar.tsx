import React from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

interface User {
  user_id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

interface TopBarProps {
  user: User;
}

export function TopBar({ user }: TopBarProps) {
  // Generate initials from display_name or email
  const getInitials = () => {
    if (user.display_name) {
      return user.display_name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email[0].toUpperCase();
  };

  const displayName = user.display_name || user.email.split('@')[0];

  return (
    <div className="h-16 bg-white border-b border-border flex items-center px-6 gap-6 w-full" style={{ justifyContent: "space-between" }}>
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search anything..."
            className="pl-10 bg-muted border-0 h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-[180px]" style={{ justifyContent: "flex-end", width: "180px" }}>
        <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
          <Bell size={20} className="text-foreground" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary border-2 border-white">
            3
          </Badge>
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm leading-tight">{displayName}</span>
            <span className="text-xs text-muted-foreground leading-tight">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
