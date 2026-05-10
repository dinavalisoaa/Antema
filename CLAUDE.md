# Antema — Church Worship Presentation App

## Project Purpose

Antema is a **desktop application for church worship programs**, replacing manual PowerPoint slide creation. It manages songs, liturgy order, and presents slides during worship services. Built for a Malagasy church context (liturgy, katekomena display, "Fandraisana" ceremony support).

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + React 18 |
| UI | Radix UI + Tailwind CSS + shadcn/ui |
| Slide engine | Reveal.js |
| Desktop shell | Tauri v1 (Rust) |
| Database | SQLite via SeaORM |
| API | GraphQL (async-graphql + Tide, port 6969) |
| GraphQL client | Apollo Client |

## Key Directories

```
app/                        Next.js App Router pages
  (main)/(with-layout)/     Admin pages (song, liturgy, categories)
  (main)/(wrapper)/slide/   Client-facing slide view
  slides/controller/        Slide controller (next/prev navigation)
src/
  components/               Shared React components
  hooks/                    Custom hooks
  interface/                TypeScript interfaces (TypeSong, CategorySong, etc.)
  lib/                      Utilities
lib/
  apolloClient.tsx          Apollo GraphQL client setup
src-tauri/src/
  main.rs                   Tauri entry point, spawns GraphQL server
  graphql.rs                GraphQL server setup (Tide on localhost:6969)
  lib.rs / mod.rs           Rust modules
```

## Domain Concepts

- **Song** — a hymn or worship song with verses and a category
- **Category** — grouping of songs (type-based)
- **Liturgy** — the ordered program of a worship service (drag-and-drop reorderable)
- **Slide** — a Reveal.js presentation slide shown during worship
- **Manefo** — confession/declaration displayed during the service
- **Katekomena** — candidates displayed during "Fandraisana" (communion ceremony), showing name, photo, sampana, and bible verse

## App Routes

| Route | Purpose |
|-------|---------|
| `/` | Home / landing |
| `/admin/list` | Song list |
| `/admin/lithurgy` | Liturgy builder (drag-and-drop ordering) |
| `/admin/song` | Song CRUD |
| `/admin/song/[id]` | Edit specific song |
| `/admin/song-category` | Category management |
| `/admin/form/ui/manefo` | Manefo form |
| `/admin/nl` | New liturgy |
| `/slide/client` | Client slide view |
| `/slides/controller` | Slide controller |

## Backend (Rust / Tauri)

- GraphQL server starts on `http://localhost:6969/graphql` alongside the desktop app
- Schema: `Query`, `Mutation`, `Subscription` via `SlideSchema`
- Database: SQLite (`db.sqlite` at project root)
- ORM: SeaORM with migrations via `sea-orm-cli`

## Dev Commands

```bash
npm run dev         # Start Next.js dev server (port 3000)
npm run build       # Build Next.js
npm run tauri       # Build/run Tauri desktop app

# In src-tauri/
cargo install --path .    # Install Rust binary
sea-orm-cli migrate        # Run DB migrations
```

## Feature Status

### Done
- Desktop UI, lyrics display, program presentation
- Next/Prev slide navigation, slide overview, slide search
- Song / category / verse management
- Media content support

### Planned (todo.md)
- Liturgy customization: add songs, CRUD, reorder
- Bible verse slides and image slides
- Slide customization: font size, background, theme, transitions
- Slide history (copy past programs)
- Katekomena display during Fandraisana (name, photo, sampana, verses)
- Auto scroll / Karaoke-style real-time scroll
- Extra songs handling

## Notable Libraries

- `@dnd-kit` — drag-and-drop for liturgy ordering
- `kbar` — command palette
- `reveal.js` — presentation slide engine
- `zustand` — global state management
- `zod` + `react-hook-form` — form validation
- `next-auth` — authentication (beta)
- `@tanstack/react-table` — data tables