"use client";

import { useState } from "react";
import type { TiramisuStyle, TiramisuSize } from "@/lib/tiramisu-config";

interface Props {
  style: TiramisuStyle;
  size: TiramisuSize;
  text: string;
  placeholder: string;
  imageSrc: string;
}

const VIEW = 400;
const CENTER = VIEW / 2;

/**
 * Photo-realistic live preview of a personalized tiramisu top.
 *
 * The base layer is a real top-down photo (with a rich cacao gradient
 * fallback). The customer's text is rendered as SVG and pushed through
 * filters that imitate the real thing:
 *  - cacao style: edges are roughened with turbulence/displacement and a
 *    broken dark stroke so the cacao "overloads" unevenly onto the letters,
 *    plus a grain wash inside the strokes — never a clean vector edge.
 *  - pieces style: a glossy specular-lit bevel + drop shadow so the letters
 *    read as molded white-chocolate pieces sitting on the cacao.
 */
export default function TiramisuPreview({
  style,
  size,
  text,
  placeholder,
  imageSrc,
}: Props) {
  const [imgOk, setImgOk] = useState(true);

  const isPlaceholder = text.trim().length === 0;
  const shown = isPlaceholder ? placeholder : text;
  const display = style === "cacao" ? shown.toUpperCase() : shown;
  const lines = display.split("\n");
  const longest = Math.max(1, ...lines.map((l) => l.length));

  // Fit the text inside the round top.
  const charFactor = style === "cacao" ? 0.62 : 0.8;
  const maxW = 255;
  const maxH = 240;
  let fontSize = Math.min(
    maxW / (longest * charFactor),
    maxH / (lines.length * 1.18),
    132 * size.fontScale
  );
  fontSize = Math.max(16, fontSize);

  const lineHeight = fontSize * 1.16;
  const blockHeight = lines.length * lineHeight;
  const firstBaseline = CENTER - blockHeight / 2 + fontSize * 0.82;

  const fontFamily =
    style === "cacao"
      ? "var(--font-tira-cacao), 'Arial Black', sans-serif"
      : "var(--font-tira-pieces), Georgia, serif";

  return (
    <div className="relative aspect-square w-full select-none overflow-hidden rounded-full shadow-[0_20px_60px_rgba(40,20,8,0.45)] ring-1 ring-black/10">
      {/* Cacao gradient fallback — always present so the preview looks good
          even before the real photo is dropped in. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 42% 38%, #7a4f30 0%, #5e3a22 38%, #46291732 70%, #321b0f 100%)",
        }}
      />

      {/* Real photo on top of the fallback. */}
      {imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt=""
          aria-hidden
          onError={() => setImgOk(false)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Cacao powder grain + soft vignette to seat the text on the surface. */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <filter id="tira-surface-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <radialGradient id="tira-vignette" cx="50%" cy="46%" r="58%">
            <stop offset="55%" stopColor="#000" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a0d05" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <rect
          width={VIEW}
          height={VIEW}
          filter="url(#tira-surface-grain)"
          opacity="0.12"
          style={{ mixBlendMode: "multiply" }}
        />
        <rect width={VIEW} height={VIEW} fill="url(#tira-vignette)" />
      </svg>

      {/* The customer's text. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* ---- Cacao writing: rough, over-dusted edges + grain ---- */}
          <filter
            id="tira-cacao-fill"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.95"
              numOctaves="2"
              seed="7"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="7"
              xChannelSelector="R"
              yChannelSelector="G"
              result="rough"
            />
            {/* cacao grain wash inside the cream */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.22"
              numOctaves="3"
              seed="11"
              result="grain"
            />
            <feColorMatrix
              in="grain"
              type="matrix"
              values="0 0 0 0 0.30  0 0 0 0 0.17  0 0 0 0 0.08  0 0 0 0.85 0"
              result="grainCol"
            />
            <feComposite
              in="grainCol"
              in2="rough"
              operator="in"
              result="grainMasked"
            />
            <feMerge>
              <feMergeNode in="rough" />
              <feMergeNode in="grainMasked" />
            </feMerge>
          </filter>

          {/* broken dark stroke = cacao clinging unevenly to the edges */}
          <filter
            id="tira-cacao-edge"
            x="-35%"
            y="-35%"
            width="170%"
            height="170%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="2"
              seed="4"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="11"
              xChannelSelector="R"
              yChannelSelector="G"
              result="d"
            />
            <feGaussianBlur in="d" stdDeviation="0.5" />
          </filter>

          {/* ---- White-chocolate pieces: glossy molded bevel ---- */}
          <linearGradient id="tira-choc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbf6ec" />
            <stop offset="45%" stopColor="#efe6d3" />
            <stop offset="100%" stopColor="#cdbfa3" />
          </linearGradient>
          <filter
            id="tira-pieces"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="1.5"
              dy="4"
              stdDeviation="3"
              floodColor="#1c0f06"
              floodOpacity="0.55"
            />
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="blur" />
            <feSpecularLighting
              in="blur"
              surfaceScale="3.2"
              specularConstant="0.95"
              specularExponent="19"
              lightingColor="#ffffff"
              result="spec"
            >
              <feDistantLight azimuth="235" elevation="58" />
            </feSpecularLighting>
            <feComposite
              in="spec"
              in2="SourceAlpha"
              operator="in"
              result="specMask"
            />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="specMask" />
            </feMerge>
          </filter>
        </defs>

        <g
          opacity={isPlaceholder ? 0.4 : 1}
          style={{ fontFamily, fontWeight: style === "cacao" ? 700 : 600 }}
        >
          {style === "cacao" ? (
            <>
              {/* dark cacao edge underneath */}
              <text
                x={CENTER}
                textAnchor="middle"
                fontSize={fontSize}
                fill="none"
                stroke="#2a190d"
                strokeWidth={Math.max(1.2, fontSize * 0.05)}
                strokeLinejoin="round"
                opacity="0.7"
                filter="url(#tira-cacao-edge)"
              >
                {lines.map((l, i) => (
                  <tspan key={i} x={CENTER} y={firstBaseline + i * lineHeight}>
                    {l || " "}
                  </tspan>
                ))}
              </text>
              {/* cream letters on top */}
              <text
                x={CENTER}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#e9dcbe"
                filter="url(#tira-cacao-fill)"
              >
                {lines.map((l, i) => (
                  <tspan key={i} x={CENTER} y={firstBaseline + i * lineHeight}>
                    {l || " "}
                  </tspan>
                ))}
              </text>
            </>
          ) : (
            <text
              x={CENTER}
              textAnchor="middle"
              fontSize={fontSize}
              fill="url(#tira-choc-grad)"
              filter="url(#tira-pieces)"
            >
              {lines.map((l, i) => (
                <tspan key={i} x={CENTER} y={firstBaseline + i * lineHeight}>
                  {l || " "}
                </tspan>
              ))}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
