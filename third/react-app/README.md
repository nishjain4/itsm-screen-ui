# OpsPilot — React edition (third layout)

Enterprise rebuild of the third layout (`../OpsPilotVivid.*`) using **React 19 + TypeScript**, **Material UI v9** and **Tailwind CSS v4**, bundled with **Vite**. The original vanilla HTML/CSS/JS files in `../` are left untouched.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production bundle in dist/
npm run preview   # serve the production bundle
npm run lint      # oxlint
```

> The production bundle uses ES modules, so serve `dist/` over HTTP (e.g. `npm run preview`) rather than opening `index.html` from the file system.

## How MUI and Tailwind work together

| Concern | Owner |
| --- | --- |
| Components (buttons, dialogs, menus, tabs, tables, drawers, switches, inputs) | Material UI |
| Layout, spacing, typography tweaks, status tints | Tailwind utilities |
| Colours / light & dark themes | MUI `colorSchemes` → emitted as `--mui-palette-*` CSS variables |

- `src/theme.ts` is the single source of truth for colours. `src/index.css` maps those CSS variables into Tailwind tokens (`bg-paper`, `text-muted`, `border-line`, `bg-st-active`, …) via `@theme inline`, so both systems always agree, including in dark mode.
- `StyledEngineProvider enableCssLayer` + the `GlobalStyles` layer statement in `src/main.tsx` place MUI styles in `@layer mui`, below Tailwind utilities, so utilities can override MUI predictably. Keep that `GlobalStyles` element first.
- Dark mode uses MUI's class selector (`.dark` / `.light` on `<html>`); Tailwind's `dark:` variant targets the same class. `index.html` applies the saved mode before first paint to avoid a flash.

## Project structure

```
src/
  main.tsx            Providers (theme, toasts, confirm, app state)
  App.tsx             Workspace gate vs. app shell
  theme.ts            MUI theme (light/dark colour schemes, component defaults)
  index.css           Tailwind + token bridge + small component classes
  types.ts            Domain types
  data/mock.ts        Mock incidents, Teams groups, audit seed, constants
  lib/utils.ts        Filtering, sorting, CSV export (formula-injection safe), validation
  state/AppState.tsx  App-wide state: role, navigation, filters, policy drafts, audit log
  components/         Toasts, confirm dialog, icons, shared UI (status chips, empty states…)
  features/
    gate/             Workspace (role) picker
    shell/            Sidebar, top bar, command palette, shortcuts
    console/          Filters, incident board, sortable table, coverage, incident drawer
    control/          Groups, channel policies (+ save bar), audit log, advanced settings, channel dialogs
```

## Features

- Role-based workspaces (viewer / administrator) with access checks on navigation.
- Incident console: filters with removable chips, board (masonry) and sortable table views, incident detail drawer with activity timeline, CSV export, refresh with skeleton loading.
- Control room: Teams group overview, per-channel policy toggles tracked as drafts with a sticky save/discard bar, audit log (exportable), advanced settings with inline validation and drag / arrow / Alt+↑↓ reordering of the automation workflow, channel management with confirmation before disabling monitoring.
- Command palette (Ctrl/⌘ K), keyboard shortcuts (`/`, `[`, `?`), notifications, light/dark theme, collapsible sidebar and mobile drawer.
- Accessibility: MUI focus management for dialogs/menus/tabs, labelled controls, `aria-live` regions, skip link, reduced-motion support.

## Production notes

All data is mock data. Before going live, replace `data/mock.ts` and the `AppState` mutations with calls to the authorized backend, and enforce roles, paging/meeting permissions and interval validation (1–120 min) server-side.
