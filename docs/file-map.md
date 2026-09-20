# CivicFlow file map

This map covers the project source and tracked support files. Generated dependencies and runtime state—`node_modules/`, `.next/`, `.vinext/`, `dist/`, `.wrangler/`, and `.sites-runtime/`—are intentionally excluded because they are recreated by install, build, preview, and migration commands.

## Product interface

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Renders the single CivicFlow application entry point. |
| `app/layout.tsx` | Defines page metadata, favicon links, document language, and the root layout. |
| `app/civicflow-app.tsx` | Implements portal selection, resident submission and confirmation, administrator login/session restoration, dashboard metrics, filters, responsive queue, request detail actions, CSV link, and the browser MCP submission tool. |
| `app/globals.css` | Loads Tailwind and Shadcn styles, defines CivicFlow design tokens and typography, and adds the grid, hero gradient, metric animation, and reduced-motion behavior. |
| `app/chatgpt-auth.ts` | Provides optional starter helpers for Sites-managed ChatGPT identity. CivicFlow's role flow does not currently call these helpers. |
| `public/favicon.svg` | CivicFlow browser and bookmark icon. |
| `public/file.svg` | Generic file asset inherited from the starter. |
| `public/globe.svg` | Generic globe asset inherited from the starter. |
| `public/window.svg` | Generic window asset inherited from the starter. |

## API routes

| Path | Responsibility |
| --- | --- |
| `app/api/requests/route.ts` | Accepts public resident submissions, applies honeypot and field validation, persists valid requests, and returns a minimal confirmation. |
| `app/api/admin/login/route.ts` | Applies same-origin and credential checks, then issues signed session and CSRF cookies. |
| `app/api/admin/session/route.ts` | Reports whether an administrator session is valid and returns its CSRF token for the client. |
| `app/api/admin/logout/route.ts` | Validates the session and CSRF token, then expires both administrator cookies. |
| `app/api/admin/requests/route.ts` | Requires administrator access, initializes synthetic records for an empty database, validates optional filters, and returns the queue with recent audit events. |
| `app/api/admin/requests/[id]/route.ts` | Handles authenticated claim, start, resolve, note, and delete operations for one internal request identifier. |
| `app/api/admin/export/route.ts` | Produces an authenticated UTF-8 CSV summary and neutralizes spreadsheet-formula prefixes. |

## Server and data layer

| Path | Responsibility |
| --- | --- |
| `lib/server/auth.ts` | Validates portfolio credentials; signs, reads, and clears the time-limited session; creates the CSRF token; compares security values without early exit; and enforces same-origin mutations. |
| `lib/server/http.ts` | Defines client-safe HTTP errors, no-store JSON responses, centralized error conversion, and JSON-object parsing. |
| `lib/server/repository.ts` | Contains parameterized D1 queries, opaque reference generation, synthetic starter records, queue and audit reads, lifecycle mutations, and deletion with retained audit context. |
| `lib/server/types.ts` | Defines status, priority, request, audit, input, and administrator-action TypeScript types. |
| `lib/server/validation.ts` | Normalizes and validates public submission and administrator mutation payloads. |
| `lib/utils.ts` | Merges conditional Tailwind class names for shared UI components. |
| `db/index.ts` | Reads the `DB` Worker binding and exposes typed D1 and Drizzle clients. |
| `db/schema.ts` | Declares `service_requests`, `audit_logs`, their indexes, and inferred row types. |
| `drizzle/0000_civicflow_initial_schema.sql` | Creates the two D1 tables and indexes, then runs SQLite query-planner optimization. |
| `drizzle/meta/0000_snapshot.json` | Stores Drizzle's machine-readable snapshot of the initial schema. |
| `drizzle/meta/_journal.json` | Tracks migration order and metadata for Drizzle Kit. |
| `drizzle.config.ts` | Points Drizzle Kit to the SQLite schema and migration output directory. |
| `cloudflare-env.d.ts` | Types the D1 binding and optional administrator/session environment variables available in the Worker. |

## Reusable UI

`components/ui/` contains local Shadcn-compatible primitives. CivicFlow directly imports alert dialog, badge, button, card, dialog, input, label, native select, skeleton, table, textarea, and sonner/toast components.

The directory also contains the following reusable primitives for future extension:

- **Forms and input:** `calendar.tsx`, `checkbox.tsx`, `combobox.tsx`, `field.tsx`, `form.tsx`, `input-group.tsx`, `input-otp.tsx`, `radio-group.tsx`, `select.tsx`, `slider.tsx`, `switch.tsx`, `toggle.tsx`, and `toggle-group.tsx`.
- **Navigation and commands:** `breadcrumb.tsx`, `command.tsx`, `context-menu.tsx`, `dropdown-menu.tsx`, `kbd.tsx`, `menubar.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `sidebar.tsx`, and `tabs.tsx`.
- **Layout and disclosure:** `accordion.tsx`, `aspect-ratio.tsx`, `carousel.tsx`, `collapsible.tsx`, `drawer.tsx`, `hover-card.tsx`, `item.tsx`, `popover.tsx`, `resizable.tsx`, `scroll-area.tsx`, `separator.tsx`, `sheet.tsx`, and `tooltip.tsx`.
- **Feedback and presentation:** `alert.tsx`, `avatar.tsx`, `button-group.tsx`, `chart.tsx`, `direction.tsx`, `empty.tsx`, `marker.tsx`, `progress.tsx`, and `spinner.tsx`.
- **Conversation/attachment starter primitives:** `attachment.tsx`, `bubble.tsx`, `message-scroller.tsx`, and `message.tsx`.

`components.json` stores the Shadcn style, path alias, icon, and stylesheet configuration used to manage these files.

## Hosting, build, and configuration

| Path | Responsibility |
| --- | --- |
| `.openai/hosting.json` | Connects the checkout to its Sites project and declares the `DB` D1 binding. |
| `.env.example` | Documents the three server settings needed for portfolio authentication without containing real secrets. |
| `.gitignore` | Excludes credentials, dependencies, build output, preview state, local database state, and Codex/Sites runtime directories. |
| `package.json` | Declares Node requirements, scripts, runtime packages, developer tools, and the Miniflare override. |
| `package-lock.json` | Pins the npm dependency graph for repeatable `npm ci` installs. |
| `next.config.ts` | Holds the minimal Next-compatible application configuration. |
| `next-env.d.ts` | Supplies framework TypeScript references generated by Next tooling. |
| `vite.config.ts` | Combines Vinext, the Sites plugin, and the Cloudflare Vite plugin; declares local D1 bindings; and selects portable or managed preview behavior. |
| `tsconfig.json` | Enables strict TypeScript, browser and Worker types, bundler module resolution, and the `@/` alias. |
| `postcss.config.mjs` | Connects Tailwind CSS to PostCSS. |
| `eslint.config.mjs` | Applies the Next/TypeScript lint rules while ignoring generated build directories. |
| `scripts/execution-profile.mjs` | Reads the checkout-local portable or managed-Linux profile. |
| `scripts/install-ci.mjs` | Runs the locked npm installation appropriate to the selected profile. |
| `scripts/install-ci.sh` | Provides the managed-Linux locked install helper. |
| `scripts/install-pnpm.sh` | Provides a managed-Linux pnpm helper retained from the starter. |
| `scripts/pnpm-install.mjs` | Orchestrates the starter's pnpm installation path. |
| `scripts/run-framework.mjs` | Starts Vinext development or build commands with profile-aware process settings. |
| `scripts/sites-env.mjs` | Establishes safe local Wrangler, Miniflare, cache, and temporary-directory defaults. |
| `scripts/sites-env.sh` | Provides the managed-Linux environment equivalent. |
| `scripts/build-verified.sh` | Applies the managed-Linux build timeout and verification path. |
| `build/sites-vite-plugin.ts` | Integrates Sites behavior with the Vite/Vinext development and build pipeline. |
| `build/sites-vite-plugin.LICENSE` | Preserves the license for the bundled Sites plugin. |
| `vendor/shadcn-tailwind-4.13.0.css` | Pins the generated Shadcn/Tailwind base stylesheet. |
| `vendor/shadcn-tailwind-4.13.0.LICENSE.md` | Preserves the stylesheet's license notice. |

## Supporting material

| Path | Responsibility |
| --- | --- |
| `README.md` | Introduces the product, architecture, demo access, setup, API, portfolio value, and GitHub publishing steps. |
| `docs/product-requirements.md` | Records the problem, goals, personas, functional requirements, quality requirements, acceptance criteria, and roadmap. |
| `docs/data-dictionary.md` | Defines tables, fields, enums, indexes, validation, API shapes, export boundaries, and retention notes. |
| `docs/screenshots/README.md` | Gives filenames, views, privacy checks, and an embed snippet for portfolio screenshots. |
| `LICENSE` | Grants MIT permission for reuse and modification. |
| `examples/d1/app/api/notes/route.ts` | Shows the starter's independent D1 route example; it is excluded from CivicFlow's TypeScript runtime. |
| `examples/d1/db/schema.ts` | Shows the starter's independent D1 schema example; it is excluded from CivicFlow's TypeScript runtime. |
| `hooks/use-mobile.ts` | Provides a reusable responsive breakpoint hook supplied by the starter. |
