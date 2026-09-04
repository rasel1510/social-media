"use client";

import { useEffect, useState } from "react";

export function PWAInit() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Already dismissed by user before? Never show again.
    if (localStorage.getItem("pwa-dismissed") === "true") return;

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as any).MSStream;
    setIsIOS(ios);

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    if (!standalone) {
      setVisible(true);
    }

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => console.log("[PWA] SW registered:", reg.scope))
        .catch((err) => console.error("[PWA] SW failed:", err));
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", () => {
      setVisible(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setVisible(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        setDeferredPrompt(null);
        localStorage.setItem("pwa-dismissed", "true");
      }
    } else if (isIOS) {
      setShowIOSSheet(true);
    }
  };

  if (isStandalone || !visible) return null;

  return (
    <>
      {/* ── Bottom-right install card ────────────────────────────── */}
      <div
        id="pwa-install-card"
        role="dialog"
        aria-modal="true"
        aria-label="Install App"
        style={{
          position: "fixed",
          bottom: 28,
          right: 24,
          zIndex: 9990,
          width: 320,
          background: "linear-gradient(160deg, #0f0f1c 0%, #1c1040 60%, #0d0d1c 100%)",
          border: "1px solid rgba(139,92,246,0.4)",
          borderRadius: 20,
          padding: "22px 22px 20px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
          animation: "pwaSlideUp 0.35s cubic-bezier(0.34,1.4,0.64,1)",
        }}
      >
        {/* ── Cross / dismiss button ───────────────── */}
        <button
          id="pwa-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.5)",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            lineHeight: 1,
            flexShrink: 0,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.5)";
          }}
        >
          ✕
        </button>

        {/* ── Icon + title row ─────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,58,237,0.45) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon-192x192.png"
              alt=""
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                position: "relative",
                boxShadow: "0 6px 20px rgba(124,58,237,0.4)",
              }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>
              Install App
            </p>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
              Add to home screen for a native experience
            </p>
          </div>
        </div>

        {/* ── Feature pills ────────────────────────── */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 18 }}>
          {["⚡ Faster", "📴 Offline", "🔔 Notifications"].map((f) => (
            <span
              key={f}
              style={{
                background: "rgba(139,92,246,0.13)",
                border: "1px solid rgba(139,92,246,0.28)",
                borderRadius: 999,
                padding: "4px 11px",
                fontSize: 11,
                color: "#c4b5fd",
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* ── CTA button ───────────────────────────── */}
        <button
          id="pwa-install-btn"
          onClick={handleInstallClick}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontSize: 14,
            fontWeight: 700,
            padding: "13px",
            cursor: "pointer",
            letterSpacing: "0.2px",
            boxShadow: "0 4px 18px rgba(124,58,237,0.5)",
            transition: "opacity 0.15s, transform 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.88";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = "1";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          Install
        </button>
      </div>

      {/* ── iOS instructions bottom sheet ───────────────────────── */}
      {showIOSSheet && (
        <>
          <div
            onClick={() => setShowIOSSheet(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9998,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
              animation: "pwaFadeIn 0.2s ease",
            }}
          />
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: "linear-gradient(160deg, #0f0f1a 0%, #1a1030 100%)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderBottom: "none",
              borderRadius: "20px 20px 0 0",
              padding: "28px 24px 40px",
              animation: "pwaSheetUp 0.28s cubic-bezier(0.34,1.3,0.64,1)",
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 24px" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon-192x192.png" alt="" style={{ width: 44, height: 44, borderRadius: 10 }} />
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Install App</p>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)" }}>Add to your iOS home screen</p>
              </div>
            </div>

            <ol style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                <>Tap the <span style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: 6, padding: "1px 7px", fontSize: 13, color: "#c4b5fd" }}>⎋ Share</span> button in Safari</>,
                <>Scroll down and tap <strong style={{ color: "#a78bfa" }}>"Add to Home Screen"</strong></>,
                <>Tap <strong style={{ color: "#a78bfa" }}>Add</strong> to confirm</>,
              ].map((step, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", marginTop: 1 }}>
                    {i + 1}
                  </span>
                  <span style={{ paddingTop: 2 }}>{step}</span>
                </li>
              ))}
            </ol>

            <button
              id="pwa-ios-got-it"
              onClick={() => setShowIOSSheet(false)}
              style={{ width: "100%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, padding: "14px", cursor: "pointer", boxShadow: "0 4px 20px rgba(124,58,237,0.4)" }}
            >
              Got it
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes pwaFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pwaSheetUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0);    }
        }
      `}</style>
    </>
  );
}
