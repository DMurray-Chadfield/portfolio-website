# Add React.js Frontend with Landing Page & Profile Page

The existing portfolio website is a Kotlin/Ktor backend that serves server-rendered HTML via kotlinx.html. The goal is to add a React.js frontend with:

1. A **landing page** (public)
2. A **login page** (public)
3. A **profile page** (authenticated — redirect here after login)

The backend already has session-based cookie authentication (Spring Security + Ktor sessions) and a `singlePageApplication` catch-all route serving static files from `public/`. We'll leverage this existing infrastructure.

## User Review Required

IMPORTANT

**Technology choices** — The plan proposes the following stack for the frontend. Please confirm or suggest alternatives:

- **React 19** via **Vite**
- **React Router v7** for client-side routing
- **CSS Modules** (or vanilla CSS) — no extra dependency, aligns with existing app.css approach

### What is Vite?

**Vite** is a build tool / dev server for frontend projects. Think of it as the thing that:

- Serves your React code locally during development with instant hot-reload (you edit a file → the browser updates immediately, no manual refresh)
- Bundles your React code into optimised static files (HTML, JS, CSS) for production

It replaces the old Create React App tool (which is now deprecated). Vite is the standard recommendation from the React team.

### What is React Router?

**React Router** is a library that handles page navigation inside a React app. Without it, your React app would be a single page that never changes URL. With it, you get:

- `/` → renders the Landing Page component
- `/login` → renders the Login Page component
- `/profile` → renders the Profile Page component

The browser URL changes, the back/forward buttons work, but it's all handled client-side without full page reloads — the Ktor backend just serves the same 

index.html for all paths and React Router decides what to show.

> Alternatives considered:
>
> - _Create React App_ — deprecated, no longer recommended
> - _Next.js_ — overkill for an SPA that talks to an existing Ktor API; adds SSR complexity
> - _TailwindCSS_ — could be added if you prefer utility-first CSS, but not included by default

WARNING

**Existing `/public` files** — The React production build would replace the current 

index.html and 

app.css in `src/main/resources/public/`. These are placeholder files today, so this should be fine.

### Why two servers in dev, but one in production?

**In production**, you only run Ktor (`./gradlew run` or Docker). The React app gets compiled down to plain static files (HTML, JS, CSS) by Vite's build step, and those files are copied into `src/main/resources/public/`. Ktor's existing `singlePageApplication` handler serves them — no Node.js or Vite running at all.

**In development**, you run both because Vite's dev server gives you instant hot-reload — every time you save a React file, the browser updates in <100ms without a full page refresh. Without it, you'd have to rebuild and restart Ktor every time you change a frontend file. The Vite dev server is configured to forward all `/api/*` requests to Ktor automatically, so the app works seamlessly across both servers.

┌──────────────────────────────────────────────────────┐

│ DEVELOPMENT                                          │

│                                                      │

│  Browser → Vite (port 5173)                          │

│              ├── React pages (hot-reload)             │

│              └── /api/* → proxied to Ktor (port 4207)│

└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐

│ PRODUCTION                                           │

│                                                      │

│  Browser → Ktor (port 4207)                          │

│              ├── Serves React static files from /public│

│              └── /api/* → handled directly            │

└──────────────────────────────────────────────────────┘

---

## Proposed Changes

### Backend — JSON API Endpoints

Currently, login is form-based and returns redirects + HTML. The React frontend needs JSON API equivalents that return JSON instead of HTML.

**Spring Security remains the authentication mechanism.** The new `/api/login` endpoint will still go through the existing Spring Security filter chain. The only difference is the response format — instead of redirecting to an HTML page, it returns JSON. The session cookie is still set by Ktor's session handler, and Spring Security still guards the protected routes.

#### [MODIFY] 

Ktor.kt

Add new API routes under an `/api` prefix:

- `POST /api/login` — Accepts JSON `{ email, password }`, authenticates via existing `authenticateUser()` (which uses BCrypt + the `user_t` table), creates session cookie, returns `{ success: true, userId }` or 401
- `GET /api/me` — Returns the current authenticated user's profile as JSON (email, name), or 401 if not logged in
- `POST /api/logout` — Clears the session, returns `{ success: true }`

These supplement (not replace) the existing form-based routes, so no breaking changes.

---

### Frontend — React App (new `frontend/` directory)

A new `frontend/` directory at the project root will contain the React application.

#### [NEW] `frontend/` directory

Scaffolded with `npx -y create-vite@latest ./ -- --template react` containing:

|File|Purpose|
|---|---|
|`package.json`|Dependencies (react, react-dom, react-router-dom)|
|`vite.config.js`|Dev server proxy to `localhost:4207` for `/api` and cookie forwarding|
|`src/main.jsx`|App entry point, renders `<App />` with `<BrowserRouter>`|
|`src/App.jsx`|Top-level router: defines routes for `/`, `/login`, `/profile`|
|`src/index.css`|Global styles and design tokens|
|`src/pages/LandingPage.jsx`|Public landing / hero page|
|`src/pages/LoginPage.jsx`|Login form, calls `POST /api/login`, redirects to `/profile` on success|
|`src/pages/ProfilePage.jsx`|Protected page, fetches `GET /api/me`, displays user info|
|`src/components/Navbar.jsx`|Shared navigation bar|
|`src/components/ProtectedRoute.jsx`|Wrapper that redirects to `/login` if not authenticated|
|`src/context/AuthContext.jsx`|React context providing auth state (`user`, `login`, `logout`)|

---

### Build Integration

#### [MODIFY] 

build.gradle.kts

Add a Gradle task `buildFrontend` that:

1. Runs `npm install` in `frontend/`
2. Runs `npm run build` in `frontend/`
3. Copies `frontend/dist/*` → `src/main/resources/public/`

Make the `processResources` task depend on `buildFrontend` so production builds automatically include the React bundle.

#### [MODIFY] 

.gitignore

Add `frontend/node_modules/` and `frontend/dist/` to `.gitignore`.

---

## Verification Plan

### Automated Tests

**Existing tests** — The project has `UserTest.kt` and `WebResponseTest.kt` in `src/test/`. These test user creation/auth and web response handling. They don't cover the new `/api/*` routes directly but will confirm no regressions.

bash

./gradlew test

### Browser-Based Verification

After implementation, use the browser tool to verify:

1. **Landing page** — Navigate to `http://localhost:5173/` (dev) and confirm the landing page renders with navigation
2. **Login flow** — Navigate to `/login`, enter credentials, submit, and verify redirect to `/profile`
3. **Profile page** — Confirm the profile page displays the logged-in user's email/name
4. **Auth guard** — Navigate directly to `/profile` without logging in and verify redirect to `/login`
5. **Logout** — Click logout and verify redirect to landing or login page

### Manual Verification

After the implementation is complete:

1. Run `./gradlew run` to start the backend on port 4207
2. In a separate terminal, run `cd frontend && npm run dev` to start the Vite dev server on port 5173
3. Open `http://localhost:5173` in a browser and walk through the flows described above
4. To test the production build: run `cd frontend && npm run build`, then copy `dist/*` to `src/main/resources/public/`, restart the backend, and visit `http://localhost:4207`