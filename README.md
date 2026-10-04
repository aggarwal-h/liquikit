# LiquiKit

Liquid glass components for React, with physically based refraction. Built on [Base UI](https://base-ui.com) and distributed as a [shadcn](https://ui.shadcn.com) registry: the CLI copies the source into your project.

## Using it

Add the registry to `components.json`:

```json
{
  "registries": {
    "@liquikit": "https://liquikit.dev/r/{name}.json"
  }
}
```

Then add components:

```bash
npx shadcn@latest add @liquikit/switch @liquikit/menu
```

Components land in `components/liquikit/`, with the refraction engine in `components/liquikit/glass/`. The glass bends what is behind it, so wrap that area in a `GlassScope` and pass its background as `backdrop`.

In React Server Components, use the named parts of compound components (`MenuRoot`, `MenuTrigger`, `MenuPopup`…). The `Menu.Root` form works in client components.

## Repository

| Path | What it is |
| --- | --- |
| `packages/liquikit` | The components and the glass engine. The source of every registry item. |
| `packages/liquikit/scripts/registry.ts` | Writes `registry.json`, deriving each item's dependencies from its imports. |
| `apps/www` | The site (TanStack Start). Serves the built registry at `/r`. |

```bash
bun install
bun run dev        # builds the registry, then starts the site on :3000
bun run build      # registry, then a prerendered site in apps/www/dist
bun run typecheck
bun run check      # Biome
```

The registry is built into `apps/www/public/r` by `shadcn build`. Items link to each other by URL, taken from `REGISTRY_URL` (default `https://liquikit.dev/r`). To try installs against a local site:

```bash
cd apps/www && REGISTRY_URL=http://localhost:3000/r bun run registry:build
```

### Adding a component

1. Add `packages/liquikit/src/<name>.tsx` (with `"use client"`), importing the engine from `./glass`.
2. Add it to `components` in `scripts/registry.ts` with a title and description.
3. Export it from `packages/liquikit/src/index.ts` to use it on the site.

The engine's design notes are in [`packages/liquikit/GLASS.md`](packages/liquikit/GLASS.md).

## License

[MIT](LICENSE)
