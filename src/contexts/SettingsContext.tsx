import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface SettingsContextValue {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
  telegram: TelegramConfig;
  setTelegram: (config: TelegramConfig) => void;
  toKHR: (usd: number) => number;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [exchangeRate, setExchangeRate] = useState(4100);
  const [telegram, setTelegram] = useState<TelegramConfig>({ botToken: "", chatId: "" });

  const toKHR = useCallback((usd: number) => Math.round(usd * exchangeRate), [exchangeRate]);

  return (
    <SettingsContext.Provider value={{ exchangeRate, setExchangeRate, telegram, setTelegram, toKHR }}>
      {children}
    </SettingsContext.Provider>
  );
}
