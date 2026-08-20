# Senior UI Engineering Architecture — SAKR Insurance Claims

## 1. Goals

The application must:

- handle 20,000+ claims without creating 20,000 DOM rows;
- support server-side search/filter/sort/pagination;
- provide RBAC-controlled UI actions with backend authorization as the source of truth;
- transition from the grid to a document workspace without a blank-page experience;
- handle documents around 1–1.5 GB without loading the whole binary into browser memory;
- support page navigation, comments and annotations in the UI;
- run split/merge/delete as long-running, recoverable operations;
- preserve consistent document state and provide auditability.

## 2. Frontend architecture

```text
Next.js App Router
  |
  +-- App Shell
  +-- Claims Dashboard
  |     +-- Filters
  |     +-- Claims Grid
  |     |     +-- TanStack Table column model
  |     |     +-- TanStack Virtual row virtualization
  |     +-- Claim Editor
  |
  +-- Document Workspace
        +-- Page thumbnails
        +-- Viewer
        +-- Annotation layer
        +-- Comment panel
        +-- Operation progress
```

### State ownership

```text
Server state -> TanStack Query
UI state     -> Zustand/local component state
Form state   -> local state or React Hook Form in a larger implementation
```

Do not copy the full API response into a global Redux/Zustand store.

## 3. 20k+ grid strategy

The browser requests a small page, for example:

```http
GET /api/claims
x-page: 1
x-page-size: 50
x-search: john
x-status: OPEN
x-sort: createdDate
x-direction: desc
```

The API performs filtering/sorting before pagination. The browser receives 50 records and TanStack Virtual renders only the visible rows plus a small overscan buffer.

### Why not send all 20k rows?

- higher memory footprint;
- more React work;
- more DOM nodes;
- slower initial render;
- expensive filtering/sorting in the browser;
- poor behavior on corporate/low-powered devices.

## 4. Pagination vs infinite scroll vs virtualization

Recommended: **server-side pagination + row virtualization**.

- Pagination limits data transferred to the browser.
- Virtualization limits DOM nodes.
- Infinite scroll is useful for exploration, but claims operations often need predictable page navigation and bookmarkable URLs.

Virtualization and pagination solve different problems, so they can be used together.

## 5. RBAC

Frontend permission checks are for UX:

```ts
if (can('CLAIM_DELETE')) {
  // show delete action
}
```

Backend checks are the security boundary:

```text
DELETE /claims/123
      |
      +-- authenticated identity
      +-- role/permissions
      +-- resource-level policy
      +-- execute or 403
```

In production, use OIDC/OAuth2 with Entra ID/Azure AD, Okta, Auth0 or the enterprise identity platform. Never trust a role selector sent by the browser.

## 6. 1–1.5 GB document strategy

Do not do:

```ts
const blob = await fetch('/document/123').then(r => r.blob());
```

for a 1 GB document.

Recommended flow:

```text
Browser
   |
   | request access
   v
Document API
   |
   | authenticate + authorize
   v
short-lived signed URL
   |
   v
S3 / Azure Blob
   |
   | HTTP Range / partial requests
   v
PDF viewer
```

Only the bytes/pages needed by the user should be transferred/rendered.

### Object storage metadata

Database:

```text
DocumentId
ClaimId
StorageKey
Version
Size
MimeType
Checksum
Status
CreatedBy
CreatedAt
```

Object storage:

```text
claims/{claimId}/{documentId}/v3/source.pdf
```

## 7. PDF viewer choice

Use PDF.js when requirements are mainly viewing/rendering/text selection/basic overlays.

Evaluate a commercial PDF SDK when the business truly needs production-grade split, merge, redaction, forms, signatures and advanced annotations. Examples include Nutrient/PSPDFKit, Apryse and Adobe PDF services.

## 8. Split / merge / OCR / conversion

Heavy document work belongs in asynchronous workers:

```text
POST /documents/123/split
       |
       v
202 Accepted
operationId = OP-123
       |
       v
Queue
       |
       v
Document Worker
       |
       +-- download/stream source
       +-- process
       +-- validate
       +-- write new object
       +-- checksum
       +-- commit metadata/version
       |
       v
COMPLETED / FAILED / CANCELLED
```

The UI polls a status endpoint or subscribes to WebSocket/SSE events.

## 9. Consistency

Use a document/operation state machine:

```text
PENDING
  |
PROCESSING
  |
VALIDATING
  |
COMMITTING
  |
COMPLETED
```

Failure:

```text
PROCESSING -> FAILED
```

Cancellation should be safe and should leave the original document unchanged until the new version is validated and committed.

## 10. Optimistic vs pessimistic updates

Good candidates for optimistic UI:

- opening/closing panels;
- local selection;
- some lightweight comments after validation.

Prefer pessimistic/server-confirmed behavior for:

- delete;
- split;
- merge;
- document version changes;
- permission-sensitive mutations.

## 11. Performance checklist

- server-side search/filter/sort;
- 25–100 rows per API request depending on UX;
- row virtualization;
- stable React keys;
- memoize expensive row components where profiling proves it helps;
- debounce search;
- abort stale requests;
- TanStack Query cache/stale times;
- keep UI state local;
- Web Workers for CPU-heavy browser work;
- never duplicate 1 GB buffers unnecessarily;
- range-based document retrieval;
- CDN for static assets;
- object storage for large binaries;
- background workers for expensive document operations.

## 12. Production backend assumption

The demo uses Next.js Route Handlers as a mock API. In a real enterprise architecture, Next.js should not become the 1 GB document-processing server.

A typical deployment is:

```text
CDN/WAF
   |
   v
Next.js UI / BFF
   |
   +--> Claims API --> SQL/Search
   |
   +--> Document API --> Object Storage
   |                     |
   |                     +--> signed URL / Range
   |
   +--> Identity
   |
   +--> Operation API --> Message Broker --> Workers
```

## 13. Observability

Track:

- API latency;
- grid query latency;
- document first-page latency;
- range-request failures;
- operation duration;
- split/merge failure rate;
- browser long tasks;
- JavaScript errors;
- memory pressure where available;
- authorization failures;
- audit events.

Use OpenTelemetry plus the enterprise monitoring platform.
