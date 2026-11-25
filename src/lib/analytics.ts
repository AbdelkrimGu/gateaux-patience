/**
 * Website analytics: PostHog, EU cloud, cookieless. Browser-only, so import
 * this from client components.
 *
 * - Loaded lazily (dynamic import) shortly after the page is interactive, or
 *   on the visitor's first tap, so it never slows the first paint.
 * - Memory-only persistence: no cookies and no browser storage for PostHog.
 *   The visitor's id lives as long as the tab (client-side navigation keeps
 *   it), so "unique visitors" is slightly inflated (a new tab or a reload =
 *   a new visitor), while pageviews, sources, clicks and GeoIP are exact.
 *   PostHog's "Cookieless tracking" project setting must stay OFF.
 * - Never send personal data (names, phone numbers, order messages) as event
 *   properties. Elements showing a customer's text carry `ph-no-capture`.
 * - The owner's devices are excluded: opening /admin marks the device as
 *   internal (see MarkInternalDevice). `?gp_internal=1` / `?gp_internal=0` on
 *   any public URL sets / clears the mark by hand.
 */

import type { PostHog } from "posthog-js";
import { INTERNAL_FLAG, setInternalCookie } from "./analytics-flag";

type Props = Record<string, string | number | boolean | null | undefined>;

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
const ALLOW_LOCALHOST = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];

interface Queued {
  event: string;
  props: Props | undefined;
  beacon: boolean;
  at: Date;
  url: string;
}

let client: PostHog | null = null;
let state: "idle" | "loading" | "ready" | "off" = "idle";
const queue: Queued[] = [];

function readInternalFlag(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get(INTERNAL_FLAG);
    if (param === "1") {
      window.localStorage.setItem(INTERNAL_FLAG, "1");
      setInternalCookie(true);
    }
    if (param === "0") {
      window.localStorage.removeItem(INTERNAL_FLAG);
      setInternalCookie(false);
    }
    return window.localStorage.getItem(INTERNAL_FLAG) === "1";
  } catch {
    return false; // storage blocked: treat as a normal visitor
  }
}

function isLocalHost(): boolean {
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".local");
}

/** Site language from a path: /ar/… → ar, /en/… → en, anything else → fr. */
export function localeFromPath(pathname: string): "fr" | "ar" | "en" {
  const seg = pathname.split("/")[1];
  return seg === "ar" || seg === "en" ? seg : "fr";
}

function pathOf(url: unknown): string {
  try {
    return new URL(String(url)).pathname;
  } catch {
    return window.location.pathname;
  }
}

/** Where and when the visitor landed, recorded before PostHog loads. */
export interface Landing {
  href: string;
  at: Date;
}

/**
 * Start PostHog once. Safe to call repeatedly; does nothing without a key,
 * on localhost (unless NEXT_PUBLIC_POSTHOG_DEBUG=1) or on the owner's devices.
 */
export function initAnalytics(landing: Landing): void {
  if (state !== "idle") return;
  if (!KEY || (isLocalHost() && !ALLOW_LOCALHOST) || readInternalFlag()) {
    state = "off";
    queue.length = 0;
    return;
  }
  state = "loading";

  import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(KEY, {
        api_host: HOST,
        ui_host: "https://eu.posthog.com",
        // Pinned defaults: a pageview on every client-side navigation
        // (history_change) and the other 2026-08 behaviours.
        defaults: "2026-08-30",
        // Nothing stored on the visitor's device: identity and session live in
        // page memory only. (PostHog's "cookieless" mode was rejected because
        // it discards the IP before GeoIP, so no country/city.)
        persistence: "memory",
        person_profiles: "identified_only",
        autocapture: true,
        capture_pageleave: true,
        // Session replay only runs if it is also switched on in the PostHog
        // project. Inputs are masked; `ph-no-capture` elements (the customer's
        // tiramisu message) are never recorded; request bodies and headers
        // (the order form POSTs a name and a phone number) are never recorded.
        session_recording: {
          maskAllInputs: true,
          recordBody: false,
          recordHeaders: false,
          streamNetworkBody: false,
        },
        // Unused features: skip their code and requests.
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_web_experiments: true,
        // The language is read from each event's own URL, so it is right even
        // on the pageview of a language switch.
        before_send: (e) => {
          if (e) e.properties.site_locale = localeFromPath(pathOf(e.properties.$current_url));
          return e;
        },
      });
      client = posthog;
      state = "ready";

      // The visitor moved on before PostHog loaded: PostHog's automatic first
      // pageview will describe the CURRENT page, so record the landing page
      // (with its UTM tags, e.g. utm_source=instagram / chatgpt.com) ourselves,
      // at the time it really happened.
      const u = new URL(landing.href);
      if (window.location.pathname + window.location.search !== u.pathname + u.search) {
        const utm: Props = {};
        for (const k of UTM_KEYS) {
          const v = u.searchParams.get(k);
          if (v) utm[k] = v;
        }
        posthog.capture(
          "$pageview",
          { $current_url: landing.href, $pathname: u.pathname, $host: u.host, ...utm },
          { timestamp: landing.at }
        );
      }

      for (const q of queue.splice(0)) {
        send(q.event, { $current_url: q.url, ...q.props }, q.beacon, q.at);
      }
    })
    .catch(() => {
      // Blocked by an ad blocker or offline: analytics just stays off.
      state = "off";
      queue.length = 0;
    });
}

function send(event: string, props: Props | undefined, beacon: boolean, at?: Date): void {
  if (!client) return;
  const options: { transport?: "sendBeacon"; timestamp?: Date } = {};
  if (beacon) options.transport = "sendBeacon";
  if (at) options.timestamp = at;
  client.capture(event, props, options);
}

/**
 * Record a named event. `beacon` = the page may be left right away (outbound
 * link), so deliver with sendBeacon. Events fired before PostHog has loaded
 * are queued with their real time and URL.
 */
export function track(event: string, props?: Props, beacon = false): void {
  if (state === "ready") send(event, props, beacon);
  else if (state === "idle" || state === "loading") {
    if (queue.length < 50) {
      queue.push({ event, props, beacon, at: new Date(), url: window.location.href });
    }
  }
}

// ---------------------------------------------------------------------------
// Outbound contact clicks (WhatsApp, phone, Instagram, Facebook)
// ---------------------------------------------------------------------------

export type ContactChannel = "whatsapp" | "call" | "instagram" | "facebook";

export function classifyHref(href: string): ContactChannel | null {
  const h = href.trim().toLowerCase();
  if (h.startsWith("tel:")) return "call";
  if (h.startsWith("whatsapp:")) return "whatsapp";
  let host: string;
  try {
    host = new URL(h, "https://gateauxpatience.com").hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
  if (host === "wa.me" || host === "api.whatsapp.com" || host === "chat.whatsapp.com") return "whatsapp";
  if (host === "instagram.com" || host.endsWith(".instagram.com")) return "instagram";
  if (host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com" || host === "m.me")
    return "facebook";
  return null;
}

/** Where on the page the link sits: explicit data-track-placement, else header/footer/section id. */
export function placementOf(el: Element): string {
  const tagged = el.closest("[data-track-placement]");
  if (tagged) return tagged.getAttribute("data-track-placement") || "unknown";
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  const section = el.closest("section[id]");
  if (section) return `section:${section.id}`;
  return "page";
}

/** Gallery cake slug from a path like /galerie/<slug> or /ar/galerie/<slug>. */
export function cakeSlugFromPath(pathname: string): string | undefined {
  const m = pathname.match(/\/galerie\/([^/?#]+)/);
  if (!m) return undefined;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1]; // malformed % sequence: keep the raw slug
  }
}
