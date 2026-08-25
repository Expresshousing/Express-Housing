# Tailwind Reference

The source application uses Tailwind 3 defaults plus CSS variables. These translations preserve the intended geometry:

| Intent | Tailwind reference |
| --- | --- |
| Container | `mx-auto w-full max-w-[1280px] px-4 md:px-6` |
| Editorial section | `py-20 md:py-28 lg:py-36` |
| Eyebrow | `text-[10px] font-extrabold uppercase tracking-[0.24em]` + 2px × 36px rule |
| Large statement | `text-[44px] sm:text-[64px] md:text-[78px] lg:text-[96px] font-extrabold leading-[0.92] tracking-[-0.05em]` |
| Primary pill | `inline-flex min-h-12 items-center rounded-full px-6 text-[14px] font-bold text-white` |
| Control | `min-h-11 rounded-xl px-4 text-[13px] font-bold` |
| Large media | `relative overflow-hidden rounded-[18px] aspect-[4/3]` |
| Panel | `rounded-[20px] border p-5 md:p-6` |
| Compact card | `rounded-[14px] border p-4` |
| Mobile tabs | `flex gap-1 overflow-x-auto` with shrink-free buttons |
| Drawer | `fixed inset-0 z-[100] flex justify-end` + `h-full w-full max-w-[540px] overflow-y-auto` |

Use CSS variables rather than hard-coded Tailwind colors. If extending Tailwind, map names such as `accent`, `surface`, `muted`, and `border`; do not carry over the source’s misleading `BLUE` name.

