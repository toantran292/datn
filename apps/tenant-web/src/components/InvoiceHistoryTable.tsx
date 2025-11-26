import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface Invoice {
  id: string;
  invoiceId: string;
  date: string;
  amount: number;
  projects: string[];
  status: "Paid" | "Pending";
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceId: "INV-2025-001",
    date: "Nov 15, 2025",
    amount: 2780.00,
    projects: ["Marketing Campaign 2025", "Product Development", "Customer Success Hub"],
    status: "Paid"
  },
  {
    id: "2",
    invoiceId: "INV-2025-002",
    date: "Oct 15, 2025",
    amount: 2720.00,
    projects: ["Marketing Campaign 2025", "Product Development", "Customer Success Hub"],
    status: "Paid"
  },
  {
    id: "3",
    invoiceId: "INV-2025-003",
    date: "Sep 15, 2025",
    amount: 2620.00,
    projects: ["Marketing Campaign 2025", "Product Development"],
    status: "Paid"
  },
  {
    id: "4",
    invoiceId: "INV-2025-004",
    date: "Aug 15, 2025",
    amount: 2480.00,
    projects: ["Product Development", "Customer Success Hub"],
    status: "Paid"
  }
];

export function InvoiceHistoryTable() {
  return (
    <Card className="shadow-md rounded-2xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 style={{ fontWeight: 600 }}>Invoices & Payment History</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Download and review past invoices
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Invoice ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Projects Included</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <span style={{ fontWeight: 600 }}>{invoice.invoiceId}</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{invoice.date}</span>
                </TableCell>
                <TableCell>
                  <span style={{ fontWeight: 600 }}>${invoice.amount.toFixed(2)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {invoice.projects.map((project, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline"
                        className="bg-secondary/5 text-secondary border-secondary/20 text-xs"
                      >
                        {project}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={invoice.status === "Paid" ? "default" : "secondary"}
                    className={invoice.status === "Paid" 
                      ? "bg-green-100 text-green-700 border-0 hover:bg-green-100" 
                      : "bg-yellow-100 text-yellow-700 border-0"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-secondary/10 hover:text-secondary rounded-lg"
                  >
                    <Download size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
