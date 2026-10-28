# Sable & Sage (demo site)

A static demo homepage for a fictional New American restaurant, built by North Summit Agency as a portfolio concept. The address, 555-01xx phone number and .example email are fake, the reservation form books nothing, and the three reviews are samples written for the concept (labeled on the page).

Hosting: Render static site with publish directory `.` and no build command.

## Files
- `index.html`: the page, with its styles inline.
- `js/site.js`: menu tabs, mobile menu, demo reservation form, and the scroll motion.
- `js/vendor/gsap.min.js`, `js/vendor/ScrollTrigger.min.js`: GSAP 3.13.0, self-hosted (GSAP standard no-charge license, https://gsap.com/standard-license).
- `images/*.webp`: smaller copies of the photos, served to browsers that support WebP; the `.jpg` originals remain as the fallback.
- `images/monogram.svg`: the S&S monogram traced from `monogram.png`, so it can draw itself in.

## Motion
- Everything works without JavaScript animation: with "reduce motion" turned on, or if GSAP fails to load, the page shows all content with no effects.
- Heavier effects (floating line art, menu photo parallax, the chef story steps, the gallery drift) run on screens wider than 1000px only.

## S logo experiment
- `index.html`: the monogram draws itself in on load, then shrinks and moves into the header as you scroll.
- `index.html?logo=plain`: the monogram simply fades in, and a small one appears in the header once you scroll.
To keep only the plain version, change `fx=q.get('logo')!=='plain'` to `fx=false` in the first `<script>` in `index.html`.
