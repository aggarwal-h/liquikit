# Lumen

A product page for a made-up smart lamp, built with [LiquiKit](https://liquikit.dev) on Next.js and served at [liquikit.dev/lumen](https://liquikit.dev/lumen).

```bash
bun install
bun run dev        # from the repository root: the site on :3000, Lumen on :3200
```

## How it is put together

In this repository the components come straight from `packages/liquikit/src`, through the `@/components/liquikit/*` alias in `tsconfig.json`, so Lumen always runs the current engine. The same page outside the repository would be made the way any app is:

```bash
npx create-next-app@latest lumen
npx shadcn@latest init
npx shadcn@latest add https://liquikit.dev/r/all.json
```

Everything else is two folders:

- `components/lumen`: the page, a file per section. `hero.tsx` is the lamp with its scene picker, `sun.tsx` the day you can drag through, `studio.tsx` the control tile, `design.tsx` the finishes, `sections.tsx` the bar, the specs and the footer, and `buy.tsx` the Buy sheet. `lamp.tsx` draws the lamp in CSS, `light.ts` works out its light from a colour temperature, `state.tsx` holds the one light every section shows, and `stage.tsx` is the stage each lamp sits on.
- `app/globals.css`: the colours, the type, the lamp and its light.

`next build` writes a static export with `basePath: "/lumen"` to `out`. The site's build copies it into `apps/www/dist/client/lumen`, and the Worker that serves liquikit.dev serves it from there, so one deploy covers both.

## What it uses

- `GlassScope`, in its default content mode: the glass bends what is inside the scope in place, in Safari and Firefox as well as Chrome.
- `SegmentedControl` for the scenes under the hero lamp and the finishes, `Slider` for the day, the brightness and the colour temperature, and `Switch` for power and following the sun. The sliders take their colours from `--glass-slider-track` and `--glass-slider-fill`, the switch from `--glass-switch-on`.
- `GlassPane` for the sticky bar and the control tile.
- `Sheet`, `Button` and `Toast` for buying.

## Where the glass bends, and why

Glass is only as good as what is behind it, so every control sits in the lamp's light. The rules the page follows:

1. **Scope the control, not the scene.** The scene capsule, the day slider and the finish capsule each have a `GlassScope` of their own size. The lens bends the control's track and labels in place in every browser, and the page behind the scope shows through as it is. Safari and Firefox run that filter on the processor over the whole scope, so its size is what they charge for: on the iOS 27 simulator (iPhone 18 Pro Max) a drag of the day slider held 16.8 ms a frame with the scope around the slider, and 55 ms with the scope around the whole stage, lamp included.
2. **Scope the stage only when the glass needs it.** The control tile is a frosted `GlassPane` whose switches and sliders sit on other glass. Its scope holds the lamp too, so the frost has the lamp to blur in both states, and in Chrome and Firefox the controls bend the tile and the light behind it. Safari bends a copy of each control's own track there instead, and runs no filter over that stage at all.
3. **Keep stages opaque and clipped.** Each stage clips the lamp's glow at its own edge and is padded by a third of the lamp, which is where the glow has faded out, so a filter that comes and goes never changes what is clipped. A scope with a see-through background would bend its own content only.
4. **Keep fixed things out of scopes.** The sticky bar, the sheet and the toasts are outside every scope, since a scope carries a transform.
5. **No blend modes inside glass.** The lamp's sheen is plain alpha; a `mix-blend-mode` inside a pane stops its frost in Chromium.
6. **Clip the page sideways.** Glass draws its rim a little past each pane, so `main` has `overflow-x-clip` or a pane near a phone's edge would widen the page.

`formatDetection: { telephone: false }` in the layout stops iOS turning the "2700–6500" spec into a phone link. Cache Components stays off because a static export cannot use partial prerendering, and the page has nothing dynamic.
