# Figma design specs

**Figma file:** [VedaAI — Hiring Assignment](https://www.figma.com/design/nB2HMm1BhTpmHcHrmEslGB/VedaAI---Hiring-Assignment?node-id=0-1)

## Extraction status

| Method | Status |
|--------|--------|
| Figma MCP (`get_design_context`, `get_metadata`) | Failed — file not accessible (View seat on Starter plan; ~6 MCP reads/month; file may need to be shared with authenticated account) |
| PNG exports in `design/screens/` | Used as pixel reference |
| `FIGMA_SPECS.json` | Structured tokens + per-screen layout notes |

## Screens (8)

| ID | File | Route |
|----|------|-------|
| 01 | `01-empty-desktop.png` / `01-empty-mobile.png` | `/assignments` (empty) |
| 02 | `02-list-desktop.png` / `02-list-mobile.png` | `/assignments` (list) |
| 03 | `03-create-desktop.png` / `03-create-mobile.png` | `/assignments/new` step 2 |
| 04 | `04-output-desktop.png` / `04-output-mobile.png` | `/assignments/[id]` (paper) |

## Code usage

Import tokens in components:

```ts
import { figma } from '@/lib/figma-tokens'
```

Primary implementation references `FIGMA_SPECS.json` values via Tailwind classes in `frontend/app/globals.css` `@theme`.
