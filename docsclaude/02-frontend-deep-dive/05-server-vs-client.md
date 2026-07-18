# Tokens, Interceptors, and Sessions: Client-Server Boundaries

An application's stability depends heavily on how it manages the boundary between client runtime environments and backend API services. 

A junior engineer who does not understand rolling authorization refresh lifecycles or handles network errors lazily will leave users stranded with stale interfaces and disconnected sessions.

---

## The Monorepo Network Boundary

All data transactions between our frontend React SPA and our backend Express API flow through a configured **Axios Instance Wrapper**. This wrapper interceptor automatically injects credentials, validates tokens, and handles session refreshing transparently.

Let's inspect the Axios API client configuration:
[frontend/src/utils/api.ts:24-33](frontend/src/utils/api.ts#L24-L33):

```typescript
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
```

---

## Rolling JWT Token Refreshes

Because short-lived JWT access tokens expire frequently for security compliance, we must support transparent token refreshes. 

If the client attempts to perform an API call with an expired token, the server returns a `401 Unauthorized` response. Instead of instantly routing the user to the login screen, our interceptor intercepts the failure, requests a new access token, and retries the original request.

Inspect this implementation:
[frontend/src/utils/api.ts:40-49](frontend/src/utils/api.ts#L40-L49):

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const res = await api.post('/auth/refresh');
```

### The Sequence of Events:
1. **API Call Fails**: A request fails with a `401` status.
2. **Re-try Flag**: We set `_retry = true` to prevent infinite validation loops if the refresh call itself fails.
3. **Token Rotation request**: We call `/auth/refresh` using cookie credentials.
4. **Token Cache Sync**: On success, we save the new token, update our Zustand store, update the headers, and execute the original request.
5. **Session Teardown on Failure**: If the refresh request itself fails (e.g. the refresh cookie expired), we clear state stores and redirect the user.

> **Senior aside:** *Always use HTTPOnly cookies for refresh tokens. Storing refresh credentials in localStorage exposes the application to severe Cross-Site Scripting (XSS) session hijacking attacks.*

---

## Pitfall Checklist

1. **Storing Sensitive Credentials in LocalStorage**: Storing credentials in plain client storage, exposing them to XSS attacks.
2. **Infinite 401 Retry Loops**: Failing to set retry flags (`_retry = true`) in interceptors, locking the app when refreshing fails.
3. **Double Refresh Requests**: Enqueuing multiple parallel refresh requests when several network calls expire at the exact same second.
4. **Incorrect CORS Headers**: Failing to set `withCredentials: true` in requests, preventing cookies from transmitting across browser boundaries.
5. **No Network Error Interception**: Displaying black screens or crashing on 503 gateway timeouts instead of showing friendly error pages.
6. **Token Leakage to External APIs**: Attaching Authorization headers to external API queries instead of limiting them to local paths.
7. **Stale Store Cache on Logout**: Clearing cookie tokens on logout but leaving cached data stores fully populated.
8. **Ignoring Request Cancellations**: Failing to abort active fetch operations when components unmount, leading to memory leaks.

---

## Drills

1. **Interceptor Audit**: Trace [frontend/src/utils/api.ts](frontend/src/utils/api.ts) and write down the sequence of calls that occur when a request fails with a `403 Forbidden` status.
2. **Double-Call Protection**: Explain what would happen if a dashboard triggers 5 API requests simultaneously and the access token has expired. Write a proposed solution to queue concurrent refresh calls.
3. **Logout State Check**: Inspect [frontend/src/stores/authStore.ts:51-56](frontend/src/stores/authStore.ts#L51-L56) and verify that all memory caches are cleared during logout calls.
