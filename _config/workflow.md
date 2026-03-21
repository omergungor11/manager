# Workflow Rules — Manager

## Task Workflow

### Pre-Task
1. Read `_tasks/task-index.md` for project status
2. Read phase file for task details
3. Check all dependencies are COMPLETED
4. Read task-specific context files
5. Update task status to IN_PROGRESS

### During Task
- Follow acceptance criteria strictly
- Run typecheck + lint after changes
- Keep changes focused on the task scope
- Stok kuralı: para girişi sadece hizmet/satış üzerinden

### Post-Task
1. Verify all acceptance criteria
2. Run validation commands
3. Update `_tasks/task-index.md` (status + dashboard)
4. Update `_docs/CHANGELOG.md`
5. Git commit: `feat(TASK-XXX): title`
6. Check blocked tasks, unblock if ready

## Commit Conventions

```
feat(TASK-XXX): description     # New feature
fix(TASK-XXX): description      # Bug fix
refactor(TASK-XXX): description # Refactoring
docs(TASK-XXX): description     # Documentation
chore(TASK-XXX): description    # Tooling/config
test(TASK-XXX): description     # Tests
```

## Branch Strategy

- `main` - production-ready code
- `develop` - integration branch
- `feat/TASK-XXX-description` - feature branches

## Validation Commands

```bash
pnpm typecheck          # TypeScript check (all packages)
pnpm lint               # Biome lint
pnpm lint:fix           # Biome lint + fix
pnpm format             # Biome format
pnpm test               # Vitest
pnpm build              # Turbo build all
pnpm db:generate        # Prisma generate
pnpm db:migrate         # Prisma migrate dev
pnpm db:seed            # Run seed
```
