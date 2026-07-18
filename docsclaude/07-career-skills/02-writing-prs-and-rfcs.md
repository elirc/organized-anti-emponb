# System Change Pitches: Writing PRs and RFCs

Before making major architectural revisions (such as changing database engines or introducing caching layers), you must gain alignment across the engineering team. We achieve this by writing a **Request for Comments (RFC)** document.

---

## The Request for Comments (RFC) Blueprint

This standard template must be used to draft and pitch all major platform structural updates:

```markdown
# RFC [ID]: [Title of the Architecture Pitch]

## 1. Executive Summary
Provide a brief, non-technical summary of the proposed change, the business value, and the engineering cost.

## 2. Technical Context & Problem Statement
Detail the current state limitations. Why is the current code fragile, slow, or hard to scale? Cite active files and lines.

## 3. Proposed Solution
Map out the proposed architecture. Use Mermaid diagrams to explain request paths, data flows, and structural layers.

### Schema Mutations
```prisma
// List the prisma schema modifications
```

## 4. Alternative Approaches Considered
Why did you reject other options? Compare at least two alternatives (such as using memory caches vs. direct SQL queries).

## 5. Security & Migration Impacts
- How does this change affect compliance auditing (SOC2)?
- Outline the database migration plan. Can this migration be applied with zero downtime?
```

> **Senior aside:** *Writing an RFC forces you to think through edge cases, design trade-offs, and security implications before you write a single line of production code. It builds consensus and protects the team from costly architectural mistakes.*
