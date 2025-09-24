## Phase 1: Rewards Extension — Step-by-Step Implementation

Goal: Extend rewards beyond gaming time to include social outings, spending money, and special experiences with tenant-configurable settings and a parent approval flow.

Owner: Engineering
Status: Not started
Last updated: 2025-09-24

---

### Step 0 — Planning & Alignment

- [ ] Confirm reward types in MVP: `SOCIAL_OUTING`, `SPENDING_MONEY`, `SPECIAL_EXPERIENCE`
- [ ] Confirm which request fields are required per type (e.g., amount/cost, notes)
- [ ] Confirm approval policy (PARENT/ADMIN only) and audit requirements

Deliverable: This document agreed upon; scope locked for Phase 1.

---

### Step 1 — Data Model & Migrations

- [ ] Define `RewardType` enum in `@tiggpro/shared`
- [ ] Create `reward_redemptions` table
  - id (uuid), tenant_id (uuid), user_id (uuid), type (enum), amount (int|null), notes (text|null)
  - status (enum: pending, approved, rejected), requested_at, decided_at, decided_by
- [ ] Create `reward_settings` table (tenant-scoped)
  - id, tenant_id, enabled_types (jsonb), default_conversion (jsonb), created_at, updated_at
- [ ] Generate and run migrations

Deliverable: Schema in place; migrations applied locally.

---

### Step 2 — Backend Domain & Services

- [ ] Entities: `RewardRedemption`, `RewardSettings`
- [ ] DTOs: request, approve, reject, update settings
- [ ] Services:
  - `RewardRedemptionsService`: create request, list (by user/tenant), approve/reject
  - `RewardSettingsService`: get/update tenant settings
- [ ] Integrations:
  - On approve: adjust `UserPoints.availableGamingMinutes` only if type is gaming time; for other types, just log approval (no balance change) and emit event for UI/history
  - Permissions: verify PARENT/ADMIN for approve/reject; tenant membership checks everywhere

Deliverable: Unit-tested services with guards and validations.

---

### Step 3 — Backend API Endpoints (Tenant-Scoped)

- [ ] POST `/tenants/:tenantId/rewards/redemptions` (child requests)
- [ ] GET `/tenants/:tenantId/rewards/redemptions` (list; supports role-based filtering)
- [ ] PUT `/tenants/:tenantId/rewards/redemptions/:id/approve`
- [ ] PUT `/tenants/:tenantId/rewards/redemptions/:id/reject`
- [ ] GET `/tenants/:tenantId/rewards/settings`
- [ ] PUT `/tenants/:tenantId/rewards/settings`

Deliverable: Swagger-documented endpoints with e2e happy paths.

---

### Step 4 — Frontend API Client & Types

- [ ] Shared types for `RewardType`, `RedemptionStatus`, `RewardRedemption`, `RewardSettings`
- [ ] Client: `rewardsApi` with methods matching endpoints
- [ ] Query keys and hooks via TanStack Query

Deliverable: Typed client with error handling consistent with existing api utilities.

---

### Step 5 — Frontend UI (MVP)

- [ ] Child: Redemption Modal (multi-tab)
  - Tabs: Gaming Time, Outing, Money, Experience (enabled based on settings)
  - Forms per type (validate amount/notes as needed)
- [ ] Parent: Approval Queue
  - List pending redemptions; approve/reject actions with notes
  - Filters by type/status; pagination if needed
- [ ] Dashboard surfacing
  - Show available reward types and quick link to request
  - Show recent redemption history

Deliverable: Accessible, responsive UI tied to live endpoints.

---

### Step 6 — i18n & Content

- [ ] Add strings to `frontend/src/messages/en.json` and `he.json`
- [ ] Copy and tone consistent with kid/parent modes

Deliverable: Localized copy for all new UI.

---

### Step 7 — QA & Testing

- [ ] Backend unit tests: services and guards
- [ ] E2E tests: redemption flows (request → approve/reject)
- [ ] Frontend tests: critical components and hooks
- [ ] Manual QA checklist across roles

Deliverable: Passing test suite; manual QA sign-off.

---

### Step 8 — Rollout & Monitoring

- [ ] Feature flag (optional) to gate new reward types per tenant
- [ ] Migration checklist and rollback plan
- [ ] Basic metrics: number of requests, approval ratio, time to approve

Deliverable: Safe rollout with observability.

---

### Out of Scope (Post-MVP)

- Dynamic rules/seasonal bonuses affecting rewards
- Competitions and celebrations tied to redemptions
- Payment integrations for allowance disbursement

---

### Acceptance Criteria (Phase 1)

- [ ] Children can request non-gaming rewards when enabled for the tenant
- [ ] Parents/Admins can approve/reject with audit trail
- [ ] Gaming time redemption remains as-is; other types record approvals without altering time balance
- [ ] Tenant admins can enable/disable reward types and basic conversion display
- [ ] UI is localized and accessible; errors are clear and actionable


