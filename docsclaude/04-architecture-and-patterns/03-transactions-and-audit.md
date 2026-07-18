# Atomic Writes, Fail-Closed Security, and SOC2 Audits: Transactions

When building enterprise business tools, execution safety is paramount. Performing multi-table updates (such as updating task assignments, altering progress metrics, and writing history records) requires strict transactional boundaries. 

A junior engineer who does not wrap multiple dependent updates in atomic transaction blocks will leave the system in a half-written, corrupt state.

---

## Transactional Integrity and SOC2 Auditing

For enterprise tools, an **Audit Event Ledger** is a SOC2 compliance requirement. It must register who performed an action, what resource was modified, and when it occurred. The audit trail must be tamper-proof and written in the same transaction block as the business database updates.

Inspect this implementation:
[backend/src/modules/onboardingCases/onboardingCases.service.ts:296-303](backend/src/modules/onboardingCases/onboardingCases.service.ts#L296-L303):

```typescript
      // Update case to IN_PROGRESS
      const updatedCase = await tx.onboardingCase.update({
        where: { id: caseId },
        data: {
          status: 'IN_PROGRESS',
          progressPercent: 0,
        }
      });
```

And trace how the user-facing activity log and compliance audit logs are recorded in the exact same transaction:
[backend/src/modules/onboardingCases/onboardingCases.service.ts:306-327](backend/src/modules/onboardingCases/onboardingCases.service.ts#L306-L327):

```typescript
      // Log user-facing activity log
      await tx.onboardingActivity.create({
        data: {
          onboardingCaseId: caseId,
          actorId,
          action: 'ONBOARDING_STARTED',
          entityType: 'OnboardingCase',
          entityId: caseId,
        }
      });

      // Log compliance audit event
      await tx.auditEvent.create({
        data: {
          actorId,
          entityType: 'OnboardingCase',
          entityId: caseId,
          action: 'STARTED_ONBOARDING',
          metadata: JSON.stringify({
            generatedTaskCount: generatedTasks.length,
          }),
        }
      });
```

### Why This Architecture guarantees SOC2 compliance:
1. **Atomic Invariants**: If the database fails to write the `auditEvent` record, the entire transaction (including case status updates and concrete task generations) is rolled back instantly. The action fails completely, and the database remains clean.
2. **Tamper-Proof Verification**: By binding audit writes directly inside the interactive transaction client context `tx`, you guarantee that every state mutation is recorded.

> **Senior aside:** *Always use database transactions to enforce consistency across related records. Never execute external network calls inside a transaction block, as external latency can tie up database connections and crash the pool.*

---

## Pitfall Checklist

1. **Unprotected Related Writes**: Updating several tables without wrapping them inside a database transaction block.
2. **Leaking Non-DB Actions into Transactions**: Placing network API requests, async dispatch dispatches, or file writes inside database transactions.
3. **Mismatched Client Scopes**: Using the main Prisma connection object `prisma` instead of the scoped transaction argument `tx` inside callbacks.
4. **Failing to Catch Transaction Failures**: Expecting database transaction errors to be resolved automatically without checking and mapping them in parent layers.
5. **No Auditing on Deletion Mutations**: Modifying or removing database rows without writing matching audit events.
6. **No Metadata Payload in Auditing**: Writing basic audit entries (like "Task Updated") without recording exactly what changed.
7. **Ignoring SQL Database Lock Limitations**: Running massive transactions that block tables for extended periods in multi-client setups.
8. **Incomplete Rollback Tests**: Believing transactions function correctly without testing rollbacks under failed execution constraints.

---

## Drills

1. **Transaction Mapping Audit**: Open [backend/src/modules/onboardingCases/onboardingCases.service.ts:236-335](backend/src/modules/onboardingCases/onboardingCases.service.ts#L236-L335) and verify that all database calls inside the transaction utilize the `tx` variable.
2. **Audit Event Construction**: Write a service action that updates a user's role and writes a matching role-changed entry to the audit log in a single transaction.
3. **Isolation Level Check**: Research database transaction isolation levels. Explain why the default isolation level protects against dirty reads during onboarding workflows.
