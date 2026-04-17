I'm continuing a premium UI refactor of Gradual (career OS for students). Phase 1 is committed. You now have 11 UI/UX plugins loaded — use them aggressively. Read this fully before starting.

## What was completed in Phase 1 (commit 8c7eb98)

**Structural:**
- New `src/components/AppShell.tsx` — left sidebar navigation replacing top navbar for authenticated users. Three sections: Primary (Dashboard, Copilot, Paths), Workspace (Opportunities, CV Score, Suggestions, Planner, Tracker), Account (Profile, Settings). Dark mode toggle + logout in sidebar footer. Mobile hamburger drawer with overlay.
- `src/components/ConditionalLayout.tsx` — routes authenticated pages through AppShell, keeps original top navbar for public/landing pages.
- All 10 app pages converted from `pt-20` top-nav padding to `page-container` layout class.

**Design System (globals.css):**
- New tokens: `--sidebar-width`, `--space-page-x/y`, `--space-section`, `--space-card-padding`, `--heading-xl/lg/md/sm`
- New utility classes: `.page-container`, `.page-header`, `.page-title`, `.page-subtitle`, `.section-gap`
- Full sidebar CSS: `.app-shell`, `.app-sidebar`, `.app-main`, `.sidebar-nav-item`, `.sidebar-section-label`
- Responsive: sidebar collapses to drawer on `<lg` breakpoints

**Page cleanups:**
- Dashboard: uses page-container, page-title, section-gap
- Copilot: height adjusted for sidebar shell (`h-[calc(100dvh-3rem)] lg:h-screen`)
- Paths: page-container, page-title
- Planner: page-container, page-title
- Suggestions: page-container, modernized header
- Tracker: **heavy cleanup** — removed 50+ hardcoded dark-mode classes, migrated to CSS variables, badges use design system
- CV Score: modernized header and disclaimer card
- Career Suggestions: modernized header
- Profile: page-container
- Settings: page-container, page-title
- Footer: migrated from hardcoded `dark:` classes to CSS variables

## What still needs to be done (Phase 2)

**Use your installed plugins** — frontend-design, ui-designer, frontend-developer, playground, accessibility-expert, ux-researcher, code-simplifier, feature-dev, code-review, typescript-lsp, skill-creator.

### Critical remaining work:

1. **Visual polish of the sidebar** — it's functional but needs premium feel. Add:
   - Subtle hover/active transitions matching Linear/Notion quality
   - Active page indicator (left accent bar or background treatment)
   - User avatar or initials in the sidebar footer area
   - Smoother mobile drawer animation (currently basic transform)
   - Consider collapsible sidebar for more content space

2. **Deep cleanup of remaining hardcoded dark-mode classes:**
   - `src/app/cvscore/page.tsx` — ~48 lines of `text-white`, `bg-white/`, `text-gray-*` still present
   - `src/app/career-suggestions/page.tsx` — ~13 lines remaining
   - `src/app/suggestions/page.tsx` — ~7 lines (mostly type badges, less critical)

3. **Typography hierarchy enforcement:**
   - The `--heading-xl/lg/md/sm` tokens are defined but many pages still use ad-hoc `text-2xl`, `text-lg`, `text-sm font-semibold` instead of the system
   - Section headers across pages need unification (some use uppercase tracking-wide, some don't)
   - Card titles should use a consistent pattern

4. **Spacing rhythm tightening:**
   - Cards still use mixed padding: `p-4`, `p-5`, `p-5 sm:p-6`, `p-6` — standardize to `--space-card-padding`
   - Gap between sections varies — enforce `section-gap` everywhere
   - Inner card element spacing needs consistency

5. **Component consistency:**
   - Create or refactor a shared `PageHeader` component (icon + title + subtitle + optional action)
   - Loading states differ across pages — create a shared `PageLoader` component
   - Empty states use `.empty-state` class inconsistently — audit and unify
   - Metric cards on dashboard should be a reusable component

6. **Premium interactions and states:**
   - Hover states on sidebar items, cards, and buttons need refinement
   - Active/selected states need stronger visual differentiation
   - Loading skeleton placeholders instead of just spinners
   - Subtle page entrance animations (the PageTransition component exists but could be improved)
   - Focus-visible states for keyboard navigation (accessibility)

7. **Copilot page refinement:**
   - Already strongest page — preserve chat layout, sidebar context, quick actions
   - Could improve: conversation list styling, message bubble refinement, input area polish
   - Empty state quick action cards could have more visual personality

8. **Planner page uplift:**
   - Week view 7-column grid gets cramped on smaller screens — needs responsive breakpoint
   - Event cards inside day columns need better visual treatment
   - Today highlight could be stronger
   - Add task input at bottom of each day needs more polish

9. **Dashboard refinements:**
   - Metric cards are good but could have subtle gradient or accent treatment
   - Weekly plan grid day columns could be tighter
   - Signal banners work well — keep them
   - Capability Building card empty state could be more inviting

10. **Opportunities page:**
    - Tab navigation styling needs premium treatment
    - Opportunity cards need consistent card pattern
    - Filter controls need visual alignment with design system

## Design direction (do not deviate):
- Premium SaaS: Linear, Notion, Stripe Dashboard, Raycast as inspiration
- Modern, calm, high-signal — refined rather than flashy
- Clean without feeling generic
- Spacious breathing room
- No gimmicky animations, no overly playful elements, no template feel

## Constraints:
- Do NOT break working functionality
- Do NOT redesign pages that are already strong (Copilot, Dashboard, Paths)
- Do NOT add features — this is purely UI/UX polish
- Do NOT hardcode any dark-mode Tailwind classes — always use CSS variables
- Keep the implementation production-grade
- Run `npx tsc --noEmit` and `npx next build` to verify before finishing

## Files to read first:
- `src/app/globals.css` — the full design system
- `src/components/AppShell.tsx` — the new sidebar
- `src/components/ConditionalLayout.tsx` — routing logic
- `CLAUDE.md` — project standards

Start by auditing what Phase 1 delivered, identify the highest-impact remaining items, then implement them systematically. Use the playground plugin to prototype any tricky interactions before committing to them. Use code-simplifier to clean up any redundancy you find.
