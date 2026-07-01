"use client";

import { useEffect, useRef, useState } from "react";
import type { TiramisuStyle, TiramisuSize } from "@/lib/tiramisu-config";
import {
  S,
  SETS,
  SHAPES_CFG,
  loadImage,
  loadSprites,
  paintPreview,
  type ShapeKey,
} from "@/lib/tiramisu-layout";

export type { ShapeKey } from "@/lib/tiramisu-layout";

interface Props {
  style: TiramisuStyle;
  size: TiramisuSize;
  text: string;
  /** Box shape being previewed; picks the base image + writable area. */
  shape?: ShapeKey;
}

export default function TiramisuCanvas({ style, size, text, shape = "round" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const token = useRef(0);
  const cfg = SHAPES_CFG[shape];

  useEffect(() => {
    loadImage(cfg.base).then(() => setReady(true));
  }, [cfg.base]);

  useEffect(() => {
    if (!ready) return;
    const id = ++token.current;
    const set = SETS[style];
    (async () => {
      // Do all the async work (image loads) first…
      const [base, imgs] = await Promise.all([loadImage(cfg.base), loadSprites(text, set)]);
      // …then bail if a newer render superseded us, and paint synchronously so
      // two renders can never interleave and stack letters on each other.
      if (id !== token.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      paintPreview(canvas.getContext("2d")!, base, imgs, text, size.fontScale, set, cfg);
    })();
  }, [ready, style, size, text, cfg]);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] shadow-[0_24px_70px_rgba(40,20,8,0.4)] ring-1 ring-black/5">
      {!ready && <div className="absolute inset-0 shimmer" />}
      <canvas
        ref={canvasRef}
        width={S}
        height={S}
        className={`h-full w-full transition-opacity duration-500 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
