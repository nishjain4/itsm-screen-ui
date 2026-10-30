# ITSM Screen / OpsPilot

This repository contains multiple design iterations of an enterprise IT service management (ITSM) and incident operations console, built around the OpsPilot concept.

The work includes static HTML prototypes and React-based implementations of the same product experience, allowing design and engineering teams to compare layouts, workflows, and interactions across versions.

## Included versions

- `main/` — first static prototype of the OpsPilot dashboard.
- `second/` — second visual iteration with a different styling direction.
- `third/` — third prototype and its React rebuild.
  - `third/OpsPilotVivid.html` — vanilla HTML/CSS/JS prototype
  - `third/react-app/` — React + TypeScript + Material UI + Tailwind implementation. See [third/react-app/README.md](third/react-app/README.md).
- `fourth/` — Microsoft Teams-inspired layout with teams, channels, and incident feeds. See [fourth/README.md](fourth/README.md).

## Product focus

The UI is designed for a modern IT operations environment where teams can:

- monitor and triage incidents
- review channel-based operational activity
- apply filters and search across incidents
- switch between board and table views
- manage groups, policies, and audit settings
- operate in role-based workspaces (viewer/admin)

## Getting started

### React versions

The active React applications are in `third/react-app/` and `fourth/`.

```bash
# third/react-app
cd third/react-app
npm install
npm run dev

# fourth
cd fourth
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal, usually:

- `http://localhost:5173`

### Production build

```bash
cd third/react-app
npm run build

cd ../fourth
npm run build
```

### Static prototypes

The HTML/CSS/JS versions can be opened directly in a browser, or served via a lightweight local web server if preferred.

## Project structure

```text
ITSM Screen/
├── README.MD
├── main/
├── second/
├── third/
│   ├── OpsPilotVivid.css
│   ├── OpsPilotVivid.html
│   ├── OpsPilotVivid.js
│   └── react-app/
├── fourth/
└── ...
```

## Notes

- This repository is a design and prototyping workspace rather than a single production app.
- The React implementations are the most complete and maintainable versions for further development.
- All mock data is included in the app state and should be replaced with real backend integrations before production use.
