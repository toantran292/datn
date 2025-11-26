import { CreditCard, Calendar } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface TenantBillingCardProps {
  onManageSettings: () => void;
}

export function TenantBillingCard({ onManageSettings }: TenantBillingCardProps) {
  return (
    <Card className="p-6 shadow-md rounded-2xl border border-border">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="mb-1" style={{ fontWeight: 600 }}>Current Plan</h3>
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontWeight: 600, fontSize: '1.5rem', color: '#FF8800' }}>Pro – Monthly</span>
          </div>
          <Badge 
            variant="outline" 
            className="bg-orange-50 border-primary text-primary"
            style={{ fontSize: '0.75rem' }}
          >
            Tenant-level billing applies across all projects
          </Badge>
        </div>
        <Button 
          onClick={onManageSettings}
          className="bg-secondary hover:bg-secondary/90 text-white rounded-xl transition-all shadow-sm"
        >
          Manage Payment Settings
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-border">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Calendar size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Next Billing Date</p>
            <p style={{ fontWeight: 600 }}>December 15, 2025</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <CreditCard size={20} className="text-secondary" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Payment Method</p>
            <p style={{ fontWeight: 600 }}>•••• •••• •••• 4242</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span style={{ fontWeight: 600, color: '#FF8800' }}>$</span>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Current Cycle</p>
            <p style={{ fontWeight: 600, color: '#FF8800' }}>$2,847.00</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
