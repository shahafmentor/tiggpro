## Points-Only Rewards Migration Plan

Goal: Align rewards with the conversion logic so chores award points only, and children redeem rewards using accumulated points (tenant-configurable conversions).

Owner: Engineering
Status: In progress
Last updated: 2025-09-24

---

### Checklist Overview

- [x] Create migration plan (this document)
- [x] DB migration: add points balance columns to `user_points`
- [x] Backend: update award flow to add points only (no direct minutes)
- [x] Backend: introduce points cost calculation on reward approval
- [x] Backend: extend `RewardSettings` with conversion config
- [x] Frontend: update chore review UI to show points-only preview
- [x] Frontend: show points balance and cost previews in rewards UI
- [ ] QA: E2E validation and backfill verification

---

### A. Database Changes

Scope: Support spendable points separate from lifetime totals.

- [x] Add `available_points` and `spent_points` to `user_points`
  - Type: `integer NOT NULL DEFAULT 0`
  - Backfill: `available_points = total_points` for existing rows; `spent_points = 0`
- [ ] (Optional) Deprecate/remove `gaming_time_minutes` from `chores`
  - Can be removed later; stop using it in the service/UI first

Rollback: Drop the two columns; no data loss for `total_points`.

---

### B. Backend Services

- [x] PointsService (award flow)
  - Add: `available_points += pointsAwarded`
  - Keep: `total_points += pointsAwarded`
  - Remove: Do not add gaming minutes here

- [x] RewardsService (approval flow)
  - Compute points cost from `RewardSettings.conversion`
  - Enforce sufficient `available_points`
  - Deduct: `available_points -= cost`, `spent_points += cost`
  - For `GAMING_TIME`, if desired, also add to `availableGamingMinutes` (derived from redemption, not chores)

---

### C. Reward Settings (Tenant)

- [x] Extend `RewardSettings` schema with `conversion` JSON:
  - `pointsPerMinute`: number (gaming time)
  - `fixedCosts`: optional per-type fixed costs
  - `spendingMoney`: optional `{ perUnit: number }` (points per currency unit)

- [x] Validation and DTOs
  - Update GET/PUT settings endpoints

---

### D. API Updates

- [x] Submission review: ignore `gamingTimeAwarded`; award points only
- [x] Rewards approve: compute and charge point costs; reject on insufficient balance
- [ ] (Optional) Add preview endpoint to return calculated cost for a prospective redemption

---

### E. Frontend Updates

- [ ] Chores review modal: remove gaming minutes preview; show points-only
- [ ] Dashboard: display points balance (total and available)
- [ ] Request Reward modal: show point cost preview for selected type/amount
- [ ] Rewards review modal: show "Cost: X points" and resulting balance
- [ ] Settings card: inputs for conversions (pointsPerMinute, fixed costs, per-unit)

---

### F. Data Backfill & Rollout

- [x] Backfill `available_points = total_points`, `spent_points = 0`
- [ ] Feature flag (optional): gate redemptions using old vs new method per tenant
- [ ] Graceful handling for tenants without conversion configured (fallbacks / disabled UI)

---

### G. QA Plan

- [ ] Approve chore submission → `total_points` and `available_points` increase; no gaming minutes created
- [ ] Request redemption (all types) with cost preview; approve → points deducted
- [ ] Insufficient points: request approval should be blocked with clear error
- [ ] Conversion changes update cost preview immediately
- [ ] Backward compatibility: existing users see correct balances

---

### H. Tasks & Progress (Detailed)

1) DB Migration
- [x] Add `available_points`, `spent_points` columns
- [x] Backfill totals into `available_points`
- [ ] (Optional) Deprecate/remove `chores.gaming_time_minutes`

2) Backend Logic
- [x] Update PointsService to award points-only
- [x] Add conversion-based cost calculation in RewardsService
- [x] Guard approvals with balance checks & clear errors

3) Settings & DTOs
- [x] Extend `RewardSettings` entity and DTOs with `conversion`
- [x] Update validations & Swagger

4) Frontend Changes
- [x] Chore review: points-only preview
- [x] Rewards UI: balance & cost previews
- [ ] Settings UI: conversion inputs with validation

5) QA & Rollout
- [ ] Manual flows + automated tests where applicable
- [ ] Merge & deploy with migration order

---

### Notes

- Lifetime `total_points` is preserved for levels/achievements; only `available_points` is spendable.
- Minutes, if used, should be created by redemptions (not chores) per conversion settings.


