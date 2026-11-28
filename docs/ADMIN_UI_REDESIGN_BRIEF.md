# Noksha Admin Studio — UI/UX Redesign Brief

> **Audience:** Gemini (or any coding agent) working in `e:\Noksha`.
> **Goal:** Make the `/admin` panel more beautiful, calmer and much easier to use day to day. Keep every existing feature, API contract and permission rule working.
> **How to use this file:** Read it fully before you touch code. Work phase by phase (see §9). Finish each phase's checks before you start the next one.

---

## 0. Read these first (required)

| File | Why |
|---|---|
| `AGENTS.md` | This project runs **Next.js 16**, which has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before you use any routing, `useSearchParams`, `Suspense` or server/client API. |
| `.agents/skills/emil-design-eng/SKILL.md` | The design-engineering philosophy this panel follows: press states, motion timing, popover origin, and polish. |
| `src/components/admin/AdminCommandCentre.tsx` | The current panel. It is one ~4,200-line client component holding all 13 tabs. |
| `src/components/admin/adminTypes.ts` | Shared types: `AdminTab`, roles, payloads. |
| `src/components/admin/SiteContentEditor.tsx` | The CMS tab, which is already a separate file. |
| `src/app/globals.css` (from line ~494) | The existing `.admin-ui`, `.admin-press`, `.admin-surface-enter`, `.admin-toast`, `.admin-kpi-card` and `.admin-scroll` rules, plus `@theme` brand tokens. |
| `src/lib/auth.ts` | HMAC-signed stateless session cookies. **Do not change auth behaviour.** |
| `src/app/admin/invoice/[id]/page.tsx` | The standalone printable invoice. Keep it working. |

---

## 1. Hard constraints (never break these)

1. **Numerals always use Times New Roman.** Every number (prices, counts, dates, order IDs, phone numbers, badges, KPIs) must use `font-num` or `tabular-nums`, which resolve to `"Times New Roman Numerals"`. Check this on every new component.
2. **Never use the word "Ohongkar" / "অহংকার".** The category is **Wooden Jewelry Boxes** (short form: **Boxes**).
3. **The desktop sidebar stays fixed and does not scroll** (`lg:h-screen lg:overflow-hidden`). Only the main pane scrolls (`admin-scroll`). Sidebar links use `font-normal`. Do not bold them.
4. **Keep light-mode readability high.** Body text contrast must be at least 7:1. Secondary text must be at least 4.5:1. Do not use text colour lighter than `#6B6158` on the `#FAF9F7` background.
5. **Keep role gating.** Every tab and action must still respect `canAccessSection(role, tabId)`. The `staff` tab stays owner-only.
6. **Do not change any `/api/*` request or response shape.** This is a UI refactor only. If you think an endpoint is missing, list it in your final report. Do not add it silently.
7. **The in-app Invoice & Packing Slip modal must keep printing correctly.** `print:hidden` and `print:static` behaviour must survive.
8. **Do not add heavy dependencies.** The current stack is React 19, Tailwind v4 (`@theme` in CSS), and `lucide-react` for icons. Build primitives yourself. Do not add shadcn/radix/framer-motion unless you justify it in writing.
9. **Windows shell:** use `npm.cmd` and `npx.cmd`, not `npm`/`npx`. PowerShell 5.1 does not support `&&`; chain commands with `;`.
10. **Do not run `next build` while `next dev` is running.**

---

## 2. What's wrong today (diagnosis)

Fix these specifically:

- **Monolith:** 13 tabs, ~40 `useState` hooks, the print modal and all helpers live in one file. It is hard to keep consistent and slow to edit.
- **Hard-coded hex everywhere:** `#181512`, `#635A52`, `#7D7369`, `#F3F1ED` and others are repeated hundreds of times. There are no admin design tokens.
- **Text is too small in places:** group labels are `10.5px`, badges `10.5px`, table headers `11px`. These strain the eyes on a 1080p laptop.
- **Buttons, inputs and cards are inconsistent:** padding, radius and hover colours vary from tab to tab.
- **Native `confirm()` / `alert()`** is used in 6 places. These dialogs are jarring and off-brand.
- **There are no loading skeletons or designed empty states.** Empty tables look broken.
- **On mobile, the sidebar becomes a horizontal scroll strip** of 13 items. That is hard to scan and hard to tap.
- **Orders are handled in a table only.** There is no detail drawer, no bulk action and no quick status change. Staff jump between views to do a single dispatch.
- **The active tab is not in the URL.** Refreshing the page or sharing a link always opens "Command Overview".
- **There is no global search and no keyboard shortcuts.**

---

## 3. Design direction — "Quiet Atelier"

The panel should feel like **Linear/Vercel-grade clarity with Noksha's warmth**. It is a calm workspace of warm paper tones, with gold used **only** as a signal (active item, primary focus, key metric). It is not a decorated storefront.

- **Calm over clever.** Use 1 accent colour, 2 surface levels and hairline borders. Use shadow only on floating layers.
- **Density with breathing room.** Data-heavy tables use 44px rows. Forms use roomier spacing.
- **Hierarchy through weight and size, not colour.** Too many colours is noise.
- **Every interactive element gives feedback** on hover (pointer devices only), press (`scale(0.97)`) and focus (a visible ring).
- **Brand moments are small:** the logo, a faint kantha-stitch divider under page titles (optional), and gold on the active nav icon. Nothing else is decorative.

---

## 4. Design tokens (create these first)

Add an admin token layer in `globals.css`, scoped to `.admin-ui`. Then **replace the hard-coded hex values in admin components with these variables** (as Tailwind arbitrary values, e.g. `bg-[var(--a-surface)]`, or add them to `@theme` as `--color-a-*` so they become utilities like `bg-a-surface`).

```css
.admin-ui {
  /* Surfaces */
  --a-canvas:   #FAF9F7;  /* app background */
  --a-sidebar:  #F3F1ED;
  --a-surface:  #FFFFFF;  /* cards, tables */
  --a-subtle:   #F6F4F0;  /* table header, hover rows, input bg */
  --a-overlay:  rgba(24, 21, 18, 0.45);

  /* Borders */
  --a-border:        rgba(24, 21, 18, 0.08);
  --a-border-strong: rgba(24, 21, 18, 0.16);

  /* Text */
  --a-text-1: #181512;  /* primary */
  --a-text-2: #4A423B;  /* secondary */
  --a-text-3: #6B6158;  /* tertiary / captions (minimum allowed) */

  /* Accent (brand gold) — use sparingly */
  --a-accent:      #B08A4F;
  --a-accent-soft: #F7F0E3;
  --a-ink-btn:     #181512;  /* primary button bg */
  --a-ink-btn-hover:#2F2721;

  /* Status */
  --a-success: #067647;  --a-success-bg: #ECFDF3;
  --a-warning: #B54708;  --a-warning-bg: #FFFAEB;
  --a-danger:  #B42318;  --a-danger-bg:  #FEF3F2;
  --a-info:    #175CD3;  --a-info-bg:    #EFF8FF;

  /* Radius / shadow */
  --a-radius-sm: 6px;  --a-radius: 10px;  --a-radius-lg: 14px;
  --a-shadow-card: 0 1px 2px rgba(24,21,18,0.04);
  --a-shadow-pop:  0 12px 32px rgba(24,21,18,0.14), 0 0 0 1px rgba(24,21,18,0.06);
  --a-ring: 0 0 0 3px rgba(176,138,79,0.28);
}
```

### Type scale (Inter / system stack, already set on `.admin-ui`)

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 24px / 32px | 600 | Page title |
| `title` | 16px / 24px | 600 | Card / section title |
| `body` | 14px / 22px | 400 | Default text, table cells |
| `body-sm` | 13px / 20px | 400 | Secondary text, inputs |
| `caption` | 12px / 16px | 500 | Labels, table headers (uppercase, 0.04em tracking), badges |

**Nothing in the admin may be smaller than 12px.** Raise the current 10.5px and 11px instances to 12px.

### Spacing and layout

- Use a 4px grid only (4/8/12/16/20/24/32/40).
- Main content max-width is `1280px`, centred, with padding `24px` (desktop) and `16px` (mobile).
- Use a 24px gap between cards and a 16px gap inside cards.

### Motion (from the Emil skill)

- Hover and colour changes: `150ms ease`.
- Press: `transform: scale(0.97)` over `150ms var(--ease-out)`.
- Popovers, menus and dialogs enter from `opacity 0; translateY(4px) scale(0.98)` in `180–220ms var(--ease-out)`. **Never from `scale(0)`.**
- Drawers: `transform` in `280ms var(--ease-drawer)`.
- Toasts: keep the existing `.admin-toast` keyframes and stack up to 3.
- Respect `prefers-reduced-motion`: drop transforms and keep opacity.
- Never animate layout properties (width/height/top) on hot paths.

---

## 5. Component library to build

Create `src/components/admin/ui/` and build **small, typed, unstyled-API** primitives. Every tab must use these. There should be no ad-hoc button classes afterwards.

| Component | Key spec |
|---|---|
| `Button` | Variants: `primary` (ink bg, white text), `secondary` (white, border), `ghost`, `danger`. Sizes: `sm` 30px, `md` 36px. Supports `loading` (spinner plus disabled), `leftIcon`, and `kbd` hint. Always includes `admin-press`. |
| `IconButton` | 32×32 square. Requires `aria-label` and a tooltip. |
| `Input`, `Textarea`, `Select` | 36px tall, `--a-subtle` bg, 1px `--a-border`, radius `--a-radius-sm`. Focus shows `--a-ring` with `--a-accent` border. Error state is a red border plus a message below. |
| `Field` | Label (12px, 500, `--a-text-2`), optional hint, error slot. Spacing is consistent. |
| `Card` | `--a-surface`, 1px `--a-border`, `--a-radius-lg`, `--a-shadow-card`. Optional header with `title`, `description` and `actions`. |
| `PageHeader` | Title, one-line description, primary action on the right, optional tabs/filters row below. |
| `Badge` / `StatusBadge` | Pill with a dot. Reuse the current `StatusBadge` map, but drive it from the status tokens. 12px text. |
| `KpiCard` | Label, big number (`font-num`), delta chip (▲/▼ vs previous period, green/red), optional sparkline (inline SVG, no library). |
| `DataTable` | Sticky header, 44px rows, hover row, optional checkbox column with select-all, sortable column headers (caret icon), right-aligned numeric columns using `font-num`. Built-in empty, loading and error states. On mobile, rows collapse into stacked cards. |
| `EmptyState` | Icon in a soft circle, one-line title, helpful sentence, primary action. **Every list needs a tailored one** (e.g. "No orders yet — share your latest Drop to get the first one."). |
| `Skeleton` | Shimmer blocks for KPIs, table rows and cards. Show them while `fetchDashboard` loads. |
| `Drawer` | Right-side sheet, 480px wide (full width on mobile). Has a header, scrollable body and sticky footer actions. Closes on Esc and on backdrop click, and traps focus. |
| `Dialog` / `ConfirmDialog` | Replaces **all** `confirm()` / `alert()`. Destructive confirms use the `danger` button and state the consequence ("This permanently deletes NK-KZRST87"). |
| `Toast` (+ `useToast`) | Stack in the bottom-right. Variants: success/error/info. Optional **Undo** action for reversible changes. |
| `SegmentedControl` | For status filters (All / New / Confirmed / …). Shows counts in `font-num`. |
| `DropdownMenu` | For row "⋯" actions. Opens from its trigger (transform-origin at the trigger). Keyboard navigable. |
| `Tooltip` | 400ms delay on first show, instant for adjacent tooltips. Hidden on touch devices. |
| `Kbd` | Small keycap for shortcut hints. |

---

## 6. Architecture refactor (do this before visual polish)

Split the monolith without changing behaviour:

```
src/components/admin/
  AdminCommandCentre.tsx      ← shell only: auth gate, layout, sidebar, top bar, tab router
  AdminShell/Sidebar.tsx
  AdminShell/TopBar.tsx
  AdminShell/CommandPalette.tsx
  hooks/useAdminData.ts       ← fetchDashboard, data, loading, error, refresh
  hooks/useAdminTab.ts        ← tab ⇄ URL sync (?tab=orders&status=new)
  print/OrderSlipModal.tsx    ← the existing printable slip, unchanged output
  tabs/OverviewTab.tsx
  tabs/AnalyticsTab.tsx
  tabs/OrdersTab.tsx
  tabs/CancellationsTab.tsx
  tabs/CollectionsTab.tsx     (Drops & Categories)
  tabs/ProductsTab.tsx
  tabs/CustomersTab.tsx
  tabs/AbandonedTab.tsx
  tabs/LeadsTab.tsx
  tabs/PromosTab.tsx
  tabs/ContentTab.tsx         (wraps SiteContentEditor)
  tabs/StaffTab.tsx
  tabs/AuditTab.tsx
  ui/…                        ← primitives from §5
```

Rules:
- Move code **verbatim first**, then typecheck, then restyle. Do not mix moving and redesigning in one step.
- Tabs receive `data`, `refresh`, `toast` and `role` through props or a small `AdminContext`. Do not prop-drill 20 setters.
- Keep per-tab form state inside the tab, not in the shell.
- **URL sync:** follow the Next 16 docs for `useSearchParams` (it likely needs a `<Suspense>` boundary). Use `router.replace` so tab switches don't fill browser history.

---

## 7. Layout and navigation spec

### Desktop (≥ 1024px)
- **Sidebar, 248px, fixed:**
  - Logo row (56px) with an "Open storefront ↗" icon button.
  - A search trigger button: "Search…  ⌘K".
  - Grouped nav. Group labels are 12px, uppercase, `--a-text-3`. Items are 34px tall, 14px, `font-normal`.
  - The active item has a white bg, subtle ring and gold icon. Badges use `font-num`, and alert badges (cancellations) are red.
  - Pin the profile strip to the bottom: avatar, name, role, Refresh, Sign out.
  - Optional: a collapse-to-icons mode (64px), with the state saved to `localStorage`.
- **Top bar (56px, sticky inside main pane):** breadcrumb (`Orders / NK-KZRST87`), then on the right a date-range picker (Overview/Analytics only), a "Last synced 2m ago" text button that refreshes, and a "View store" link.
- **Main pane:** `PageHeader` followed by content. Scroll happens here only.

### Mobile (< 1024px)
- Replace the horizontal nav strip with a **top bar showing a hamburger, the page title and a search icon**. The hamburger opens the nav in a left `Drawer`.
- Add a **bottom tab bar** with the 4 most-used tabs (Overview, Orders, Products, Customers) plus "More". Each target is at least 44px.
- Tables become card lists (see `DataTable`).

### Command palette (⌘K / Ctrl+K)
- Jump to any tab.
- Search orders by ID, phone or name; products by name; customers by phone.
- Quick actions: "New product", "New promo code", "Export audit CSV", "Reset demo data" (owner only, with confirmation).
- Fully keyboard-driven (↑ ↓ Enter Esc), filters as you type, and shows recent items.

### Keyboard shortcuts
`g o` Overview · `g r` Orders · `g p` Products · `g c` Customers · `/` focus search · `n` new item in current tab · `Esc` close drawer/dialog · `?` shortcuts help sheet.

---

## 8. Per-tab UX improvements

### Command Overview
- Row 1 has 4 KPI cards: **Revenue (period)**, **Orders**, **Avg. order value**, **Pending dispatch**. Each shows a delta vs the previous period and a sparkline.
- Row 2 has a **"Needs attention" card** listing new unconfirmed orders, cancellation requests, low/zero stock, and unverified payments older than 1 hour. Each line links straight to the filtered view.
- Row 3: a revenue chart (inline SVG area chart, 30 days) and **Recent orders** (last 6, with a "View all" link).
- Greeting line: "Good afternoon, {name} — 3 orders are waiting to be packed."

### Analytics & Funnel
- Date-range presets: Today, 7d, 30d, 90d, Custom.
- Show the funnel as horizontal bars with step-to-step conversion %.
- Top products table and a sales-by-district list. Every number uses `font-num`.

### Orders Pipeline (highest priority)
- A `SegmentedControl` status filter with counts. Search by ID, phone or name. Filter by payment status. Sort by date or total.
- **Click a row to open the Order Drawer.** Do not navigate away. The drawer contains:
  - Header: order ID (copy button), `StatusBadge`, created time (relative, with the full date in a tooltip).
  - Customer block: name, phone (copy + **WhatsApp** + call buttons), full address (Division › District › Upazila › Street).
  - Items with thumbnails, the totals breakdown, payment method, UddoktaPay status and TrxID (copy).
  - A **status stepper** (New → Confirmed → Packed → Shipped → Delivered). Clicking the next step updates the status with an optimistic UI and an **Undo** toast.
  - Courier name and tracking code fields, inline-editable and auto-saved with a "Saved" tick.
  - Gift note and customer notes, highlighted.
  - Footer: **Print slip**, **Cancel order** (danger, with confirmation).
- **Bulk actions:** select rows, then a sticky action bar ("3 selected · Mark packed · Print slips · Export CSV").
- Row "⋯" menu: View, Print slip, Copy tracking link, Cancel.

### Cancellation Requests
- Show a card per request with the order summary, the customer's reason, and the time since the request.
- Two clear buttons: **Approve & cancel** (danger) and **Reject** (secondary, with an optional note).
- The empty state reads "No pending cancellation requests 🎉".

### Drops & Categories / Products & Inventory
- Add a **grid/table view toggle**, with image thumbnails in both.
- Edit in a **Drawer**, not inline expanding rows. Group the form into sections: Basics, Pricing & Stock, Media, Story & Craft, Visibility.
- Image uploader: drag-and-drop zone, preview grid, reorder by drag, a "Set as cover" option, and alt text field.
- Stock column: a coloured chip (In stock / Low ≤ 2 / Sold out). 1-of-1 Drop pieces show an "Acquired" badge with the buyer's order link.
- Guard unsaved changes when closing a drawer with edits ("Discard changes?").
- Show inline validation (price > 0, slug unique, at least 1 image) before submit.

### Customers CRM
- Table: name, phone, orders count, lifetime value (`font-num`), last order (relative), district.
- Customer drawer: profile, order history timeline, waitlist entries, notes field, WhatsApp button.
- Tags/segments: "Repeat", "High value", "Founding Circle".

### Abandoned Carts
- Show cart value, items, time since abandonment, and contact.
- **"Send WhatsApp reminder"** opens `wa.me` with a pre-filled, editable, polite message template.
- Mark as contacted, so the row dims and moves to a "Contacted" filter.

### Waitlist & Leads
- Keep the 4 lead filters as a `SegmentedControl`.
- Add CSV export per segment and copy-all-phones.
- Show a "Converted" badge when a waitlist phone has purchased.

### Promo Codes
- Show each code as a card: code in monospace with a copy button, discount, usage `used / limit` with a thin progress bar, expiry (relative), and an active toggle switch.
- Create/edit happens in a Drawer, with a live preview line ("Customer saves ৳500 on orders above ৳5,000").

### Site Content CMS
- Keep `SiteContentEditor`, but wrap it in the new `Card`/`Field` primitives.
- Use a two-column layout: the form on the left, a **live preview** of the section on the right (desktop).
- Add a sticky "Unsaved changes · Discard · Publish" bar that appears only when the form is dirty.

### Staff & Roles (owner only)
- Table of staff with role badges. "Invite staff" opens a Drawer.
- Show a role-permission matrix (read-only grid of tabs × roles with ✓) so the owner understands what each role can see.

### Activity Audit Log
- Show a timeline grouped by day ("Today", "Yesterday", "24 Nov 2026").
- Each event has an actor avatar, an action sentence and a relative time.
- Filters: actor, action type (login, failed login, order change, product change…), date range.
- Highlight failed logins in red. Keep CSV export.

---

## 9. Phased execution plan

Finish each phase, run its checks, and commit. Then move on.

| Phase | Deliverable | Verify |
|---|---|---|
| **1. Tokens** | Add `.admin-ui` tokens and the type scale to `globals.css`. No visual regressions yet. | `npx.cmd tsc --noEmit` |
| **2. Split** | Move tabs, hooks and the print modal into separate files (§6) **with no visual change**. | `tsc`, then click through all 13 tabs in `next dev`, print a slip |
| **3. Primitives** | Build `ui/*` (§5). | `tsc`. Build a temporary `/admin` "UI kit" section (owner only, removed later) to eyeball every state. |
| **4. Shell** | New sidebar, top bar, mobile drawer + bottom bar, URL tab sync, command palette, shortcuts. | Test at 1440px, 1024px, 390px. Check that refresh keeps the tab. |
| **5. Orders** | Orders tab + Order Drawer + bulk actions + Cancellations. | Run a full order lifecycle in dev. Undo works. Slip prints. |
| **6. Catalog** | Products + Drops drawers, uploader, validation. | Create, edit and delete a product and a Drop piece |
| **7. Rest** | Overview, Analytics, Customers, Abandoned, Leads, Promos, CMS, Staff, Audit. | Every tab has loading, empty and error states |
| **8. Polish** | Motion pass, focus rings, reduced-motion, contrast audit, remove all `confirm()`/`alert()`, remove the UI-kit page. | Run the checklist in §10 |

**Commit message format:** `admin-ui: <phase> — <summary>`. Push to `origin main` only when the user asks.

---

## 10. Acceptance checklist

**Visual**
- [ ] No admin text smaller than 12px. Secondary text is `#6B6158` or darker.
- [ ] Every number uses Times New Roman (`font-num` / `tabular-nums`).
- [ ] No hard-coded hex values remain in admin components (tokens only). The printable slip may keep neutral print colours.
- [ ] One accent colour (gold), used only for active, focus and key highlights.
- [ ] Cards, buttons, inputs and badges are identical across all tabs.

**Usability**
- [ ] The active tab and filters persist in the URL and survive a refresh.
- [ ] ⌘K / Ctrl+K palette works. `?` shows the shortcuts sheet.
- [ ] Orders can be viewed, advanced, given a courier and printed **without leaving the Orders tab**.
- [ ] Every destructive action uses `ConfirmDialog`. Reversible status changes offer **Undo**.
- [ ] Every list has a tailored empty state and a skeleton loader.
- [ ] Forms validate inline and warn on unsaved changes.
- [ ] Copy-to-clipboard exists for order ID, phone, TrxID and promo code, with a toast confirmation.

**Responsive & accessible**
- [ ] Works at 390px, 768px, 1024px and 1440px. The mobile nav uses a drawer and bottom bar, not a horizontal scroll strip.
- [ ] All tap targets are at least 44px on touch devices. Hover effects are gated by `(hover: hover) and (pointer: fine)`.
- [ ] Visible focus ring on every interactive element. Drawers and dialogs trap focus and close on Esc.
- [ ] Icon-only buttons have `aria-label`s. Status is never conveyed by colour alone (dot plus text).
- [ ] `prefers-reduced-motion` is respected.

**Integrity**
- [ ] `npx.cmd tsc --noEmit` passes.
- [ ] All `/api/*` calls are unchanged. Login, logout and role gating behave exactly as before.
- [ ] The printable slip and `/admin/invoice/[id]` both print correctly.
- [ ] The sidebar stays fixed on desktop and its links stay `font-normal`.
- [ ] The word "Ohongkar" appears nowhere.

---

## 11. Don'ts

- Don't add gradients, glassmorphism, drop shadows on cards, or emoji in UI chrome (one celebratory emoji in an empty state is fine).
- Don't use more than one primary button per view.
- Don't animate from `scale(0)`, and don't animate width/height.
- Don't hide important actions behind hover only. Touch users need them too.
- Don't use colours outside the token set.
- Don't change database schema, API routes or auth as part of this work.
- Don't delete features. If something looks unused, ask first.

---

## 12. Final report (what to hand back)

When done, reply with:
1. A list of changed and new files, as clickable links.
2. Before/after screenshots of Overview, Orders (with the drawer open), Products, and mobile nav.
3. Any API gaps you found (e.g. "bulk status update endpoint would reduce N requests to 1").
4. Any deviations from this brief, and why.
