"use client";

import { UserSettingsView } from "@/features/settings";

export default function UserSettingsRoute() {
  // User settings is accessible to all authenticated users
  return <UserSettingsView />;
}
