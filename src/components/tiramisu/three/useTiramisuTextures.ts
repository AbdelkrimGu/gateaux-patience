// Texture pipelines for the 3D preview, live-driven by the customizer state.
//
//  • useTopTexture  → bakes ONLY the bare cocoa top to a CanvasTexture. Nothing
//    is written on it: the letters of BOTH styles are real geometry in the scene
//    (cacao = cream piped & dusted with cocoa, laid low & matte; white chocolate
//    = glossy moulded pieces, raised higher). Rebuilds only when the shape (hence
//    the base image) changes, and the previous texture is always disposed.
//  • useLetterTextures → loads the real letter photo for each glyph of the active
//    style as an sRGB texture, mirrored to the top cap's frame, disposing any
//    that fall out of use (including the other style's, on a style switch).
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
  spriteUrl,
  type ShapeKey,
  type LayoutGlyph,
} from "@/lib/tiramisu-layout";
import type { TiramisuStyle } from "@/lib/tiramisu-config";

/**
 * Bake the bare cocoa top to a CanvasTexture. Debounced; disposes the prior
 * texture. Depends only on the shape (which picks the base photo) — the writing
 * is never baked in; it lives as real geometry in the scene.
 */
export function useTopTexture(
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
    const cfg = SHAPES_CFG[shape];
    const timer = setTimeout(async () => {
      let t: THREE.CanvasTexture | null = null;
      try {
        const base = await loadImage(cfg.base);
        // Bail if unmounted or superseded.
        if (cancelled || id !== token.current) return;
        if (!canvasRef.current) {
          canvasRef.current = document.createElement("canvas");
          canvasRef.current.width = S;
          canvasRef.current.height = S;
        }
        const ctx = canvasRef.current.getContext("2d")!;
        // Bare cocoa only — the letters are real geometry (see scene).
        ctx.clearRect(0, 0, S, S);
        ctx.drawImage(base, 0, 0, S, S);

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
        // A missing base must never blank the cake or throw an unhandled
        // rejection — keep the previously baked texture.
        t?.dispose?.();
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [shape, debounceMs]);

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
 * Load an sRGB texture per glyph of the ACTIVE style (cacao or pieces) from its
 * real letter photo. Keyed by `style|char` so switching styles never returns the
 * wrong sprite; disposes textures no longer needed (unused chars AND the other
 * style's leftovers). Returns a map char → Texture (may be partial while loading).
 */
export function useLetterTextures(
  glyphs: LayoutGlyph[],
  style: TiramisuStyle
): Record<string, THREE.Texture> {
  const [map, setMap] = useState<Record<string, THREE.Texture>>({});
  const cache = useRef<Map<string, THREE.Texture>>(new Map());

  useEffect(() => {
    const set = SETS[style];
    const needed = new Set(glyphs.map((g) => g.ch));
    const keyOf = (ch: string) => `${style}|${ch}`;
    const loader = new THREE.TextureLoader();
    let cancelled = false;

    const next: Record<string, THREE.Texture> = {};
    const pending: Promise<void>[] = [];
    needed.forEach((ch) => {
      const key = keyOf(ch);
      const existing = cache.current.get(key);
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
            // Match the cocoa CanvasTexture (flipY:false) so sprites sit in the
            // same S-space (y-down) as the baked top.
            t.flipY = false;
            // The letter planes live in the top cap's left-handed frame (same
            // reason the base flips U in geometry.ts). Without this, each glyph
            // reads MIRRORED from above. repeat.x = -1 mirrors the sprite in
            // place — no negative geometry scale, so plane normals (and lighting)
            // stay correct.
            t.wrapS = THREE.RepeatWrapping;
            t.repeat.x = -1;
            cache.current.set(key, t);
            next[ch] = t;
          })
          .catch(() => {
            // A 404 / decode failure on one glyph must never blank the rest.
          })
      );
    });

    // Dispose textures no longer referenced — unused chars OR the other style's.
    Array.from(cache.current.keys()).forEach((key) => {
      const sep = key.indexOf("|");
      const kStyle = key.slice(0, sep);
      const kCh = key.slice(sep + 1);
      if (kStyle !== style || !needed.has(kCh)) {
        cache.current.get(key)?.dispose();
        cache.current.delete(key);
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
