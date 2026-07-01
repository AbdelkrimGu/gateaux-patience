"use client";

// 2D ⇄ 3D preview switch for the customizer.
//
//  • The 2D canvas (TiramisuCanvas) is the guaranteed fallback and is always
//    used when WebGL is unavailable.
//  • The 3D scene is route-split (next/dynamic, ssr:false) so the three stack
//    never touches the initial bundle or any other route.
//  • Choice is remembered in localStorage. prefers-reduced-motion disables the
//    idle spin / intro; a weak-GPU heuristic trims shadow + DPR.
//  • The render loop pauses whenever the preview scrolls off-screen or the tab
//    is hidden (IntersectionObserver + visibilitychange).

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { Box, Square, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import TiramisuCanvas from "./TiramisuCanvas";
import type { ShapeKey } from "@/lib/tiramisu-layout";
import type { ViewKey } from "./three/TiramisuScene3D";
import type { Locale, TiramisuSize, TiramisuStyle } from "@/lib/tiramisu-config";

const TiramisuScene3D = dynamic(() => import("./three/TiramisuScene3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 shimmer" />,
});

const LS_KEY = "tiramisu-preview-mode";

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

interface Props {
  style: TiramisuStyle;
  size: TiramisuSize;
  text: string;
  shape?: ShapeKey;
}

export default function TiramisuPreview({ style, size, text, shape = "round" }: Props) {
  const locale = useLocale() as Locale;
  const t = (fr: string, ar: string, en: string) =>
    locale === "ar" ? ar : locale === "en" ? en : fr;

  const [webgl, setWebgl] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [lowPower, setLowPower] = useState(false);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"2d" | "3d">("2d");
  const [view, setView] = useState<{ key: ViewKey; nonce: number }>({ key: "hero", nonce: 0 });
  const [activePreset, setActivePreset] = useState<ViewKey>("hero");

  function goView(key: ViewKey) {
    setActivePreset(key);
    setView({ key, nonce: Date.now() });
  }

  // Capability detection (client only).
  useEffect(() => {
    const gl = detectWebGL();
    const rm =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    const weak =
      !!nav &&
      (((nav as any).deviceMemory && (nav as any).deviceMemory <= 4) ||
        (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4));
    setWebgl(gl);
    setReduced(!!rm);
    setLowPower(!!weak);

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LS_KEY);
    } catch {
      /* ignore */
    }
    // Default: 3D on capable devices; else the flawless 2D canvas.
    setMode(gl ? (stored === "2d" ? "2d" : "3d") : "2d");
    setReady(true);
  }, []);

  // Pause the render loop when hidden / off-screen. Track visibility (tab) and
  // intersection (scroll) SEPARATELY so one flip can't clobber the other.
  const wrapRef = useRef<HTMLDivElement>(null);
  const [intersecting, setIntersecting] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || mode !== "3d") return;
    const io = new IntersectionObserver(([e]) => setIntersecting(e.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    const onVis = () => setVisible(!document.hidden && document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", onVis);
    onVis();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mode]);
  const onScreen = visible && intersecting;

  function choose(next: "2d" | "3d") {
    setMode(next);
    try {
      localStorage.setItem(LS_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const presets: { key: ViewKey; label: string }[] = useMemo(
    () => [
      { key: "top", label: t("Dessus", "أعلى", "Top") },
      { key: "hero", label: t("3/4", "3/4", "3/4") },
      { key: "side", label: t("Côté", "جانب", "Side") },
    ],
    [locale] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const show3D = ready && webgl && mode === "3d";

  const shapeName = t(
    shape === "heart" ? "cœur" : shape === "square" ? "carrée" : shape === "oval" ? "ovale" : "ronde",
    shape === "heart" ? "قلب" : shape === "square" ? "مربّع" : shape === "oval" ? "بيضاوي" : "دائري",
    shape === "heart" ? "heart" : shape === "square" ? "square" : shape === "oval" ? "oval" : "round"
  );
  const msg = text.trim().replace(/\s+/g, " ");
  const sceneLabel = t(
    `Aperçu 3D de votre boîte ${shapeName}${msg ? ` avec le message « ${msg} »` : ""}`,
    `معاينة ثلاثية الأبعاد لعلبتك ${shapeName}${msg ? ` مع الرسالة « ${msg} »` : ""}`,
    `3D preview of your ${shapeName} box${msg ? ` with the message “${msg}”` : ""}`
  );

  return (
    <div
      ref={wrapRef}
      className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-[0_24px_70px_rgba(40,20,8,0.4)] ring-1 ring-black/5"
      style={{
        background: "radial-gradient(120% 120% at 50% 20%, #FBF1E6 0%, #F3E2D2 55%, #E9D2BE 100%)",
      }}
    >
      {show3D ? (
        <div role="img" aria-label={sceneLabel} className="absolute inset-0">
          <TiramisuScene3D
            style={style}
            fontScale={size.fontScale}
            text={text}
            shape={shape}
            reducedMotion={reduced}
            view={view}
            frameloop={onScreen ? (reduced ? "demand" : "always") : "never"}
            lowPower={lowPower}
          />
        </div>
      ) : (
        <div className="absolute inset-0">
          <TiramisuCanvas style={style} size={size} text={text} shape={shape} />
        </div>
      )}

      {/* 2D ⇄ 3D toggle (only when 3D is possible). */}
      {ready && webgl && (
        <div className="absolute end-2 top-2 z-10 flex rounded-full bg-white/85 p-0.5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
          <button
            onClick={() => choose("2d")}
            aria-label={t("Aperçu 2D", "معاينة 2D", "2D preview")}
            aria-pressed={mode === "2d"}
            className={cn(
              "flex min-h-[40px] min-w-[44px] items-center justify-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1",
              mode === "2d" ? "bg-rose text-white shadow" : "text-charcoal-light"
            )}
          >
            <Square size={12} /> 2D
          </button>
          <button
            onClick={() => choose("3d")}
            aria-label={t("Aperçu 3D", "معاينة 3D", "3D preview")}
            aria-pressed={mode === "3d"}
            className={cn(
              "flex min-h-[40px] min-w-[44px] items-center justify-center gap-1 rounded-full px-3 py-2 text-[11px] font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1",
              mode === "3d" ? "bg-rose text-white shadow" : "text-charcoal-light"
            )}
          >
            <Box size={12} /> 3D
          </button>
        </div>
      )}

      {/* Preset angles + reset (3D only). */}
      {show3D && (
        <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5">
          <div className="flex items-center gap-1 rounded-full bg-white/85 p-0.5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => goView(p.key)}
                aria-pressed={activePreset === p.key}
                className={cn(
                  "flex min-h-[40px] min-w-[44px] items-center justify-center rounded-full px-3 py-2 text-[11px] font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1",
                  activePreset === p.key
                    ? "bg-rose text-white shadow"
                    : "text-charcoal-light hover:bg-rose/10 hover:text-rose"
                )}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => goView("hero")}
              aria-label={t("Réinitialiser la vue", "إعادة الضبط", "Reset view")}
              className={cn(
                "flex min-h-[40px] min-w-[44px] items-center justify-center rounded-full px-3 py-2 text-charcoal-light transition-colors hover:bg-rose/10 hover:text-rose",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose focus-visible:ring-offset-1"
              )}
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
