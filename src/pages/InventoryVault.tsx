import { useState } from "react";
import { mockInventoryItems, mockWasteLogs } from "@/lib/mock-data";
import { ExportButton } from "@/components/shared/ExportButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function InventoryVault() {
  const [showWasteForm, setShowWasteForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory Vault</h1>
          <p className="text-sm text-muted-foreground">High-value stock tracking</p>
        </div>
        <ExportButton label="Export Excel" />
      </div>

      {/* Inventory Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-muted-foreground text-xs">Item</TableHead>
              <TableHead className="text-muted-foreground text-xs">Category</TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">Stock</TableHead>
              <TableHead className="text-muted-foreground text-xs text-center">Min</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">Unit Cost</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">Total Value</TableHead>
              <TableHead className="text-muted-foreground text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockInventoryItems.map((item) => {
              const low = item.currentStock < item.minStock;
              return (
                <TableRow key={item.id} className="border-border hover:bg-secondary/40">
                  <TableCell className="text-sm font-medium text-foreground">{item.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                  <TableCell className={cn("text-sm text-center font-semibold", low ? "text-destructive" : "text-foreground")}>
                    {item.currentStock} {item.unit}
                  </TableCell>
                  <TableCell className="text-xs text-center text-muted-foreground">{item.minStock}</TableCell>
                  <TableCell className="text-xs text-right text-foreground">${item.unitCost.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-right font-medium text-foreground">${item.totalValue.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[10px]",
                      low ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-success/15 text-success border-success/30"
                    )}>
                      {low ? "Low Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Waste Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Waste Log</h2>
          <Button size="sm" variant="outline" onClick={() => setShowWasteForm(!showWasteForm)} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Log Waste
          </Button>
        </div>

        {showWasteForm && (
          <div className="glass-card p-4 grid gap-3 sm:grid-cols-5 animate-slide-up">
            <Input placeholder="Item Name" className="bg-secondary border-border text-foreground" />
            <Input placeholder="Qty" type="number" className="bg-secondary border-border text-foreground" />
            <Input placeholder="Unit (kg/bottle)" className="bg-secondary border-border text-foreground" />
            <Input placeholder="Reason" className="bg-secondary border-border text-foreground" />
            <Button>Submit</Button>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Item</TableHead>
                <TableHead className="text-muted-foreground text-xs">Qty</TableHead>
                <TableHead className="text-muted-foreground text-xs">Reason</TableHead>
                <TableHead className="text-muted-foreground text-xs">Staff</TableHead>
                <TableHead className="text-muted-foreground text-xs">Date</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockWasteLogs.map((w) => (
                <TableRow key={w.id} className="border-border hover:bg-secondary/40">
                  <TableCell className="text-sm font-medium text-foreground">{w.itemName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{w.quantity} {w.unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{w.reason}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{w.staff}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{w.date}</TableCell>
                  <TableCell className="text-sm text-right font-medium text-destructive">${w.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
