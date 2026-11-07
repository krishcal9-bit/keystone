/* eslint-disable @next/next/no-img-element -- static SVG art; next/image adds nothing for an inline-sized SVG */
/**
 * The hero street scene as two pre-rendered SVG images (scripts/gen-static-art.tsx writes public/art/hero-*.svg):
 * nothing to hydrate and nothing in the RSC payload, so ~1,100 SVG nodes never touch React on the client.
 * CSS shows the variant matching the theme; the scene's ambient motion is embedded in the files.
 */
export function HeroStatic() {
  return (
    <>
      <img src="/art/hero-day.svg" alt="" aria-hidden className="hero-static hero-static-day absolute inset-0 w-full h-full object-cover" fetchPriority="high" decoding="async" draggable={false} />
      <img src="/art/hero-night.svg" alt="" aria-hidden className="hero-static hero-static-night absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" draggable={false} />
    </>
  );
}
