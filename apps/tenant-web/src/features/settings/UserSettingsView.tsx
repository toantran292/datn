"use client";

import { UserSettings } from "./components/UserSettings";

export function UserSettingsView() {
  return (
    <div className="max-w-[900px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2" style={{ fontWeight: 600 }}>
          User Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your profile and notification preferences
        </p>
      </div>

      {/* User Settings */}
      <UserSettings />
    </div>
  );
}
