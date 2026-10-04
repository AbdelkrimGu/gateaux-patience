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
//
// Skin: the square keeps its own warm backdrop (the preview content is
// unchanged); the controls sit under it, on the écrin stage.

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import TiramisuCanvas from "./TiramisuCanvas";
import { TIcon } from "./TiramisuIcon";
import { useTiramisuUi, fmt } from "./ui-context";
import s from "./tiramisu.module.css";
import type { ViewKey } from "./three/TiramisuScene3D";
import type { TiramisuStyle } from "@/lib/tiramisu-config";
import type { TiramisuTemplate } from "@/lib/tiramisu-templates";

const TiramisuScene3D = dynamic(() => import("./three/TiramisuScene3D"), {
  ssr: false,
  loading: () => <div className={cn(s.loading, "absolute inset-0")} />,
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
  /** Resolved product template (shape × size). */
  template: TiramisuTemplate;
  text: string;
}

// Segmented pills on the dark stage: sucre outline group, selected = sucre fill.
const segGroup = "flex items-center rounded-pill p-1 shadow-[inset_0_0_0_1.5px_rgb(247_242_244/0.28)]";
const segBtn = (on: boolean) =>
  cn(
    "press inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-2.5 text-[13px] font-semibold",
    on ? "bg-sucre text-paillette" : "text-sucre/85 hover:text-sucre"
  );

export default function TiramisuPreview({ style, template, text }: Props) {
  const shape = template.shape;
  const { ui } = useTiramisuUi();

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

  const presets: { key: ViewKey; label: string }[] = [
    { key: "top", label: ui.preview.top },
    { key: "hero", label: ui.preview.hero },
    { key: "side", label: ui.preview.side },
  ];

  const show3D = ready && webgl && mode === "3d";

  const shapeName =
    shape === "heart"
      ? ui.preview.shape_heart
      : shape === "square"
        ? ui.preview.shape_square
        : shape === "oval"
          ? ui.preview.shape_oval
          : ui.preview.shape_round;
  const msg = text.trim().replace(/\s+/g, " ");
  const sceneLabel = msg
    ? fmt(ui.preview.scene_msg, { shape: shapeName, msg })
    : fmt(ui.preview.scene, { shape: shapeName });

  return (
    <>
      <div
        ref={wrapRef}
        className="relative aspect-square h-[32vh] max-w-full overflow-hidden rounded-[24px] bezel"
        style={{
          background: "radial-gradient(120% 120% at 50% 20%, #FBF1E6 0%, #F3E2D2 55%, #E9D2BE 100%)",
        }}
      >
        {show3D ? (
          <div role="img" aria-label={sceneLabel} className="absolute inset-0">
            <TiramisuScene3D
              style={style}
              template={template}
              text={text}
              reducedMotion={reduced}
              view={view}
              frameloop={onScreen ? (reduced ? "demand" : "always") : "never"}
              lowPower={lowPower}
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <TiramisuCanvas style={style} template={template} text={text} />
          </div>
        )}
      </div>

      {/* Controls on the stage: 2D ⇄ 3D (only when 3D is possible) + angles (3D only). */}
      {ready && webgl && (
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label={ui.preview.mode} className={segGroup}>
            <button
              type="button"
              onClick={() => choose("2d")}
              aria-label={ui.preview.label_2d}
              aria-pressed={mode === "2d"}
              className={segBtn(mode === "2d")}
            >
              2D
            </button>
            <button
              type="button"
              onClick={() => choose("3d")}
              aria-label={ui.preview.label_3d}
              aria-pressed={mode === "3d"}
              className={segBtn(mode === "3d")}
            >
              3D
            </button>
          </div>

          {show3D && (
            <div role="group" aria-label={ui.preview.views} className={segGroup}>
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => goView(p.key)}
                  aria-pressed={activePreset === p.key}
                  className={segBtn(activePreset === p.key)}
                >
                  {p.label}
                </button>
              ))}
              <button type="button" onClick={() => goView("hero")} aria-label={ui.preview.reset} className={segBtn(false)}>
                <TIcon name="rotate" size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
