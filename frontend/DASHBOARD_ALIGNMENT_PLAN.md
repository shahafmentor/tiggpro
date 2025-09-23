## Dashboard Alignment Plan (Frontend)

Scope: Align style/design and theme usage across dashboard pages and left-nav destinations. Track progress honestly per IMPLEMENTATION_GUIDELINES.

### Checklist

- [x] Draft alignment plan and tasks in this document
- [x] Create shared `PageHeader` component
- [x] Create shared `EmptyState` component
- [x] Create shared `RoleBadge` for tenant roles
- [x] Update Review page to use `PageHeader` and semantic badges
- [x] Normalize duplicate page padding on Chores/Family/Achievements
- [x] Adopt `EmptyState` for empty lists (Review/Chores/Family)
- [x] Replace hard-coded role/pending colors with theme tokens
- [x] Verify i18n hooks and titles/subtitles consistency
- [x] Replace hard-coded strings with translation keys
- [ ] Smoke test pages render with consistent spacing and colors

### Component Extraction (Feature-scoped)

- [x] Extract `SubmissionCard` (components/review) and integrate in Review page
- [x] Extract `ChoreCard` (components/chores) and integrate in Chores page
- [x] Extract `TenantListItem` and `MemberRow` (components/tenant) and integrate in Family page

### Implementation Notes

- Use layout-provided padding (`DashboardLayout`), avoid extra `p-6` on page roots.
- Prefer existing semantic badges (`StatusBadge`, `CountBadge`, `PointsBadge`, `DueDateBadge`); add minimal shims only when needed.
- Keep components small and presentational; pages own data fetching and actions.

### Evidence & Progress

- Plan created; implementation steps will be checked off only after code exists and builds without lint errors.


