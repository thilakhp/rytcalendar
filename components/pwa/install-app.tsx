"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  return window.matchMedia(STANDALONE_QUERY).matches;
}

function getStandaloneServerSnapshot() {
  return false;
}

function subscribeNoop() {
  return () => {};
}

function getIsIOSSnapshot() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getIsIOSServerSnapshot() {
  return false;
}

export function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isIOS = useSyncExternalStore(subscribeNoop, getIsIOSSnapshot, getIsIOSServerSnapshot);
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) {
    return (
      <Card className="p-5 text-sm text-slate-500">
        You&apos;re already using the installed app. Nice.
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-900">Install on your phone</h3>
      <p className="mb-4 text-sm text-slate-500">
        Add RYT Training Planner to your home screen and use it like a native app.
      </p>

      {deferredPrompt ? (
        <Button
          onClick={async () => {
            await deferredPrompt.prompt();
            setDeferredPrompt(null);
          }}
        >
          <Download size={16} /> Add to Home Screen
        </Button>
      ) : isIOS ? (
        <p className="text-sm text-slate-600">
          Tap the Share button <Share size={14} className="inline" /> in Safari, then{" "}
          <strong>Add to Home Screen</strong>.
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          Open your browser menu and choose <strong>Add to Home Screen</strong> or{" "}
          <strong>Install App</strong>.
        </p>
      )}
    </Card>
  );
}
