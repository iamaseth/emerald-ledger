import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, X } from "lucide-react";

interface CSVImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportModal({ open, onOpenChange }: CSVImportModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) setFile(dropped);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const reset = () => {
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Import CSV Data</DialogTitle>
        </DialogHeader>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
            }`}
          >
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium text-foreground">
              Drag & drop your CSV file here
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Supports MobiPOS exports & ABA bank statements
            </p>
            <label>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
              <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-4">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={reset}>Cancel</Button>
              <Button onClick={reset}>Import Data</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
