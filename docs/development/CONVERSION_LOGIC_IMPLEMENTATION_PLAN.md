## Conversion Logic Implementation Plan

Scope: Extend the application to fully align with the conversion logic described in `docs/product/CONVERSION_LOGIC_GUIDE.md`, focusing on rewards expansion, autonomy, dynamic rules, engagement, and richer dashboards.

Owner: Engineering
Status: In progress
Last updated: 2025-09-24

**MVP Scope**: Phase 1 (Extended Reward System) only
**Future Phases**: 2-5 will be implemented post-MVP

---

### Phase 1 — Extended Reward System (Gaming, Outings, Money, Experiences)

- [ ] Backend: Add reward types and redemption tracking
  - [x] Define `RewardType` enum: `GAMING_TIME`, `SOCIAL_OUTING`, `SPENDING_MONEY`, `SPECIAL_EXPERIENCE`
  - [x] Create `reward_redemptions` table (id, user_id, tenant_id, type, amount, notes, status, requested_at, decided_at, decided_by)
  - [x] Add tenant `reward_settings` (conversion rates and allowed reward types)
  - [x] Services: request, approve/reject, and list redemptions
  - [x] Permission checks: only PARENT/ADMIN approve (centralized via TenantsService)

- [ ] API: Reward endpoints (tenant-scoped)
  - [x] POST `/tenants/:tenantId/rewards/redemptions` (request redemption)
  - [x] GET `/tenants/:tenantId/rewards/redemptions` (list user/tenant)
  - [x] PUT `/tenants/:tenantId/rewards/redemptions/:id/approve`
  - [x] PUT `/tenants/:tenantId/rewards/redemptions/:id/reject`
  - [x] GET `/tenants/:tenantId/rewards/settings`
  - [x] PUT `/tenants/:tenantId/rewards/settings`

- [ ] Frontend: Redemption UI
  - [x] Multi-tab modal for reward types (time, outings, money, experiences)
  - [x] Parent approval queue UI (review, approve/reject)
  - [ ] Redemption history list by type and status

- [ ] Data & Migrations
  - [x] Migrations for `reward_redemptions` and `reward_settings`
  - [x] Migration successfully applied to database
  - [ ] Seed defaults per tenant

- [ ] Acceptance Criteria
  - [ ] Child can request any configured reward type
  - [ ] Parent can approve/reject; balances updated accordingly
  - [ ] Audit trail available per redemption

---

---

## Future Phases (Post-MVP)

### Phase 2 — Dashboard & Family Progress + Communication

- [ ] Backend: Progress analytics
  - [ ] Weekly/monthly completion stats, points earned, time redeemed
  - [ ] Family aggregate metrics; per-child breakdown
  - [ ] Simple notes/praise messages entity (family communications)

- [ ] API: Dashboard data
  - [ ] GET `/tenants/:tenantId/analytics/overview`
  - [ ] GET `/tenants/:tenantId/analytics/users/:userId`
  - [ ] POST `/tenants/:tenantId/communications` (praise/notes)
  - [ ] GET `/tenants/:tenantId/communications`

- [ ] Frontend: Dashboard enhancements
  - [ ] Family overview section with charts and trends
  - [ ] Child cards with KPIs and streaks
  - [ ] Activity feed with celebrations
  - [ ] Praise/notes composer and feed

- [ ] Acceptance Criteria
  - [ ] Parents see family progress at a glance
  - [ ] Kids see personal progress and praises

### Phase 3 — Child Autonomy: Task Selection, Challenges, Bonus Points

- [ ] Backend: Autonomy features
  - [ ] Available chores pool (opt-in assignments) with capacity windows
  - [ ] Challenges: chore + modifier (time-bound, difficulty multiplier)
  - [ ] Bonus point reasons: family values (kindness, teamwork)

- [ ] API: Autonomy
  - [ ] GET `/tenants/:tenantId/chores/available`
  - [ ] POST `/tenants/:tenantId/chores/:id/accept`
  - [ ] POST `/tenants/:tenantId/challenges`
  - [ ] POST `/tenants/:tenantId/bonuses/award`

- [ ] Frontend: Kid experience
  - [ ] "Pick a task" view with filters and rewards
  - [ ] Challenge accept/track UI with countdowns
  - [ ] Bonus badge surfacing on completion

- [ ] Acceptance Criteria
  - [ ] Kids can self-select tasks and accept challenges
  - [ ] Bonus points awarded and visible in history

### Phase 4 — Dynamic Rules & Seasonal Bonuses

- [ ] Backend: Rule engine (tenant-configurable)
  - [ ] Rule schema (conditions: date range, day, role; effects: multipliers, bonus minutes)
  - [ ] Seasonal presets (e.g., Back-to-School, Holidays)

- [ ] API: Rules
  - [ ] GET/PUT `/tenants/:tenantId/rules`
  - [ ] GET `/tenants/:tenantId/rules/active`

- [ ] Frontend: Parent configuration
  - [ ] Rules editor with presets and previews
  - [ ] Seasonal theme nudges on dashboard

- [ ] Acceptance Criteria
  - [ ] Parents configure rules impacting points/time
  - [ ] Active rules reflected in UI and calculations

### Phase 5 — Engagement: Competitions, Celebrations, Leaderboards

- [ ] Backend: Competitions
  - [ ] Sibling/parent-child competitions (scope, duration, scoring)
  - [ ] Celebration events on milestones (levels, streaks, totals)

- [ ] API: Competitions
  - [ ] POST `/tenants/:tenantId/competitions`
  - [ ] GET `/tenants/:tenantId/competitions`
  - [ ] GET `/tenants/:tenantId/leaderboard` (extended fields)

- [ ] Frontend: Engagement UI
  - [ ] Competition creation and progress views
  - [ ] Celebration animations for approvals/achievements
  - [ ] Enhanced leaderboard with filters

- [ ] Acceptance Criteria
  - [ ] Families run competitions with visible progress
  - [ ] Celebrations trigger on key events

---

### Cross-Cutting Concerns

- [ ] Security & Permissions: enforce ADMIN/PARENT vs CHILD across endpoints
- [ ] Tenant Isolation: all queries include `tenantId`
- [ ] Auditing: redemption approvals, rule changes, bonuses
- [ ] i18n: strings added to `frontend/src/messages/*.json`
- [ ] Accessibility: keyboard, contrast, motion settings

---

### MVP Milestone Tracking

- [ ] Phase 1 — Extended Reward System (MVP Scope)

### Future Milestone Tracking (Post-MVP)

- [ ] Phase 2 — Dashboard & Communication
- [ ] Phase 3 — Autonomy & Challenges
- [ ] Phase 4 — Dynamic Rules
- [ ] Phase 5 — Engagement & Celebrations

---

### References

- Conversion Logic: `docs/product/CONVERSION_LOGIC_GUIDE.md`
- Backend Entities: `backend/src/entities/*`
- Gamification Services: `backend/src/gamification/services/*`
- Frontend Dashboard: `frontend/src/app/[locale]/dashboard/page.tsx`
- Frontend Gamification API: `frontend/src/lib/api/gamification.ts`


