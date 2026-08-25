# Asset Guidance

This directory intentionally contains no source application photos, logos, videos, customer imagery, or fonts.

## Recommended visual brief

- Environmental, human-scale photography with natural light and believable materials.
- Clear architectural or product context; avoid anonymous luxury-stock imagery.
- High-resolution originals suitable for 4:3, 5:4, 16:10, 16:8, and square crops.
- A restrained palette that can sit beside white, warm gray, near-black, and coral.
- One deliberate focal point per image, recorded as an `object-position` value.

## Delivery checklist

- AVIF/WebP plus JPEG fallback where needed.
- Responsive `srcset` widths appropriate to actual layout.
- Width/height or `aspect-ratio` to prevent layout shift.
- Lazy loading for below-fold media; eager/high-priority loading only for the main hero.
- Descriptive alt text for meaningful media; `alt=""` for decorative media.
- Rights/attribution recorded in an asset register.
- Unnecessary EXIF/location metadata removed.

