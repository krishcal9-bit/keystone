/**
 * Build-time renderer for the illustration markup that never needs React on the client:
 * the landing hero street (day + night, written as standalone SVG files under public/art so the browser
 * loads them as images: no hydration, no RSC payload, cached) and the Site Finder map art
 * detail layer (public/art/map-detail-{day,night}.svg, rasterised onto a canvas by OCMap).
 * Run: npm run gen:art (also runs as prebuild).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { StreetScene } from '../components/scenes/StreetScene';
import { MapDetail, mapArtVars, DETAIL_BOX } from '../components/map/MapArt';

/** Trim float noise (e.g. 123.45678901) to 2 decimals: identical on screen, ~40% smaller markup. */
const trim = (html: string) => html.replace(/-?\d+\.\d{3,}/g, (m) => String(Math.round(Number(m) * 100) / 100));

const day = trim(renderToStaticMarkup(<StreetScene night={false} active />));
const night = trim(renderToStaticMarkup(<StreetScene night active />));
const map = trim(renderToStaticMarkup(<MapDetail />));

/** The scene's own motion, embedded because page CSS never reaches an SVG loaded as an image. */
const HERO_CSS = `
.scene-svg{width:100%;height:100%}
.ks-t{transition:fill 600ms ease,opacity 600ms ease,stroke 600ms ease}
@keyframes ks-sway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}
@keyframes ks-walk{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
@keyframes ks-drift{from{transform:translateX(0)}to{transform:translateX(60px)}}
.ks-drift{animation:ks-drift 40s linear infinite alternate}
@keyframes ks-flicker{0%{opacity:0}20%{opacity:1}35%{opacity:.2}50%{opacity:1}65%{opacity:.4}80%{opacity:1}100%{opacity:1}}
@keyframes ks-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(4px)}}
@keyframes ks-smoke{0%{transform:translate(0,0) scale(.9);opacity:.5}100%{transform:translate(8px,-26px) scale(1.5);opacity:0}}
@keyframes ks-sprinkle{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(20deg)}}
.ks-sprinkler{animation:ks-sprinkle 3s ease-in-out infinite}
.hero-mk{transform-box:fill-box;transform-origin:center;animation:hero-mk-in 520ms cubic-bezier(.23,1,.32,1) both;animation-delay:var(--d,0s)}
@keyframes hero-mk-in{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.hero-lot-glow{animation:hero-glow 4s ease-in-out infinite}
@keyframes hero-glow{0%,100%{opacity:.35}50%{opacity:.9}}
.lamp-on{animation:lamp-on 600ms ease-out both;animation-delay:var(--d,0ms)}
@keyframes lamp-on{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`.replace(/\n/g, '');

const svgFile = (markup: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` + markup.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('<defs>', `<style>${HERO_CSS}</style><defs>`);

mkdirSync('public/art', { recursive: true });
writeFileSync('public/art/hero-day.svg', svgFile(day));
writeFileSync('public/art/hero-night.svg', svgFile(night));
const mapFile = (night: boolean) => {
  const vars = Object.entries(mapArtVars(night)).map(([k, v]) => `${k}:${v}`).join(';');
  const { x, y, size } = DETAIL_BOX;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${x} ${y} ${size} ${size}"><style>svg{${vars}}</style>${map}</svg>`;
};
for (const night of [false, true]) writeFileSync(`public/art/map-detail-${night ? 'night' : 'day'}.svg`, mapFile(night));
