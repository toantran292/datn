import { useState } from "react";
import { TenantBillingCard } from "./TenantBillingCard";
import { ProjectUsageTable } from "./ProjectUsageTable";
import { CostTrendChart } from "./CostTrendChart";
import { InvoiceHistoryTable } from "./InvoiceHistoryTable";
import { BillingSettingsDrawer } from "./BillingSettingsDrawer";

export function BillingPage() {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  return (
    <div className="max-w-[1440px] mx-auto px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2" style={{ fontWeight: 600 }}>
          Billing & Usage Overview
        </h1>
        <p className="text-muted-foreground">
          Manage your organization's billing details and track project-based usage
        </p>
      </div>

      <div className="space-y-8">
        {/* Section 1: Tenant Billing Summary */}
        <TenantBillingCard onManageSettings={() => setShowSettingsDrawer(true)} />

        {/* Section 2: Project Usage Breakdown */}
        <ProjectUsageTable />

        {/* Section 3: Cost Trend & Forecast */}
        <CostTrendChart />

        {/* Section 4: Invoices & Payment History */}
        <InvoiceHistoryTable />
      </div>

      {/* Section 5: Billing Settings Drawer */}
      <BillingSettingsDrawer 
        open={showSettingsDrawer}
        onClose={() => setShowSettingsDrawer(false)}
      />
    </div>
  );
}
