# OpsPilot — Ticket workspace (fourth layout)

The incident-viewer workspace opens without a sidebar and presents two choices: tickets reported by the current user, or all tickets sorted newest first with current status and live-bridge indicators. Selecting a ticket opens its full details. The administrator workspace retains its Teams and channel navigation for configuration. Built with **React 19 + TypeScript**, **Material UI v9** and **Tailwind CSS v4**, bundled with **Vite**.

- **Tickets owned by me**: cards show ticket ID, title, summary and status; selecting a card opens the full incident details.
- **Show all tickets**: cards are ordered by raised date and include the incident status and a live-bridge indicator when applicable.
- **Administrator workspace**: Teams group and channel policy management, audit history and automation settings.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production 
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
    shell/            Header and admin navigation; account, theme and notification controls
    console/          User ticket choices and cards, admin incident console, incident details
    control/          Groups, channel policies (+ save bar), audit log, advanced settings, channel dialogs
```

## Features

- Role-based workspaces (viewer / administrator) with access checks on navigation.
- Ticket workspace: sidebar-free owned/all ticket choices, newest-first ticket cards, live status and full incident details.
- Control room: Teams group overview, per-channel policy toggles tracked as drafts with a sticky save/discard bar, audit log (exportable), advanced settings with inline validation and drag / arrow / Alt+↑↓ reordering of the automation workflow, channel management with confirmation before disabling monitoring.
- Notifications, light/dark theme and account menu in the user header / admin app rail; collapsible admin teams pane and mobile drawer.
- Accessibility: MUI focus management for dialogs/menus/tabs, labelled controls, `aria-live` regions, skip link, reduced-motion support.

## Production notes

All data is mock data. Before going live, replace `data/mock.ts` and the `AppState` mutations with calls to the authorized backend, and enforce roles, paging/meeting permissions and interval validation (1–120 min) server-side.
