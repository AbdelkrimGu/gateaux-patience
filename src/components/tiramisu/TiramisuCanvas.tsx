"use client";

import { useEffect, useRef, useState } from "react";
import type { TiramisuStyle } from "@/lib/tiramisu-config";
import type { TiramisuTemplate } from "@/lib/tiramisu-templates";
import { SETS, loadImage, loadSprites, paintPreview } from "@/lib/tiramisu-layout";
import s from "./tiramisu.module.css";

interface Props {
  style: TiramisuStyle;
  /** The resolved product template (shape × size) being previewed. */
  template: TiramisuTemplate;
  text: string;
}

export default function TiramisuCanvas({ style, template, text }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const token = useRef(0);
  const size = template.canvasSize;

  useEffect(() => {
    loadImage(template.baseImage)
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [template.baseImage]);

  useEffect(() => {
    if (!ready) return;
    const id = ++token.current;
    const set = SETS[style];
    (async () => {
      // Do all async work (image loads) first…
      const [base, imgs] = await Promise.all([loadImage(template.baseImage), loadSprites(text, set)]);
      // …then bail if a newer render superseded us, and paint synchronously so
      // two renders can never interleave and stack letters on each other.
      if (id !== token.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      paintPreview(canvas.getContext("2d")!, { base, imgs, template, style, text });
    })();
  }, [ready, style, template, text]);

  return (
    <div className="relative aspect-square w-full overflow-hidden">
      {!ready && <div className={`absolute inset-0 ${s.loading}`} />}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`h-full w-full transition-opacity duration-500 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
