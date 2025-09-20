# Tiggpro Documentation

This directory contains comprehensive documentation for the Tiggpro project to help developers understand and contribute to the codebase.

## 📚 Documentation Index

### Architecture & Design
- **[State Management Guide](./frontend/state-management-guide.md)** - Comprehensive guide to React Context, Zustand, TanStack Query, and useState usage patterns

### Architecture Decision Records (ADRs)
- **[ADR-001: State Management Architecture](./adr-001-state-management-architecture.md)** - Multi-layered state management decision
- **[ADR Template](./adr-template.md)** - Template for future architecture decisions

### Development Guides
- **[Implementation Plan](./development/IMPLEMENTATION_PLAN.md)** - Overall project roadmap and progress tracking
- **[Implementation Guidelines](./development/IMPLEMENTATION_GUIDELINES.md)** - Development honesty and quality standards

### Frontend Development
- **[Frontend Implementation Guide](./frontend/FRONTEND_IMPLEMENTATION_GUIDE.md)** - UX/UI strategy and development roadmap
- **[React Best Practices](./frontend/REACT_BEST_PRACTICES.md)** - React development patterns and guidelines

## 🚀 Getting Started

For new developers joining the project:

1. **Start with**: [Implementation Plan](./development/IMPLEMENTATION_PLAN.md) - Get overview of project scope
2. **Then read**: [State Management Guide](./frontend/state-management-guide.md) - Understand how data flows
3. **Refer to**: [Frontend Guide](./frontend/FRONTEND_IMPLEMENTATION_GUIDE.md) - Learn UI patterns

## 🔄 Keeping Documentation Updated

### When to Update Documentation

- **Adding new state management patterns** → Update [State Management Guide](./frontend/state-management-guide.md)
- **Completing major features** → Update [Implementation Plan](./development/IMPLEMENTATION_PLAN.md)
- **New UI components or patterns** → Update [Frontend Guide](./frontend/FRONTEND_IMPLEMENTATION_GUIDE.md)
- **Architecture decisions** → Add new guide or update existing ones

### Documentation Standards

- Use clear examples with code snippets
- Include both ✅ DO and ❌ DON'T patterns
- Add decision trees for complex choices
- Keep guides up-to-date with actual code
- Link between related documents

## 📝 Contributing to Documentation

When making significant changes:

1. **Update relevant guides** before or after code changes
2. **Add examples** for new patterns you introduce
3. **Review decision trees** to ensure they still apply
4. **Test code snippets** to ensure they work
5. **Update this README** if adding new documentation

## 🏗️ Project Structure Context

```
tiggpro/
├── docs/                              # 📚 All documentation
│   ├── README.md                      # This file - documentation index
│   ├── adr-001-state-management-architecture.md  # ADR for state management
│   ├── adr-template.md                # Template for future ADRs
│   ├── architecture/                  # Architecture documentation
│   │   └── adrs/                      # Architecture Decision Records
│   ├── development/                   # Development guides and standards
│   │   ├── IMPLEMENTATION_PLAN.md     # Overall project roadmap
│   │   └── IMPLEMENTATION_GUIDELINES.md  # Development standards
│   ├── frontend/                      # Frontend-specific documentation
│   │   ├── FRONTEND_IMPLEMENTATION_GUIDE.md  # UX/UI strategy
│   │   ├── REACT_BEST_PRACTICES.md   # React development patterns
│   │   └── state-management-guide.md  # State management architecture
│   └── api/                           # API documentation (future)
├── frontend/                          # React/Next.js frontend
├── backend/                           # NestJS backend
└── shared/                            # Shared types and utilities
```

## 🎯 Documentation Goals

- **Onboarding**: Help new developers understand the codebase quickly
- **Consistency**: Ensure all developers follow the same patterns
- **Maintenance**: Make it easy to maintain and extend the codebase
- **Quality**: Prevent common mistakes and anti-patterns
- **Knowledge Preservation**: Capture architectural decisions and reasoning

---

*This documentation is a living resource. Keep it updated as the project evolves!*