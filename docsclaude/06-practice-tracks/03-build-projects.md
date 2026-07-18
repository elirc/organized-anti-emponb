# Full-Stack Capstone Extensions: 5 Deep Projects

Building deep features from scratch is the ultimate test of software engineering capability. These five projects use our monorepos as a base, requiring you to write schemas, middleware pipelines, background queues, and responsive client layouts.

---

## Project 1: Dynamic Workflow Template Builder
* **Goal**: Build an interactive designer for custom onboarding checklist templates.
* **Requirements**:
  * **Backend**: Create CRUD endpoints for `WorkflowTemplate` and `TaskTemplate` records. Build transactional endpoints to publish templates and check their structural integrity.
  * **Frontend**: Create a drag-and-drop user interface page allowing managers to add, reorder, delete, and configure task parameters (assignees, descriptions, required documents) in a draft template visual builder workspace.

---

## Project 2: Slack Operations Webhook Dispatcher
* **Goal**: Dispatches real-time operations activity alerts directly to corporate communication channels.
* **Requirements**:
  * **Backend**: Integrate a new webhook notification worker inside BullMQ. When a checklist task transitions to `PENDING_APPROVAL` or a case breaches its timeline, dispatch a beautiful, formatted Slack markdown payload to a registered webhook URL.
  * **Frontend**: Create an integrations page dashboard in the admin panel allowing HR admins to register, toggle, and test webhook URLs.

---

## Project 3: Real-Time SLA Countdown Monitoring Dashboard
* **Goal**: Track task countdowns and trigger push notification alerts.
* **Requirements**:
  * **Backend**: Extend the database schema to support specific task durations (e.g. "Complete within 48 hours"). Build a background scheduler that sweeps active tasks, flags overdue records, and emails alerts.
  * **Frontend**: Build a visual dashboard using countdown rings and progress bars that highlights tasks nearing their SLA limits.

---

## Project 4: Candidate Document Upload and Scanner
* **Goal**: Manage candidate document uploads, OCR checks, and review states.
* **Requirements**:
  * **Backend**: Integrate file upload handlers using Express multer storage. Store files inside a secure assets folder and generate cryptographically signed download URLs.
  * **Frontend**: Build a document upload slide-over panel on the candidate page. Integrate image previews, and add review action controls allowing HR specialists to approve or reject files.

---

## Project 5: Operations CSV Exporter API Pipeline
* **Goal**: Export massive datasets asynchronously without blocking API response times.
* **Requirements**:
  * **Backend**: Build an asynchronous export pipeline. When a user requests a CSV export, immediately return a `202 Accepted` status. Dispatch a BullMQ job that queries all active cases, compiles a CSV dataset, saves the file to local storage, and emails a secure, rolling download link.
  * **Frontend**: Build a reports download dashboard with progress tracking overlays.
