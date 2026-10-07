# RBAC, Token Rotation, and IDOR: Auth and Multi-Tenancy

Authentication verifies *who* a user is; Authorization establishes *what* resources they are allowed to access. A junior engineer who builds enterprise tools without strict Role-Based Access Controls (RBAC), multi-tenant department filters, or token rotations will leave the platform vulnerable to serious data breach exploits.

---

## Role-Based Access Control (RBAC) Architecture

Our platform utilizes an explicit permission-role matrix. Instead of checking a user's role directly inside routers, we check for specific **Permissions** required to execute actions.

Inspect this implementation:
[backend/src/middleware/requirePermission.middleware.ts:35-59](backend/src/middleware/requirePermission.middleware.ts#L35-L59):

```typescript
export const requireRole = (allowedRoles: UserRole[]): RequestHandler => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(ErrorCodes.UNAUTHORIZED, 401, 'Authentication required');
      }
      if (!allowedRoles.includes(req.user.role as UserRole)) {
        throw new AppError(ErrorCodes.FORBIDDEN, 403, 'Access denied: insufficient permissions');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (permission: keyof typeof PermissionMatrix): RequestHandler => {
  const allowedRoles = PermissionMatrix[permission];
  return requireRole(allowedRoles);
};
```

The direction of the lookup is worth pausing on: the matrix maps **permission → allowed roles** (`PermissionMatrix` at [L19-L30](backend/src/middleware/requirePermission.middleware.ts#L19-L30)), and `requirePermission` resolves that list **once, at route-registration time** — note it runs outside the returned handler. Adding a role to a permission is a one-line matrix edit; no route changes.

### Why Permissions-Based RBAC is a Senior Standard:
1. **Decoupled Roles**: The server logic is protected by permission strings (e.g. `VIEW_REPORTS`). If HR Admins and managers both need reports access, you simply add the permission to both roles inside the permission matrix. You do not have to write custom conditional role checks inside controllers.
2. **Dynamic Configuration**: Roles can be added or updated without modifying single-line features across the routing layer.

---

## Preventing Insecure Direct Object Reference (IDOR) Attacks

An **IDOR** exploit occurs when an authenticated user modifies a database key (like a case ID UUID) inside a request URL to read or modify a resource belonging to another tenant or department:

```ts
// Illustrative — not from the repo (Vulnerable to IDOR!)
router.get("/cases/:id", async (req, res) => {
  // FATAL: The user belongs to Finance, but they can view an IT case simply by changing the UUID!
  const onboardingCase = await db.case.findUnique({ where: { id: req.params.id } });
  res.json(onboardingCase);
});
```

To prevent IDOR attacks on our platform, we enforce **Department-Aware Scoping**. When non-admin users (such as department managers) read or update cases, we automatically append their `departmentId` constraint directly to the database query filters:

```typescript
// Illustrative — not from the repo (Secure multi-tenant check)
const onboardingCase = await prisma.onboardingCase.findUnique({
  where: { 
    id: caseId,
    // IDOR Prevented: Restricts queries to the user's registered department!
    departmentId: user.departmentId 
  }
});
```

> **Senior aside:** *Never trust the client payload for identity context. Always resolve parameters like `departmentId` or `userId` directly from verified session tokens generated inside security middleware.*

---

## Pitfall Checklist

1. **Implicit IDOR Openings**: Fetching records by their raw ID UUID without validating if the user's department context has access permissions.
2. **Role Hardcoding inside Controllers**: Writing `if (user.role === 'HR_ADMIN')` inside service files instead of using permission-based middleware check gates.
3. **Sensitive Data Tokens**: Placing sensitive properties (like passwords, keys, or private phones) inside JWT token payloads.
4. **JWT Expiration Oversights**: Setting long expiration windows on access tokens, leaving sessions vulnerable if tokens are leaked.
5. **No Cross-Tenant Security Tests**: Failing to verify that a manager from Department A is blocked from reading checklist tasks of Department B.
6. **Token Verification Skipping**: Forgetting to mount auth middlewares on newly created REST routes.
7. **Ignoring JWT Key Rotations**: Using static, weak secret keys in configuration files instead of cryptographically secure rotated keys.
8. **Refresh Token Replay Vulnerability**: Failing to rotate refresh tokens upon reuse, allowing intercepted cookies to hijack active user sessions.

---

## Drills

1. **RBAC Permission Verification**: Open [backend/src/middleware/requirePermission.middleware.ts:19-30](backend/src/middleware/requirePermission.middleware.ts#L19-L30) and map out which permissions are granted to the `MANAGER` role versus the `IT_ADMIN` role (note: the matrix has no `IT_SPECIALIST`).
2. **IDOR Security Drill**: Write a security check handler that blocks a user from viewing a document metadata file if their department does not match the case's department scope.
3. **Session Expiry Review**: Review [backend/src/shared/utils/jwt.ts](backend/src/shared/utils/jwt.ts). Identify the lifespan of an access token versus a refresh token and explain the security trade-offs of this configuration.
