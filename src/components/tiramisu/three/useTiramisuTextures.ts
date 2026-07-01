// Texture pipelines for the 3D preview, live-driven by the customizer state.
//
//  • useTopTexture  → bakes the cocoa top to a CanvasTexture. For cacao writing
//    the letters are baked in (they lie flat — a texture is physically correct).
//    For white-chocolate pieces only the bare cocoa is baked; the letters are
//    real geometry (see scene). Rebuilds are DEBOUNCED so fast typing never
//    thrashes the GPU, and the previous texture is always disposed.
//  • useLetterTextures → loads the sprite for each white-chocolate glyph as an
//    sRGB texture, disposing any that fall out of use.
//
// Both reuse the shared layout module so 2D and 3D agree exactly.

import { useEffect, useRef, useState } from "react";
import { invalidate } from "@react-three/fiber";
import * as THREE from "three";
import {
  S,
  SETS,
  SHAPES_CFG,
  loadImage,
  loadSprites,
  paintPreview,
  spriteUrl,
  type ShapeKey,
  type LayoutGlyph,
} from "@/lib/tiramisu-layout";
import type { TiramisuStyle } from "@/lib/tiramisu-config";

/**
 * Bake the cocoa top to a CanvasTexture. Debounced; disposes the prior texture.
 */
export function useTopTexture(
  style: TiramisuStyle,
  fontScale: number,
  text: string,
  shape: ShapeKey,
  debounceMs = 120
): THREE.CanvasTexture | null {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const token = useRef(0);

  useEffect(() => {
    const id = ++token.current;
    let cancelled = false;
    const set = SETS[style];
    const cfg = SHAPES_CFG[shape];
    const onlyBase = style === "pieces"; // pieces letters are real geometry
    const timer = setTimeout(async () => {
      let t: THREE.CanvasTexture | null = null;
      try {
        const [base, imgs] = await Promise.all([
          loadImage(cfg.base),
          onlyBase ? Promise.resolve({}) : loadSprites(text, set),
        ]);
        // Bail if unmounted or superseded — dispose any texture built below.
        if (cancelled || id !== token.current) return;
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
          canvasRef.current.width = S;
          canvasRef.current.height = S;
        }
        const ctx = canvasRef.current.getContext("2d")!;
        paintPreview(ctx, base, imgs, text, fontScale, set, cfg, onlyBase);

        t = new THREE.CanvasTexture(canvasRef.current);
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.flipY = false; // keep S-space (y-down) aligned with letter placement
        t.needsUpdate = true;

        if (cancelled || id !== token.current) {
          t.dispose();
          return;
        }
        const prev = texRef.current;
        texRef.current = t;
        setTex(t);
        if (prev) prev.dispose();
        invalidate(); // demand/reduced-motion: render the freshly baked top
      } catch {
        // A missing base/sprite must never blank the cake or throw an
        // unhandled rejection — keep the previously baked texture.
        t?.dispose?.();
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [style, fontScale, text, shape, debounceMs]);

  // Final unmount cleanup.
  useEffect(() => {
    return () => {
      texRef.current?.dispose();
      texRef.current = null;
    };
  }, []);

  return tex;
}

/**
 * Load an sRGB texture per white-chocolate glyph. Keyed by character; disposes
 * textures no longer needed. Returns a map char → Texture (may be partial while
 * loading).
 */
export function useLetterTextures(
  glyphs: LayoutGlyph[],
  style: TiramisuStyle
): Record<string, THREE.Texture> {
  const [map, setMap] = useState<Record<string, THREE.Texture>>({});
  const cache = useRef<Map<string, THREE.Texture>>(new Map());

  useEffect(() => {
    if (style !== "pieces") {
      // Dispose the cached glyph textures before dropping the map.
      Array.from(cache.current.values()).forEach((t) => t.dispose());
      cache.current.clear();
      setMap({});
      return;
    }
    const set = SETS.pieces;
    const needed = new Set(glyphs.map((g) => g.ch));
    const loader = new THREE.TextureLoader();
    let cancelled = false;

    const next: Record<string, THREE.Texture> = {};
    const pending: Promise<void>[] = [];
    needed.forEach((ch) => {
      const existing = cache.current.get(ch);
      if (existing) {
        next[ch] = existing;
        return;
      }
      const url = spriteUrl(set, ch);
      if (!url) return;
      pending.push(
        loader
          .loadAsync(url)
          .then((t) => {
            if (cancelled) {
              t.dispose();
              return;
            }
            t.colorSpace = THREE.SRGBColorSpace;
            t.anisotropy = 8;
            // Match the cocoa CanvasTexture (which is flipY:false) so the glyph
            // sprites sit in the same S-space (y-down) as the baked top.
            // VISUAL-CHECK: confirm white-chocolate letters read upright & not
            // mirrored from the hero angle; if they come out mirrored rather
            // than flipped, negate the plane's vertical scale instead.
            t.flipY = false;
            cache.current.set(ch, t);
            next[ch] = t;
          })
          .catch(() => {
            // A 404 / decode failure on one glyph must never blank the rest.
          })
      );
    });

    // Dispose textures no longer referenced.
    Array.from(cache.current.keys()).forEach((ch) => {
      if (!needed.has(ch)) {
        cache.current.get(ch)?.dispose();
        cache.current.delete(ch);
      }
    });

    Promise.all(pending).then(() => {
      if (!cancelled) {
        setMap({ ...next });
        invalidate(); // demand/reduced-motion: render once the sprites land
      }
    });
    // Show what's already cached immediately.
    setMap({ ...next });
    invalidate();

    return () => {
      cancelled = true;
    };
  }, [glyphs, style]);

  // Dispose everything on unmount.
  useEffect(() => {
    const c = cache.current;
    return () => {
      Array.from(c.values()).forEach((t) => t.dispose());
      c.clear();
    };
  }, []);

  return map;
}
