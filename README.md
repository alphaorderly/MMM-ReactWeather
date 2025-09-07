
## mmm-reactweather (Simplified README)

MagicMirror² 모듈 + React 18 + TypeScript + Vite 템플릿. 빌드 결과(`dist/index.js`, `dist/index.css`)만 MagicMirror 에서 로드합니다. 개발 중 `dev:true` 이면 폴링 후 변경 시 자동 새로고침.

## MMM-ReactWeather

Modern MagicMirror² weather module powered by React 18 + TypeScript + Vite. The MagicMirror layer only injects a root element and loads the pre‑built bundle (`dist/index.js`, `dist/index.css`). In development you can enable a lightweight polling auto‑reload (no dev server inside MagicMirror required).

---

### Key Features
- React 18 + TypeScript + Vite 5 build
- Tailwind CSS utility styling
- Single ES module output (tree‑shaken) + CSS
- Development watch mode: Vite rebuilds → module polls bundle signature → triggers full reload
- Standalone browser testing environment (`yarn test:dev`) with HMR and mock config injection
- GitHub Actions release packaging (tag → build → zip → Release)

---

### 1. Installation
1. Download from release
2. unzip it and rename folder to `MMM-ReactWeather`
3. Copy to `MagicMirror/modules/`

### 2. MagicMirror Configuration (`config/config.js`)
```js
{
  module: 'MMM-ReactWeather',
  position: 'top_right',
  config: {
    dev: false,          // true enables polling reload of rebuilt bundle
    updateInterval: 60_000, // ms between bundle checks in dev
    lat: 37.5665,
    lon: 126.9780,
    size: 'md'           // sm | md | lg | xl (UI scale)
  }
}
```

### 3. Commands
```bash
yarn dev         # Vite build --watch (writes to dist/ continuously)
yarn test:dev    # Standalone HMR test server (localhost)
yarn build       # Production build (dist/)
yarn typecheck   # Type-only check
yarn lint        # ESLint
yarn format      # Prettier
```

### 4. Development Modes
| Mode | How | Result |
|------|-----|--------|
| Production | `yarn build` + `dev:false` | Static bundle load, no polling |
| Dev (in MagicMirror) | `yarn dev` + `dev:true` | Polls `dist/index.js`; reload on change |
| Standalone | `yarn test:dev` | Vite dev server + HMR; bypass MagicMirror shell |

Auto‑reload algorithm (dev mode): every `updateInterval` ms fetch `dist/index.js` with cache‑busting query → compute signature (`length + #keywords(import|export|React)`) → if changed → `location.reload()`.

### 5. Project Structure
```
MMM-ReactWeather.js   # MagicMirror module wrapper (DOM + script injection + dev polling)
src/main.tsx          # React root mount (single mount guard, HMR dispose)
src/App.tsx           # Top-level component; passes config to weather UI
src/WeatherComponent.tsx # Displays today + tomorrow weather using open-meteo data
src/useWeather.ts     # Data hook (fetch & normalize Open‑Meteo responses)
src/config.ts         # Typed helpers for injected module config
src/style.css         # Tailwind + font
dist/                 # Built JS/CSS (generated)
```

### 6. Runtime Flow in MagicMirror
1. MagicMirror calls `getDom()` → creates root div `.mmm-reactweather-root` with `data-config` JSON.
2. Wrapper injects `<script type="module" src="dist/index.js">` (watch or prod identical path).
3. `main.tsx` finds first `.mmm-reactweather-root`, guards against double mount, renders `<App />`.
4. `App.tsx` reads config (`ensureConfig()`) → passes values to `WeatherComponent`.
5. `useWeather` performs Open‑Meteo request, sets state, triggers re-renders.
6. If dev mode enabled: periodic bundle poll may trigger full window reload.

### 7. Weather Data Flow
- Source: `https://api.open-meteo.com/v1/forecast`
- Request: current (temperature, humidity, weather code, wind) + daily (weather code, max/min temp, precipitation) for 2 days.
- Normalization: Build `today` (current + day stats) and `tomorrow` (day 2 stats). Precipitation/visibility/wind only where available.
- Refresh: Internal interval in `useWeather` (default 10 min). Adjust by editing hook usage or exposing via config.

### 8. Accessing Config in React
Config arrives as JSON in `data-config` on the root element.
```ts
import { ensureConfig } from './config';
const cfg = ensureConfig();
console.log(cfg?.lat, cfg?.lon, cfg?.size);
```
Multiple instances (future): use `getAllConfigs()`. (Current `main.tsx` mounts first root only—extend if you plan multiple simultaneous instances.)

### 9. Release Workflow (GitHub Actions)
Trigger: push a tag `vX.Y.Z`.
Steps: checkout → install → tag/version validation → type check (fail-blocking) → lint (non-blocking) → build → package minimal zip (`<main file>`, `dist/`, `README.md`, `package.json`, `yarn.lock`, optional `LICENSE`) → publish Release with attached zip.
Usage:
```bash
vim package.json        # bump version (or editor of choice)
git add package.json
git commit -m "chore: bump version to 0.2.0"
git tag v0.2.0
git push origin main --tags
```
Download the generated zip from the Release page and drop it into `MagicMirror/modules/` (dependencies are not required at runtime if you only need built assets).

### 10. Renaming the Module
If you fork to create a new module:
1. Rename folder: `MMM-ReactWeather` → `MMM-YourName`.
2. Rename file `MMM-ReactWeather.js` and update `Module.register("MMM-YourName", { ... })`.
3. Update `package.json` (`name`, `main`).
4. Replace occurrences of `MMM-ReactWeather` / lowercase variants in code & README.
5. Update MagicMirror `config/config.js` entry.

### 11. Troubleshooting
| Symptom | Cause | Fix |
|---------|-------|-----|
| UI not updating | `yarn dev` not running / `dev:false` | Start watch + set `dev:true` |
| No reload on change | Interval too large | Lower `updateInterval` (e.g. 5000) |
| 404 `dist/index.js` | Not built yet | Run `yarn dev` or `yarn build` |
| Missing styles | Stale or missing CSS | Clean `dist/` then rebuild |
| Weather error message | Network / API format change | Check console; retry later |
| Multi-instance need | Current mount selects first root only | Expand `main.tsx` to iterate roots |

### 12. Extending
- Add `node_helper.js` for server-side caching or API keys.
- Introduce unit selection (°C/°F) via config.
- Persist last fetch to reduce blank states on startup.
- Support multiple module instances by adjusting the mount logic.

### 13. Minimal Dev Loop Example
```bash
# Terminal 1 (build watch)
yarn dev

# MagicMirror config: set dev:true for the module
# Edit React code → file rebuild → polling reloads whole window
```

### 14. License
MIT

---
Need a lighter summary or multi-instance mounting example? Open an issue or adapt `main.tsx` to loop over all `.mmm-reactweather-root` elements.
