# Demo: Copilot → Planner → Dashboard (Connected System Loop)

This is the single demo path that proves Gradual is a connected career operating system, not a collection of isolated tools.

---

## Prerequisites

- Logged-in account with a partial profile (name, one skill, no CV score)
- Dashboard open in one browser tab, Copilot open in another

---

## Step-by-step demo path

### 1. Open the Dashboard — observe baseline state

Go to `/dashboard`.

- "Today's Focus" metric card shows **0 tasks** (or whatever today's count is).
- "This Week's Focus" section is either empty or showing a stale plan badge.
- Career signal banners reflect current profile gaps.

Note the numbers — you'll compare them after the loop runs.

### 2. Open Copilot — ask for a weekly plan

Go to `/copilot`.

Type (or click the quick action chip):

> Generate my weekly plan based on my profile, CV, applications, and to-dos.

G.ai responds with a structured weekly plan (streamed in real-time).

**What to observe:**
- The weekly plan card appears below the AI reply: "Weekly plan ready — N tasks across the week"
- The right sidebar (Career Signals) reflects profile gaps, CV status, and today's events

### 3. Send the plan to the Planner

Click **Send to Planner** on the weekly plan card.

**What to observe immediately (same page):**
- Button changes to "Sent" ✓
- The Copilot sidebar's **Today** section refreshes — if any of the generated events fall on today's date, they appear in the sidebar list with the Brain icon (AI-generated marker), with no page reload

This is the **Copilot → Planner** seam. The plan is now in Firestore under `users/{uid}/planner_events`.

### 4. Observe the Copilot sidebar update

The sidebar uses the same SWR cache key as the Dashboard (`/api/dashboard/intelligence?date=TODAY`). After the send, `mutate()` fires and the sidebar revalidates — today's new events appear immediately.

### 5. Switch to the Planner — see the events

Go to `/planner` (week view).

**What to observe:**
- AI-generated events appear in blue with a Brain icon across the week
- Today's column is highlighted; events from G.ai are visually distinct from personal tasks
- Click any event → the Task Detail Panel slides in, showing title, notes, and the "AI-generated" badge

### 6. Switch to the Dashboard — observe the update

Go to `/dashboard`.

**What to observe:**
- "Today's Focus" metric card now shows the number of tasks planned for today
- "Today's Plan" section lists those tasks (with the blue "AI" badge for Copilot-sourced events)
- "This Week's Focus" section shows the weekly plan priorities from G.ai

The Dashboard's intelligence data comes from the same `/api/dashboard/intelligence` endpoint, which the Planner page already invalidates via SWR `mutate()` after any write (add, edit, delete). Because the Copilot page now also fires `mutate()` after writing to the planner, both entry points keep the Dashboard in sync without a manual refresh.

---

## The loop in one sentence

> G.ai generates a plan → user sends it to the Planner → the Dashboard's "Today's Focus" count and event list update automatically, with no page reload required.

---

## Verifying the seams

| Seam | Trigger | Observable effect |
|---|---|---|
| Copilot → Planner (weekly plan) | "Send to Planner" button | Copilot sidebar refreshes; Planner shows events with Brain icon |
| Copilot → Planner (single todo) | Calendar icon on a suggested action | Same sidebar refresh; event appears in Planner |
| Planner → Dashboard | Add / edit / delete any event in Planner | Dashboard "Today's Focus" count and list update |
| Copilot sidebar ↔ Dashboard | Shared SWR key `/api/dashboard/intelligence?date=TODAY` | Both surfaces stay in sync after any planner write |

---

## Notes for demos

- Use today's date so the plan events land in "Today's Focus" on the Dashboard
- The `source: 'copilot'` field is what causes the blue AI badge and Brain icon to appear
- The SWR dedup interval is 30s — a second fetch within 30s returns cached data; to force a refresh, use the Planner's add/delete actions which call `mutate()` directly
