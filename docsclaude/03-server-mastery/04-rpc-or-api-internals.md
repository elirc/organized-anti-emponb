# Serialization, Statuses, and Protocols: API Internals

API layers are the interfaces through which clients communicate with server systems. A junior engineer who builds APIs without strict HTTP status rules, unified error mapping schemas, or contract synchronization will create highly volatile boundaries that fail to translate exceptions correctly.

---

## REST Status Semantics and API Design

We structure our APIs around standard **Representational State Transfer (REST)** guidelines using unified JSON payload structures and appropriate HTTP semantic status codes:
* **`200 OK`**: Successful read or non-creation mutations.
* **`201 Created`**: Successful write resulting in new database records.
* **`400 Bad Request`**: Client-side validation failure (e.g. malformed inputs).
* **`401 Unauthorized`**: Missing or expired session tokens.
* **`403 Forbidden`**: Valid authentication, but missing permissions for the requested resource.
* **`404 Not Found`**: Resource does not exist in the database.
* **`500 Internal Server Error`**: Unexpected backend runtime crashes.

---

## Centralized Exception Translation

Instead of scattering hardcoded status codes or generic catch statements throughout our code, we enforce API consistency using our custom `AppError` boundary.

Inspect this pattern:
[backend/src/shared/errors/AppError.ts:1-9](backend/src/shared/errors/AppError.ts#L1-L9):

```typescript
export class AppError extends Error {
  public readonly errorCode: string;
  public readonly statusCode: number;
  public readonly errors: any[] | undefined;

  constructor(errorCode: string, statusCode: number, message: string, errors?: any[]) {
    super(message);
    this.errorCode = errorCode;
    this.statusCode = statusCode;
```

### Why We Standardize Exceptions:
1. **Unified Payload Contract**: If a controller action encounters a problem (e.g., trying to start a case that is already running), it throws an `AppError` with a structured `ErrorCodes` identifier and status:
   [backend/src/modules/onboardingCases/onboardingCases.service.ts:257-259](backend/src/modules/onboardingCases/onboardingCases.service.ts#L257-L259):
   ```typescript
      if (onboardingCase.status !== 'NOT_STARTED') {
        throw new AppError(ErrorCodes.CASE_CANNOT_BE_STARTED, 400, 'Onboarding case must be in NOT_STARTED state');
      }
   ```
2. **Graceful Translation**: The global Express error handler captures this `AppError` instance and translates it into a standard JSON payload. The client receives a predictable error format, making it trivial to display field-specific validation warnings in the UI.

> **Senior aside:** *Never bypass standard HTTP status codes by returning custom success/failure flags in `200 OK` responses. Violating HTTP specifications breaks network caching controls and routing proxies.*

---

## Pitfall Checklist

1. **Abusing `200 OK` for Failures**: Returning error messages inside a successful `200 OK` response payload.
2. **Scattering Raw HTTP Status Codes**: Hardcoding numeric status codes (like `403`) in service layers instead of mapping them to structured custom error classes.
3. **No Catch-All for Unhandled Rejections**: Failing to catch native promise errors, causing the API to hang and client requests to timeout.
4. **Mismatched Content-Type Headers**: Failing to set correct content headers when returning text, JSON, or binary file data.
5. **Contract Divergence**: Modifying API response objects without synchronizing corresponding TypeScript interfaces on the client.
6. **No API Versioning Path**: Building endpoints directly on root paths without version namespaces (e.g. `/api/v1`), complicating future refactoring.
7. **Bypassing Payload Sanitization**: Returning complete, raw database entities containing sensitive fields (like password hashes).
8. **Ignoring Request Rate Limits**: Failing to rate-limit public endpoints, exposing the server to denial-of-service (DoS) exploits.

---

## Drills

1. **Error Code Verification**: Open [backend/src/shared/errors/errorCodes.ts](backend/src/shared/errors/errorCodes.ts). Write a new error code `TEMPLATE_INACTIVE` and verify it can be thrown cleanly inside a test script.
2. **API Contract Audit**: Review a controller's return statements. Confirm that all returned payloads map structurally to the TypeScript interfaces used by the frontend Axios client.
3. **HTTP Verb Selection**: Search the web for REST API design guidelines. Explain why using a `PATCH` method is preferred over a `PUT` method when updating individual properties of a task.
