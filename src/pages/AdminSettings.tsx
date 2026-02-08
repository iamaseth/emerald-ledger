import { useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, Send, Eye, EyeOff, Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { exchangeRate, setExchangeRate, telegram, setTelegram } = useSettings();

  const [rateInput, setRateInput] = useState(String(exchangeRate));
  const [botToken, setBotToken] = useState(telegram.botToken);
  const [chatId, setChatId] = useState(telegram.chatId);
  const [showToken, setShowToken] = useState(false);

  const handleSaveRate = () => {
    const parsed = parseInt(rateInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      toast.error("Enter a valid exchange rate");
      return;
    }
    setExchangeRate(parsed);
    toast.success(`Exchange rate updated to ${parsed.toLocaleString()} KHR/USD`);
  };

  const handleSaveTelegram = () => {
    setTelegram({ botToken, chatId });
    toast.success("Telegram settings saved");
  };

  const handleTestTelegram = () => {
    if (!botToken || !chatId) {
      toast.error("Please save Bot Token and Chat ID first");
      return;
    }
    toast.info("Test message sent (placeholder — connect backend to enable)");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Settings className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Settings</h1>
          <p className="text-sm text-muted-foreground">Global configuration for your POS system</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Exchange Rate Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Global Exchange Rate</CardTitle>
            </div>
            <CardDescription>
              Set the KHR/USD rate used across all financial reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exchange-rate" className="text-sm">KHR per 1 USD</Label>
              <div className="flex gap-2">
                <Input
                  id="exchange-rate"
                  type="number"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="bg-muted border-border"
                  min={1}
                />
                <Button onClick={handleSaveRate} size="sm" className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </Button>
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="rounded-md bg-muted/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Preview conversion</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">$100.00 USD</span>
                <span className="text-sm font-semibold text-primary">
                  {(100 * parseInt(rateInput || "0", 10)).toLocaleString()} KHR
                </span>
              </div>
            </div>

            <Badge variant="outline" className="text-xs gap-1 border-primary/30 text-primary">
              <CheckCircle className="h-3 w-3" />
              Current: {exchangeRate.toLocaleString()} KHR/USD
            </Badge>
          </CardContent>
        </Card>

        {/* Telegram Settings Card */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Telegram Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure automated daily summary reports via Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot-token" className="text-sm">Bot Token</Label>
              <div className="relative">
                <Input
                  id="bot-token"
                  type={showToken ? "text" : "password"}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="123456:ABC-DEF..."
                  className="bg-muted border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chat-id" className="text-sm">Chat ID</Label>
              <Input
                id="chat-id"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="-1001234567890"
                className="bg-muted border-border"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveTelegram} size="sm" className="gap-1.5">
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button onClick={handleTestTelegram} size="sm" variant="outline" className="gap-1.5">
                <Send className="h-3.5 w-3.5" />
                Test Message
              </Button>
            </div>

            <Separator className="bg-border" />

            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Daily reports include: Total Sales, Deposit Status, Reconciliation %, Top Staff, and Inventory Alerts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
