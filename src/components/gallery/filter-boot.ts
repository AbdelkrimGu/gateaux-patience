/*
  Deep-link pre-paint for the gallery filter (/galerie?c=<slug>).

  Rendered once in the root layout's <head> (so it only ever exists in the
  server HTML: React 19 warns about <script> rendered by a component on the
  client, and never runs it there; client navigations are handled by
  <GalleryFilter> itself). At that point <body> is not parsed yet, so it
  watches the parser and stamps `data-c` on the scope and the grid the
  moment the grid is inserted: MutationObserver callbacks run as microtasks,
  before the next paint, so a deep link never flashes the unfiltered grid.
  Unknown slugs are harmless: no CSS rule matches them and the island resets
  them on hydration.
*/

export const GRID_ID = "gp-gallery-grid";
export const SCOPE_ID = "gp-gallery-scope";

export const GALLERY_FILTER_BOOT_JS = `(function(){try{var p=location.pathname;if(p.slice(-8)!=="/galerie"&&p.slice(-9)!=="/galerie/")return;var c=new URLSearchParams(location.search).get("c");if(!c||!/^[a-z0-9-]+$/.test(c))return;var d=document,o,f=function(){var g=d.getElementById("${GRID_ID}");if(!g)return!1;var s=d.getElementById("${SCOPE_ID}");if(s)s.setAttribute("data-c",c);g.setAttribute("data-c",c);return!0};if(f())return;o=new MutationObserver(function(){if(f())o.disconnect()});o.observe(d.documentElement,{childList:!0,subtree:!0});d.addEventListener("DOMContentLoaded",function(){o.disconnect()})}catch(e){}})()`;
