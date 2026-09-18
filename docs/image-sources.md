# Building Image Sources

These assets were downloaded on 2026-08-18 from the four official building websites after the Express Housing operator explicitly authorized their use for this project.

They are classified as **official building/model imagery**, not verified photographs of an assigned Express Housing unit. The website must keep that distinction visible until Express Housing supplies exact-unit photographs.

## Operator-supplied portfolio folder

On 2026-08-18, Express Housing supplied and authorized 11 additional image files from `/Users/gloriaamagbakhen/Downloads/Express-Housing/`. Local web-ready copies are stored in `frontend/public/images/operator-portfolio/`; the originals remain unchanged.

- Broad + Noble: model kitchen, lobby, gym, bar lounge, study lounge, sky deck and private terrace
- The Hannah: building entrance and clubhouse
- 1500 Locust: Center City rooftop view and model bedroom

These images now power the homepage slideshow and the matching building galleries. No supplied file was identified as Edgewater II, so that gallery continues to use its authorized official-site images rather than assigning an uncertain photograph to the building.

On 2026-09-18, Express Housing supplied and authorized 15 further AVIF files for The Hannah from `/Users/gloriaamagbakhen/Downloads/`. Local copies are stored in `frontend/public/images/operator-portfolio/` under `the-hannah-*.avif`; the originals remain unchanged. They cover the building entrance, lobby, resident lounges, community kitchen and dining, media room, coworking nook, fitness center, yoga studio and courtyard.

These 15 arrived as operator-supplied files rather than as downloads from the building website, so they carry the building site as their source rather than a per-file URL, exactly as the 2026-08-18 batch does. Their delivered filenames were opaque identifiers and the format is AVIF, neither of which matches the naming or format the official site serves — so the underlying origin has not been independently confirmed. Confirm it with Express Housing before the photo-rights launch gate is cleared.

## Broad + Noble

- `model-kitchen.webp` — [official source](https://www.livebroadandnoble.com/wp-content/uploads/2026/03/01-SMP_25_BroadandNoble_Model_KitchenandDining-min-jpg-webp-1-1200x800.webp)
- `model-living.webp` — [official source](https://www.livebroadandnoble.com/wp-content/uploads/2026/03/05-SMP_22_BroadandNoble_Model_LivingandKitchen-min-jpg-1-1200x800.webp)
- `building-amenity.jpg` — [official source](https://www.livebroadandnoble.com/wp-content/uploads/2023/12/shoootin-photo-10-1200x800.jpg)

## The Hannah

Official-site download still in the gallery:

- `model-one-bedroom.jpg` — [official source](https://thehannahcallowhill.com/assets/images/cache/1bedroom-1W1-0228abb712c121d26f4c318d37356a52.jpg)

Operator-supplied, 2026-09-18, in `operator-portfolio/` (source: <https://thehannahcallowhill.com/>):

- `the-hannah-exterior-entrance.avif`, `the-hannah-exterior-entrance-street.avif` — building entrance
- `the-hannah-lobby-fireplace-lounge.avif`, `the-hannah-lobby-fireplace-seating.avif`, `the-hannah-lobby-window-seating.avif` — lobby
- `the-hannah-resident-lounge-brick.avif`, `the-hannah-resident-lounge-billiards.avif` — resident lounge
- `the-hannah-community-kitchen-island.avif`, `the-hannah-community-kitchen-bar.avif`, `the-hannah-community-dining-table.avif` — community kitchen and dining
- `the-hannah-media-room.avif`, `the-hannah-study-nook.avif` — media room and coworking nook
- `the-hannah-fitness-center.avif`, `the-hannah-fitness-yoga-studio.avif` — fitness center and yoga studio
- `the-hannah-courtyard-grilling-terrace.avif` — courtyard

Downloaded but no longer in the gallery (2026-09-18), kept on disk:

- `business-center.jpg` — [official source](https://thehannahcallowhill.com/assets/images/cache/business_center-c29e0f0128970bb39c3fa691b6ee0249.jpg)
- `exterior.jpg` — [official source](https://thehannahcallowhill.com/assets/images/cache/STANGOPHILLYATDUSK-14-44abffee167610c1334c1d4c82604375.jpg)
- `operator-portfolio/the-hannah-entrance.jpg` — still used by the homepage slideshow
- `operator-portfolio/clubhouse.jpg` — no longer referenced anywhere

## Edgewater II

- `model-interior.jpg` — [official source](https://edgewaterapthomes.com/assets/images/cache/shoootin-photo-7-726c41e8d01e5629bc04d1b6d28dca76.jpg)
- `building-amenity-1.jpg` — [official source](https://edgewaterapthomes.com/assets/images/cache/10-8439fcc03e48c780bf969e2cd08e5bef.jpg)
- `building-amenity-2.jpg` — [official source](https://edgewaterapthomes.com/assets/images/cache/17-401212ba211cbbd1eb0e65e86bf02a91.jpg)

## 1500 Locust

- `model-interior.jpg` — [official source](https://irp.cdn-website.com/47bff720/dms3rep/multi/opt/A2-1920w.jpg)
- `rooftop-pool.jpg` — [official source](https://irp.cdn-website.com/47bff720/dms3rep/multi/opt/1500+Locust+-+Rooftop+Indoor+Pool+2-2880w.jpg)
- `building-amenity.jpg` — [official source](https://irp.cdn-website.com/47bff720/dms3rep/multi/opt/gb_210608_3182_EDIT-1920w.jpg)

## Publishing rule

Official-site images are enough for a building preview, but they do not satisfy the `photo_status = verified` launch gate. Before a listing accepts reservations, Express Housing must confirm that its gallery accurately represents the inventory type and replace or supplement these assets with authorized exact-unit photographs.
