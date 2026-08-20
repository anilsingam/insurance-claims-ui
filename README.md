# SAKR Insurance Claims Workspace — Next.js Senior UI Engineering Demo

A runnable reference implementation for the Senior UI Engineering use case discussed in the prompt.

## What is included

- Next.js App Router + TypeScript
- Server-side pagination, filtering and sorting for a simulated 20,000+ claim dataset
- TanStack Virtual for rendering only visible grid rows
- TanStack Table for column definitions and sorting state
- TanStack Query for server-state fetching/caching
- Zustand for lightweight UI state
- Mock RBAC with backend authorization checks in Next.js route handlers
- Claim → document workspace transition
- Simulated 1 GB document metadata and page-level lazy loading
- Document annotations/comments
- Split / merge / delete operation simulation with asynchronous progress
- Loading, error, retry and cancel states
- Production architecture notes for object storage, range requests, workers and real identity

## Run in VS Code

### 1. Prerequisites

- Node.js 20+ (Node 22 recommended)
- npm 10+

### 2. Open the folder

Open this folder in VS Code:

`insurance-claims-ui`

### 3. Install dependencies

```bash
npm install
```

### 4. Start development server

```bash
npm run dev
```

Open http://localhost:3000

## Demo roles

Use the role selector in the header:

- Claims Agent — read/edit/assign, no delete or document merge
- Claims Supervisor — read/edit/assign/delete + split/merge/comment
- Claims Auditor — read-only

The UI hides/disable actions for UX, but the API route handlers also enforce the permission. In production the role/permissions must come from the authenticated identity/token and never from a client-controlled selector.

## Important production note about 1–1.5 GB documents

This demo intentionally does NOT ship a 1 GB file. A browser demo containing a 1 GB PDF would be wasteful and would not demonstrate the correct architecture.

The production pattern is:

1. Store the document in S3/Azure Blob/object storage.
2. Store document metadata/version/checksum in a database.
3. Authorize access in the backend.
4. Return a short-lived signed URL or controlled streaming endpoint.
5. Use HTTP Range requests / partial loading so the browser does not buffer the entire file.
6. Render only the pages needed by the user.
7. Perform split/merge/OCR/conversion in asynchronous backend workers.
8. Return an operation ID and expose progress/cancel/retry APIs.

## Suggested production extensions

- Replace mock auth with Azure AD/Entra ID, Okta or another OIDC provider.
- Replace mock claims route with the real Claims API.
- Replace simulated document viewer with PDF.js or a commercial PDF SDK when true PDF editing/split/merge is required.
- Add S3/Azure Blob multipart upload and HTTP Range support.
- Add a message broker (Kafka/SQS/Azure Service Bus) and worker service for document operations.
- Add OpenTelemetry/Application Insights/Datadog.
- Add Playwright E2E tests and Vitest unit tests.

## Architecture

```text
Browser / Next.js
       |
       v
 API Gateway / BFF
       |
 +-----+-----------+----------------+
 |                 |                |
 v                 v                v
Claims API     Document API     Identity/RBAC
 |                 |
 v                 +------> Object Storage
SQL/Search                |
                          +------> Worker Queue
                                      |
                                      v
                                Document Workers
```
