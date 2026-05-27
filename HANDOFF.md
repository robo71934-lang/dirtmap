# Dirtmap — Project Handoff

A California camping + hiking app. Think HipCamp meets AllTrails, but built around a "campfire field guide" aesthetic (leather/gold/dark warm browns, serif typography). NOT the clean-white AllTrails-SaaS look. Camping is the container, trails are nested inside each campsite. Early access stage.

## Tech stack
- React + Vite single-page app
- Client-side only — no backend yet
- localStorage for "accounts" and user ratings

## Path
`C:\Users\Letmein\Desktop\Dirtmap`

## Key files
- `src/App.jsx` (~90 KB) — all components live here
- `src/App.css` — global styles, paper-grain texture, letterpress shadows
- `index.html` — Google Fonts (Cinzel + EB Garamond) loaded via link tags
- `.env` — needs `VITE_NPS_API_KEY` for NPS API integration

## What's built

### Planner tab
- 4-step flow: Region → Terrain → Sleep Style → Spots & Trails
- Stepper UI with smooth scroll between sections
- 2 regions (SoCal, NorCal), 8 terrains, 9 sleep styles
- ~15 curated CA campsites with full data (water, cell, bear rules, permits, wildlife, stargazing, trails)
- Group-size slider (1-12) + filter chips (All / Iconic / Popular / Hidden Gems)
- Season-aware sleep-fit logic (uses current month)
- Sticky featured panel on desktop, stacks below on mobile
- NPS API live section at the bottom

### Pack tab
- 4 trip lengths (Day / Overnight / Multi-day / Extended)
- Checklists with real checkboxes + progress bars
- Weight guide

### Account tab
- Local-only login (name + email in localStorage)
- "Real backend later" caveat shown to user

### User ratings
- 5-star, persists per trail in localStorage
- Average shown with count, "Not yet rated" empty state
- Only logged-in users can rate

### Other
- Floating draggable pack-tracker bubble (% complete)
- Accessibility pass complete (aria-pressed, aria-expanded, focus-visible rings, semantic buttons)
- Mobile responsive (media queries at 900px and 600px)
- Typography: Cinzel display + EB Garamond body, paper-grain texture, letterpress shadows on gold

## Working style preferences

User is on the $20 Claude plan — work lean.
- Prefer `Edit` over `Write` (surgical diffs, not full rewrites)
- Don't over-question; commit to a move
- Short replies, no over-explanation
- Reference existing files by path; don't have user repaste them
- Use the `request_cowork_directory` tool to access `C:\Users\Letmein\Desktop\Dirtmap` if not already mounted

## Aesthetic guardrails

User explicitly dislikes minimalist AllTrails/Patagonia-landing-page vibes. Keep it warm, serif, hand-crafted, leather-bound-field-guide.

Color palette (in `T` const at top of App.jsx):
- nightCamp `#1a0f08` (page background)
- leather `#3d2b1f`, leatherDark `#2a1d14` (card backgrounds)
- gold `#c29b61` (accent), goldBright `#d4a574`
- text `#e2d5c3`, muted `#887766`
- good `#7fa650`, warn `#d49344`, bad `#c54f4f`

## Last actions

Wired up Google Fonts via `<link>` tags in `index.html` and added missing `import './App.css';` in App.jsx. User needs to hard-refresh to verify Cinzel applies to the "dirtmap" wordmark.

## Next moves on deck

1. **Deploy to Vercel** — site is static-ready, no backend needed yet. Push to GitHub, connect Vercel, set `VITE_NPS_API_KEY` env var, ship.
2. **Real backend via Supabase** — so ratings/accounts sync across devices. Free tier, ~30 min setup.
3. **HipCamp-style map view** — with price pins, NOT AllTrails-style trail-count clusters.
4. **More curated spots** — expand the 15 existing ones, still California-only for now.
5. **Comments/community** — explicitly deferred per user ("way later").
