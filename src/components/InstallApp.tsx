"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS = "ol-install-dismissed";

const InstallContext = createContext<{ button: boolean; open: () => void } | null>(null);

function isIos() {
  const agent = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInstalled() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function InstallProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);

  useEffect(() => {
    const standalone = isInstalled();
    const apple = isIos();
    const hidden = localStorage.getItem(DISMISS) === "1";
    setInstalled(standalone);
    setIos(apple);
    setDismissed(hidden);
    setOpen(!standalone && !hidden);
    setReady(true);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function close() {
    localStorage.setItem(DISMISS, "1");
    setDismissed(true);
    setOpen(false);
  }

  async function install() {
    if (ios || !prompt) {
      setOpen(true);
      return;
    }
    await prompt.prompt();
    const choice = await prompt.userChoice;
    setPrompt(null);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      setOpen(false);
    }
  }

  const button = ready && !installed && dismissed;

  return (
    <InstallContext.Provider value={{ button, open: () => setOpen(true) }}>
      {children}
      {ready && open && !installed ? (
        <div className="ol-veil ol-dim fixed inset-0 z-[80] grid place-items-center px-4">
          <div role="dialog" aria-modal="true" aria-label="Install Owerri Life" className="ol-modal ol-pop w-full max-w-sm rounded-[1.8rem] p-5 text-[#17241e]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a9782a]">Web app</p>
            <h2 className="mt-1 font-display text-3xl leading-none">Install Owerri Life</h2>
            {ios ? (
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm leading-6 text-[#3d4a43]">
                <li>Open this page in Safari.</li>
                <li>Tap the Share button. It is the square with an arrow leaving the top.</li>
                <li>Scroll the sheet and tap Add to Home Screen.</li>
                <li>Tap Add. The app then sits on your home screen and opens full screen.</li>
              </ol>
            ) : (
              <>
                <p className="mt-3 text-sm leading-6 text-[#3d4a43]">
                  Add Owerri Life to your phone or tablet. It opens like an app, without the browser bar.
                </p>
                {prompt ? null : (
                  <p className="mt-2 text-sm leading-6 text-[#5d6b62]">
                    If the install window does not open, use the browser menu and choose Install app.
                  </p>
                )}
              </>
            )}
            <div className="mt-4 grid gap-2">
              {ios ? null : (
                <button type="button" onClick={() => void install()} className="rounded-full bg-[#1f6b45] py-3 text-sm font-semibold text-[#f6f1e6]">
                  Install
                </button>
              )}
              <button type="button" onClick={close} className="rounded-full bg-white py-3 text-sm font-semibold shadow-sm">
                Not now
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </InstallContext.Provider>
  );
}

export function InstallButton() {
  const install = useContext(InstallContext);
  if (!install?.button) return null;
  return (
    <button type="button" onClick={install.open} className="shrink-0 rounded-full bg-[#e0b15a] px-3 py-1 text-xs font-semibold text-[#1a140c]">
      Install
    </button>
  );
}
