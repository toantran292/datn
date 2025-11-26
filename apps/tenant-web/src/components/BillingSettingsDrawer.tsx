import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BillingSettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function BillingSettingsDrawer({ open, onClose }: BillingSettingsDrawerProps) {
  const [formData, setFormData] = useState({
    orgName: "Acme Corporation",
    billingEmail: "billing@acmecorp.com",
    cardNumber: "•••• •••• •••• 4242",
    address: "123 Business Ave, Suite 100",
    city: "San Francisco",
    zipCode: "94102",
    country: "United States",
    taxId: "12-3456789"
  });

  const handleSave = () => {
    toast.success("Billing settings updated successfully");
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle style={{ fontWeight: 600 }}>Billing Settings</SheetTitle>
          <SheetDescription>
            Manage your organization's billing information and payment methods
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-4">
            <h4 style={{ fontWeight: 600 }}>Organization Details</h4>

            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={formData.orgName}
                onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                className="rounded-xl border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input
                id="billingEmail"
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                className="rounded-xl border-border"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h4 style={{ fontWeight: 600 }}>Payment Method</h4>

            <div className="p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-secondary" />
                </div>
                <div>
                  <p style={{ fontWeight: 600 }}>Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg border-secondary text-secondary hover:bg-secondary/10"
              >
                Update
              </Button>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h4 style={{ fontWeight: 600 }}>Billing Address</h4>

            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="rounded-xl border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="rounded-xl border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className="rounded-xl border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="rounded-xl border-border"
              />
            </div>
          </div>

          {/* Tax Information */}
          <div className="space-y-4 pt-6 border-t border-border">
            <h4 style={{ fontWeight: 600 }}>Tax Information</h4>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / VAT Number</Label>
              <Input
                id="taxId"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="rounded-xl border-border"
              />
              <p className="text-xs text-muted-foreground">
                Optional: For tax exemption and invoicing purposes
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-sm"
            >
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl border-border"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
