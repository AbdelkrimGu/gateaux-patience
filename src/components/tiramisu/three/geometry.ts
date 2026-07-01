// Procedural cake geometry, shape-aware.
//
// Each box shape is a 2D silhouette (square / heart / oval / round) that we
// extrude into a shallow cake body. The extrusion yields two material groups —
// group 0 = the flat top/bottom caps (cocoa), group 1 = the side walls (cream).
// A custom UV generator normalises the TOP cap UVs to the silhouette's bounding
// box so the square cocoa texture maps cleanly across whatever shape we built.
//
// All silhouettes live in local XY, roughly within [-1, 1]. The mesh is rotated
// -90° about X at render time so the top cap faces +Y. Letter placement (see
// scene) reuses the SAME bounding box, so proud white-chocolate letters land
// exactly where the baked cocoa texture would put them.

import * as THREE from "three";
import type { ShapeKey } from "@/lib/tiramisu-layout";

export interface ShapeBBox {
  minX: number;
  minY: number;
  w: number;
  h: number;
}

/** Build the 2D silhouette for a box shape, centred near the origin. */
export function buildShape(shape: ShapeKey): THREE.Shape {
  const s = new THREE.Shape();
  switch (shape) {
    case "square": {
      // Rounded square.
      const a = 0.94;
      const r = 0.22;
      s.moveTo(-a + r, -a);
      s.lineTo(a - r, -a);
      s.quadraticCurveTo(a, -a, a, -a + r);
      s.lineTo(a, a - r);
      s.quadraticCurveTo(a, a, a - r, a);
      s.lineTo(-a + r, a);
      s.quadraticCurveTo(-a, a, -a, a - r);
      s.lineTo(-a, -a + r);
      s.quadraticCurveTo(-a, -a, -a + r, -a);
      break;
    }
    case "oval": {
      s.absellipse(0, 0, 1.12, 0.82, 0, Math.PI * 2, false, 0);
      break;
    }
    case "heart": {
      // Parametric heart, sampled to a polyline, scaled into ~[-1, 1] and then
      // RECENTRED on its own bbox so the mesh sits on the origin (the camera and
      // OrbitControls target aim at the origin — an off-origin heart framed the
      // cake off-centre). Cusp (dimple) at top, point at bottom.
      const raw: THREE.Vector2[] = [];
      const N = 72;
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * Math.PI * 2;
        const x = (16 * Math.pow(Math.sin(t), 3)) / 16;
        const y =
          (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 15;
        raw.push(new THREE.Vector2(x, y));
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      // Letter placement reuses shapeBBox(outline), which is recomputed from
      // these same recentred points, so proud letters follow automatically.
      s.setFromPoints(raw.map((p) => new THREE.Vector2(p.x - cx, p.y - cy)));
      break;
    }
    case "round":
    default: {
      s.absarc(0, 0, 1, 0, Math.PI * 2, false);
      break;
    }
  }
  return s;
}

/** Bounding box of a silhouette (used for UVs + letter placement). */
export function shapeBBox(shape: THREE.Shape): ShapeBBox {
  const pts = shape.getPoints(64);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, w: maxX - minX, h: maxY - minY };
}

/** UV generator that maps the top cap to [0,1]² over the silhouette bbox. */
function makeUVGenerator(bb: ShapeBBox) {
  const uv = (x: number, y: number) =>
    new THREE.Vector2((x - bb.minX) / bb.w, (y - bb.minY) / bb.h);
  return {
    generateTopUV(_g: THREE.ExtrudeGeometry, v: number[], a: number, b: number, c: number) {
      return [
        uv(v[a * 3], v[a * 3 + 1]),
        uv(v[b * 3], v[b * 3 + 1]),
        uv(v[c * 3], v[c * 3 + 1]),
      ];
    },
    generateSideWallUV(
      _g: THREE.ExtrudeGeometry,
      _v: number[],
      _a: number,
      _b: number,
      _c: number,
      _d: number
    ) {
      // Cream sides are untextured; any consistent quad UV is fine.
      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1),
        new THREE.Vector2(0, 1),
      ];
    },
  };
}

/**
 * Extruded cake body for a shape. Returns the geometry plus the bbox so the
 * caller can place letters against the same frame. `height` is the cake's
 * thickness. Geometry is built in local XY (extruded +Z); rotate the mesh -90°
 * about X to stand it up.
 */
export function buildCakeGeometry(shape: ShapeKey, height: number) {
  const outline = buildShape(shape);
  const bb = shapeBBox(outline);
  const geo = new THREE.ExtrudeGeometry(outline, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: height * 0.16,
    bevelSize: 0.05,
    bevelSegments: 3,
    curveSegments: 48,
    UVGenerator: makeUVGenerator(bb),
  });
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  // Local +Z becomes world +Y after the -90° X rotation, so the top cap's
  // world height is the geometry's max Z.
  const topZ = geo.boundingBox ? geo.boundingBox.max.z : height;
  return { geo, bb, topZ };
}
