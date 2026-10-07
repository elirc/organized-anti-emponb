# OWASP Secure Coding Checklist

Security is an absolute platform requirement. A single unvalidated input parameter or missing permission check can expose sensitive company data and compromise the server runtime.

This secure coding checklist maps common OWASP vulnerabilities directly to our platform's stack to ensure every PR meets production security standards.

---

## 1. Preventing SQL Injection (SQLi)
* **Vulnerability**: Attackers inject custom SQL fragments into text input fields, tricking the database engine into returning secret records or executing destructive writes.
* **Our Protection**: We systematically interact with our database using **Prisma ORM**. Prisma compiles all queries using strict parameterized statements (prepared statements). Raw query concatenations are explicitly prohibited.
* **File Anchor**: [backend/src/modules/onboardingCases/onboardingCases.service.ts:65-70](backend/src/modules/onboardingCases/onboardingCases.service.ts#L65-L70):
  ```typescript
      return prisma.onboardingCase.findMany({
        where,
        orderBy: { startDate: 'asc' },
  ```
  The variable `where` is parsed by Prisma as parameterized arguments. Even if `where` contains SQL fragment syntax like `' OR 1=1 --`, the SQL engine treats the input strictly as a literal string filter value rather than executable code.

---

## 2. Mitigating Cross-Site Scripting (XSS)
* **Vulnerability**: Attackers inject malicious JavaScript snippets into input fields (such as a candidate's preferred name). When other users view this record, the script executes inside their browser, hijacking active sessions.
* **Our Protection**: React automatically escapes all variables rendered inside JSX brackets `{}` by converting characters (like `<` or `>`) into safe HTML entities before drawing pixels.

---

## 3. Insecure Direct Object Reference (IDOR) — partially open
* **Vulnerability**: An authenticated user modifies a database key (like a case ID UUID) inside a request URL to read or modify a resource belonging to another tenant or department.
* **What protects us today**: action-level RBAC only. `requirePermission` → `requireRole` throws 401/403 before the controller runs ([backend/src/middleware/requirePermission.middleware.ts:35-59](backend/src/middleware/requirePermission.middleware.ts#L35-L59)).
* **What does not exist yet**: automatic row-level department scoping. `OnboardingCaseService.getAll` applies a `departmentId` filter only when the caller supplies one ([backend/src/modules/onboardingCases/onboardingCases.service.ts:44-53](backend/src/modules/onboardingCases/onboardingCases.service.ts#L44-L53)), and by-ID lookups carry no department condition — a user whose role passes the gate can read another department's case by ID. Closing this is Exercise 3 in `03-server-mastery/exercises.md` (`requireDepartmentAccess`); prefer returning 404 over 403 on mismatch so attackers cannot confirm a foreign resource exists.

---

## 4. Preventing Cross-Site Request Forgery (CSRF)
* **Vulnerability**: A malicious third-party site tricks a user's browser into executing unauthorized requests against our API using the user's active cookie credentials.
* **Our Protection**: We utilize short-lived JWT access tokens stored in memory, and set strict security flags on session cookies (`HTTPOnly`, `Secure`, `SameSite=Strict`), preventing foreign origins from accessing or sending tokens.

---

## 5. Security Checklist for Pull Requests (PRs)

Before submitting any code change, verify that your PR complies with this security checklist:

| Verification Target | Check Item | Status |
| :--- | :--- | :--- |
| **Authentication** | Is the route protected by the `authenticate` middleware? | `[ ]` |
| **Authorization** | Does the route require specific permissions via `requirePermission`? | `[ ]` |
| **IDOR Protection** | If querying by ID, does the query restrict results by `departmentId`? | `[ ]` |
| **Data Validation** | Is the request body parsed and sanitized using a Zod schema? | `[ ]` |
| **No Raw SQL** | Are there zero instances of raw string concatenation in SQL queries? | `[ ]` |
| **No Secrets Leaked** | Are there zero API keys, JWT secrets, or database passwords committed? | `[ ]` |

> **Senior aside:** *Never trust client inputs. Always assume every parameter received from the network is malicious and validate it accordingly.*

---

## Pitfall Checklist

1. **Implicit IDOR Openings**: Querying records by ID without validating if the user's department has access.
2. **Role Hardcoding inside Controllers**: Writing custom role checking conditionals instead of using permission middleware.
3. **No Request Payload Limits**: Allowing clients to submit massive bodies, risking memory exhaustion.
4. **JWT Secrets Committed to Git**: Committing production keys and credentials directly to version control.
5. **No Parameter Validation**: Accepting query inputs without Zod schema parsing.
6. **Incorrect CORS Setup**: Configuring permissive wildcards `Access-Control-Allow-Origin: *` while accepting credentials.
7. **Storing JWT in LocalStorage**: Storing credentials in plain client storage, exposing them to XSS attacks.
8. **Missing SQL Injection Tests**: Believing parameterized queries are secure without validating custom raw queries.

---

## Drills

1. **Permissions Audit**: Trace a route file and identify every permission check. Confirm that no route lacks appropriate authorization guards.
2. **Brute Force Defense**: Explain what mechanisms are used to protect the login endpoint from brute-force password scanning attacks.
3. **Cross-Tenant Check**: Write a test integration script that attempts to view a task from another department and confirm the server correctly returns a `404 Not Found`.
