"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export const DEV_LOG_ONLY_STORAGE_KEY = "devLogOnly";

export const isDevLogOnlyEnabled = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEV_LOG_ONLY_STORAGE_KEY) === "true";
};

const isLocalhost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
};

const DevLogToggle = () => {
  const [visible, setVisible] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isLocalhost()) return;
    setVisible(true);
    setEnabled(isDevLogOnlyEnabled());
  }, []);

  if (!visible) return null;

  const handleChange = (next: boolean) => {
    setEnabled(next);
    window.localStorage.setItem(
      DEV_LOG_ONLY_STORAGE_KEY,
      next ? "true" : "false"
    );
  };

  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-yellow-500/60 bg-yellow-500/10 px-3 py-2 text-sm">
      <label htmlFor="dev-log-toggle" className="cursor-pointer">
        Log로 대체
      </label>
      <Switch
        id="dev-log-toggle"
        checked={enabled}
        onCheckedChange={handleChange}
      />
    </div>
  );
};

export default DevLogToggle;
