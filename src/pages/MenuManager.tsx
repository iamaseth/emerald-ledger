import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const CATEGORIES = ["Liquor", "Beer", "Wine", "Food", "Chemicals", "Supplies", "Soft Drinks", "Other"];

interface MenuItem {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stockLevel: number;
}

const initialItems: MenuItem[] = [
  { id: "1", name: "Angkor Beer", category: "Beer", costPrice: 0.80, salePrice: 2.50, stockLevel: 120 },
  { id: "2", name: "Cambodia Lager", category: "Beer", costPrice: 0.70, salePrice: 2.00, stockLevel: 80 },
  { id: "3", name: "Absolut Vodka", category: "Liquor", costPrice: 12.00, salePrice: 35.00, stockLevel: 15 },
  { id: "4", name: "Jack Daniel's", category: "Liquor", costPrice: 18.00, salePrice: 45.00, stockLevel: 8 },
  { id: "5", name: "Fish Amok", category: "Food", costPrice: 2.50, salePrice: 8.00, stockLevel: 0 },
  { id: "6", name: "Lok Lak", category: "Food", costPrice: 3.00, salePrice: 7.50, stockLevel: 0 },
  { id: "7", name: "Floor Cleaner", category: "Chemicals", costPrice: 3.50, salePrice: 0, stockLevel: 25 },
  { id: "8", name: "Dish Soap", category: "Chemicals", costPrice: 2.00, salePrice: 0, stockLevel: 40 },
  { id: "9", name: "Red Wine House", category: "Wine", costPrice: 6.00, salePrice: 18.00, stockLevel: 22 },
  { id: "10", name: "Coca Cola", category: "Soft Drinks", costPrice: 0.40, salePrice: 1.50, stockLevel: 200 },
];

const fmt = (n: number) => `$${n.toFixed(2)}`;

export default function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showBulk, setShowBulk] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stockLevel, setStockLevel] = useState("");

  // Bulk update fields
  const [bulkCategory, setBulkCategory] = useState("All");
  const [bulkMode, setBulkMode] = useState<"percent" | "fixed">("percent");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkDirection, setBulkDirection] = useState<"increase" | "decrease">("increase");

  const filtered = useMemo(() => {
    let list = items;
    if (catFilter !== "All") list = list.filter((i) => i.category === catFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return list;
  }, [items, search, catFilter]);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items]);

  function resetForm() {
    setName(""); setCategory("Food"); setCostPrice(""); setSalePrice(""); setStockLevel(""); setEditId(null);
  }

  function handleSubmit() {
    if (!name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const cost = parseFloat(costPrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    const stock = parseInt(stockLevel) || 0;

    if (editId) {
      setItems((prev) => prev.map((i) => i.id === editId ? { ...i, name: name.trim(), category, costPrice: cost, salePrice: sale, stockLevel: stock } : i));
      toast({ title: "Item updated" });
    } else {
      setItems((prev) => [...prev, { id: Date.now().toString(), name: name.trim(), category, costPrice: cost, salePrice: sale, stockLevel: stock }]);
      toast({ title: "Item added" });
    }
    resetForm();
    setShowForm(false);
  }

  function openEdit(item: MenuItem) {
    setEditId(item.id);
    setName(item.name); setCategory(item.category);
    setCostPrice(String(item.costPrice)); setSalePrice(String(item.salePrice));
    setStockLevel(String(item.stockLevel));
    setShowForm(true);
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Item deleted" });
  }

  function handleBulkUpdate() {
    const val = parseFloat(bulkValue);
    if (isNaN(val) || val <= 0) { toast({ title: "Invalid value", variant: "destructive" }); return; }

    setItems((prev) =>
      prev.map((item) => {
        if (bulkCategory !== "All" && item.category !== bulkCategory) return item;
        if (item.salePrice === 0) return item; // skip non-sale items

        let newPrice = item.salePrice;
        if (bulkMode === "percent") {
          const delta = item.salePrice * (val / 100);
          newPrice = bulkDirection === "increase" ? item.salePrice + delta : item.salePrice - delta;
        } else {
          newPrice = bulkDirection === "increase" ? item.salePrice + val : item.salePrice - val;
        }
        return { ...item, salePrice: Math.max(0, Math.round(newPrice * 100) / 100) };
      })
    );

    const affected = bulkCategory === "All" ? items.filter((i) => i.salePrice > 0).length : items.filter((i) => i.category === bulkCategory && i.salePrice > 0).length;
    toast({ title: "Bulk update applied", description: `${affected} items updated` });
    setShowBulk(false);
    setBulkValue("");
  }

  const margin = (item: MenuItem) => item.salePrice > 0 ? ((item.salePrice - item.costPrice) / item.salePrice * 100).toFixed(0) : "—";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Menu Manager</h1>
          <p className="text-sm text-muted-foreground">Add, edit, and manage items & categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowBulk(true)}>
            <Percent className="mr-2 h-4 w-4" /> Bulk Price Update
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items by name..." className="pl-9 bg-secondary border-border" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Items</p>
            <p className="text-lg font-bold text-foreground">{items.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Categories</p>
            <p className="text-lg font-bold text-foreground">{categories.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Low Stock</p>
            <p className="text-lg font-bold text-warning">{items.filter((i) => i.stockLevel > 0 && i.stockLevel < 10).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Avg Margin</p>
            <p className="text-lg font-bold text-success">
              {(items.filter((i) => i.salePrice > 0).reduce((s, i) => s + ((i.salePrice - i.costPrice) / i.salePrice * 100), 0) / Math.max(items.filter((i) => i.salePrice > 0).length, 1)).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                <TableHead className="text-muted-foreground text-xs">Category</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Cost</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Sale Price</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Margin</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Stock</TableHead>
                <TableHead className="text-muted-foreground text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No items found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => {
                  const m = parseFloat(margin(item));
                  return (
                    <TableRow key={item.id} className="border-border hover:bg-secondary/40">
                      <TableCell className="text-sm font-medium text-foreground">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-secondary text-muted-foreground border-border">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono text-muted-foreground">{fmt(item.costPrice)}</TableCell>
                      <TableCell className="text-xs text-right font-mono text-foreground font-medium">
                        {item.salePrice > 0 ? fmt(item.salePrice) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={cn("font-semibold", !isNaN(m) && m >= 50 ? "text-success" : !isNaN(m) && m > 0 ? "text-warning" : "text-muted-foreground")}>
                          {margin(item)}{margin(item) !== "—" ? "%" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span className={cn(item.stockLevel > 0 && item.stockLevel < 10 ? "text-warning font-semibold" : "text-foreground")}>
                          {item.stockLevel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(o) => { if (!o) { resetForm(); setShowForm(false); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editId ? "Edit Item" : "Add Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cost Price ($)</Label>
                <Input type="number" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Sale Price ($)</Label>
                <Input type="number" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Stock Level</Label>
              <Input type="number" value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} placeholder="0" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Price Update Dialog */}
      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bulk Price Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Target Category</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  <SelectItem value="All">All Categories</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={bulkDirection} onValueChange={(v) => setBulkDirection(v as "increase" | "decrease")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="increase">Increase ↑</SelectItem>
                    <SelectItem value="decrease">Decrease ↓</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Select value={bulkMode} onValueChange={(v) => setBulkMode(v as "percent" | "fixed")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="percent">Percentage %</SelectItem>
                    <SelectItem value="fixed">Fixed Amount $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{bulkMode === "percent" ? "Percentage (%)" : "Amount ($)"}</Label>
              <Input type="number" step="0.01" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder={bulkMode === "percent" ? "e.g. 10" : "e.g. 0.50"} />
            </div>
            <p className="text-xs text-muted-foreground">
              This will {bulkDirection} sale prices for {bulkCategory === "All" ? "all categories" : `"${bulkCategory}"`} by {bulkValue || "0"}{bulkMode === "percent" ? "%" : "$"}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulk(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate}>Apply Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
