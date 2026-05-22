---
description: "Use when implementing or reviewing designs from Figma via the official Figma MCP server."
applyTo: "**"
---
# Figma MCP Integration Rules

Use the official Figma MCP server (`figma`, `https://mcp.figma.com/mcp`) for Figma-driven design work.

## Required Flow

1. Run `get_design_context` for the exact Figma frame or node URL before implementing.
2. If the response is too large or truncated, run `get_metadata` to inspect the node map, then fetch only the required node(s).
3. Run `get_variable_defs` when colors, typography, spacing, or design tokens are relevant.
4. Run `get_screenshot` for the selected frame or component before implementation.
5. Use Figma-provided assets directly when the MCP response includes asset URLs; do not invent placeholders.
6. Translate Figma output into the website's Next.js, Tailwind, and `SITE`/brand constants conventions.
7. Validate the result against the Figma screenshot before marking the work complete.

## Implementation Rules

- Treat MCP output as design context, not final code style.
- Reuse existing components from `src/components/` and constants from `src/lib/`.
- Use `next/image` for image assets.
- Use `SITE` from `@/lib/constants` for brand strings.
- Use existing brand tokens from `src/lib/brand.ts` where possible.
- Avoid hardcoded values when Figma variables or repo tokens exist.
- Preserve accessibility and responsive behavior.
- For logo work, require true vector SVG/PDF exports for production use; raster mockups are reference only.
