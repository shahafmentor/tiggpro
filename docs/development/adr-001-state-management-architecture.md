# ADR-001: Multi-layered State Management Architecture

## Status
Accepted

## Context
The Tiggpro frontend application needs to manage various types of state:
- Business logic state (tenant selection, user permissions)
- UI preferences (theme, sidebar state)
- Server data (assignments, chores, users)
- Component-specific state (form inputs, modal visibility)

We had an issue where tenant management was duplicated between React Context and Zustand store, leading to confusion and potential bugs. We needed to establish clear patterns for when to use each state management solution.

## Decision
We will use a multi-layered state management approach with clear separation of concerns:

1. **React Context** - Business logic state that affects data fetching and user permissions
2. **Zustand** - UI preferences and global app state
3. **TanStack Query** - All server data management
4. **useState** - Component-specific local state

Each solution has a specific purpose and should not overlap with others.

## Consequences

### Positive
- **Clear separation of concerns** - Each tool handles what it's best at
- **No state duplication** - Single source of truth for each piece of state
- **Easier onboarding** - Clear patterns for new developers to follow
- **Better performance** - Each tool optimized for its use case
- **Maintainable code** - Easy to understand where state comes from

### Negative
- **Multiple dependencies** - Need to learn multiple state management libraries
- **Initial complexity** - Developers need to understand when to use each approach
- **Bundle size** - Multiple libraries increase bundle size (minimal impact)

### Neutral
- **Migration effort** - Required refactoring existing duplicate state management
- **Documentation overhead** - Need to maintain clear guidelines

## Implementation Notes

### Current Implementation
- **TenantContext** (`useTenant`) - Manages tenant selection with auto-selection logic
- **AppStore** (`useAppStore`) - UI preferences only (theme, sidebar, loading states)
- **TanStack Query** - All API calls with caching and loading states
- **useState** - Form inputs, modal states, component-specific UI

### Migration Completed
- Removed duplicate tenant management from Zustand store
- Updated all components to use consistent patterns
- Added comprehensive documentation with decision tree

### Decision Tree
```
Need to manage state?
│
├─ Is it server data?
│  └─ YES → Use TanStack Query
│
├─ Is it needed by multiple components?
│  ├─ YES → Is it business logic?
│  │  ├─ YES → Use React Context
│  │  └─ NO → Use Zustand
│  │
│  └─ NO → Use useState
```

## Related Documents
- [State Management Guide](./frontend/state-management-guide.md) - Comprehensive implementation guide
- [Frontend Implementation Guide](./frontend/FRONTEND_IMPLEMENTATION_GUIDE.md) - UI patterns and architecture

---

**Date**: 2025-09-20
**Author**: Claude Code Assistant
**Reviewers**: Development Team