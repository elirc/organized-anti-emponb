# Inputs, Constraints, and Handlers: Controlled vs. Uncontrolled Forms

Form handling is a core interaction surface of internal business operations tools. A junior engineer who implements forms without structured input validations, dirty tracking, or asynchronous state locking will introduce interface lag and allow malformed payloads to escape to the API.

---

## Controlled vs. Uncontrolled Inputs

* **Controlled Inputs**: React controls the input value via component state (`value` + `onChange`). The component re-renders on every single keystroke.
* **Uncontrolled Inputs**: The browser maintains the input value internally. You extract the value using DOM references (`useRef`) or native FormEvents only when the form is submitted.

Let's inspect our login form controlled configuration:
[frontend/src/pages/Login.tsx:42-45](frontend/src/pages/Login.tsx#L42-L45):

```typescript
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
```

### Why We Leverage Controlled Inputs in Forms:
1. **Interactive Feedback**: Enables real-time input masking, dynamic autocomplete lookup lists, and character countdowns.
2. **Synchronous Validation**: You can evaluate field constraints (like confirming password strength) instantly as the user types, updating validation states before submission.
3. **State Locking**: Makes it trivial to disable submission buttons when the inputs are blank or during active API request phases.

---

## Integrating Client and Server Schema Contracts

To prevent invalid payloads, we duplicate validation boundaries. The client validates data using schemas to provide instant user feedback, while the server re-validates the payload against database schemas to protect persistence interfaces.

Here is illustrative code showing how React Form components integrate with Zod schemas:

```tsx
// Illustrative — not from the repo
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createOnboardingCaseSchema } from './schemas';

function CaseCreationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createOnboardingCaseSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("startDate")} />
      {errors.startDate && <span>{errors.startDate.message}</span>}
      <button type="submit">Launch Workflow</button>
    </form>
  );
}
```

> **Senior aside:** *Always disable submit inputs while async post transactions are loading. Double-clicking submittal buttons before responses complete enqueues duplicate API requests, spawning duplicate database records.*

---

## Pitfall Checklist

1. **Un-locked Submissions**: Allowing the user to click "Submit" multiple times during active loading phases.
2. **Keystroke Performance Lags**: Heavy computations executed inside controlled components render pipelines, causing input latency.
3. **Mismatched Null Initializers**: Setting controlled input values to `undefined` on load, triggering React "uncontrolled to controlled" component warnings.
4. **Ignoring Network Validation Failures**: Failing to catch and map server-side validation error codes back to their respective form fields.
5. **No Form State Reset**: Leaving input values populated after successful case creation, allowing users to submit duplicates.
6. **Bypassing Browser Built-in Types**: Using generic `<input type="text" />` for numeric or date parameters instead of `<input type="date" />`.
7. **Missing Focus Management**: Failing to return keyboard focus to the invalid field when form submission fails.
8. **Loose Schema Definitions**: Allowing Zod schemas on the frontend to drift from backend validation rules.

---

## Drills

1. **Controlled to Uncontrolled**: Open [frontend/src/pages/Login.tsx:42-53](frontend/src/pages/Login.tsx#L42-L53). Refactor the input controllers to use a native `FormData` submission handler instead of the double `useState` hooks.
2. **Validation Extension**: Modify a form input to require a minimum password length of 8 characters, displaying a custom warning label underneath the input box when breached.
3. **Async Form Interceptor**: Add a mock sleep statement inside a form's submit action. Confirm that the submit button remains disabled for the entire duration of the sleep.
