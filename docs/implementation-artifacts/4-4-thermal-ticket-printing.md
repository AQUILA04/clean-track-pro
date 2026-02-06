# Story 4.4: Thermal Ticket Printing

Status: done

## Story

As an **User_Site** (Reception Operator),
I want the **system to automatically print a client receipt and item stickers upon validation**,
so that **the physical items can be tracked**.

## Acceptance Criteria

### AC1: Automatic Print Trigger
- **Given** A successfully validated Order (Backend returns 201)
- **When** The validation process completes
- **Then** The system automatically initiates a print job WITHOUT user intervention
- **And** This happens immediately after the "Order Created" confirmation

### AC2: Print Proxy Communication
- **Given** The local Print Proxy is running (e.g., at `http://localhost:8090`)
- **When** The Frontend initiates the print job
- **Then** It sends a POST request to the Proxy with the **defined JSON Payload** (see Dev Notes)
- **And** The request handles potential **Mixed Content** warnings (HTTPS App -> HTTP Localhost) correctly
- **And** If the Proxy is unreachable, a specific error Toast is shown: "Printer Error: Check Local Proxy" with a **RETRY** action

### AC3: Ticket Content & Format
- **Given** The print job reaches the proxy
- **When** The proxy processes the data
- **Then** Two types of documents are generated:
  1. **Client Receipt** (1 copy):
     - Header: Agency Name, Date
     - Body: List of items, Prices
     - Center: **Giant QR Code** (Order UUID for quick lookup)
     - Footer: Total Paid/Due, SLA Date
  2. **Item Stickers** (N copies, one per item):
     - Item Label (e.g., "Shirt")
     - Service Type (e.g., "Full Wash")
     - **Item QR Code** (Item UUID)
     - Order ID ref

## Dev Notes

### Architecture & Components

- **Frontend (`PrintingService`)**:
  - Implement a lightweight service to communicate with the local proxy.
  - **Config**: `NEXT_PUBLIC_PRINT_PROXY_URL` (default: `http://localhost:8090`).
  - **Endpoint**: `POST /print-order`.
  - **Error Handling**: MUST show visible feedback on error (Toast). Do NOT fail silently, as physical tracking is critical.

### Technical Requirements

- **Protocol & Security**:
  - **Mixed Content**: Modern browsers may block requests to `http://localhost` from an HTTPS origin.
  - **Solution**:
    1.  Ensure `PrintingService` implementation handles this (e.g., instructing user to allow insecure content for localhost).
    2.  Or investigate if browser allows localhost exceptions (Chrome often does for `127.0.0.1`).
- **Pivot**: If direct HTTP fails, document the limitation.

- **Payload Schema (JSON Contract)**:
  ```typescript
  interface PrintableOrder {
    header: {
      tenantName: string;
      siteName: string;
      date: string; // ISO or Locale String
    };
    client: {
      name: string;
      phone: string;
      qrCodeValue: string; // The UUID
    };
    items: Array<{
      label: string;
      service: string;
      price: number;
      qrCodeValue: string; // Item UUID
    }>;
    totals: {
      totalPrice: number;
      currency: string;
      dueDate: string;
    };
  }
  ```

## Tasks/Subtasks

- [x] **Frontend Implementation**
  - [x] Add `NEXT_PUBLIC_PRINT_PROXY_URL` to `.env.local`
  - [x] Create `frontend/src/types/printing.types.ts` with `PrintableOrder` interface
  - [x] Create `frontend/src/services/printing.service.ts`
    - [x] Implement `printOrder` method (Axios/Fetch)
    - [x] Handle CORS/Mixed Content errors gracefully
  - [x] Integrate into `OrderDraftContext`
    - [x] Call print on success
    - [x] Implement Error Toast with **Retry** button

- [x] **Tooling**
  - [x] Create `scripts/mock-print-proxy.js`: A simple Node.js HTTP server that listens on 8090 and logs the received JSON payload to console. **Crucial for verifying the implementation without hardware.**

- [x] **Verification**
  - [x] Manual Test: Run `node scripts/mock-print-proxy.js`.
  - [x] Trigger validation in UI.
  - [x] Verify Proxy logs correct JSON structure.
  - [x] Verify UI Toast appears on success or failure.

## Dev Agent Record

### Agent Model Used
- **Agent**: sm (Scrum Master)
- **Workflow**: validate-create-story

### File List
- `frontend/src/services/printing.service.ts`
- `frontend/src/types/printing.types.ts`
- `frontend/src/context/order-draft.context.tsx`
- `scripts/mock-print-proxy.js`
- `.env.local`
- `frontend/src/services/__tests__/printing.service.test.ts`
- `frontend/src/context/order-draft.context.test.tsx`
- `frontend/src/components/ui/simple-toast.tsx`

### Completion Notes
- Added specific JSON contract to prevent schema drift.
- Added mock proxy script to enable "dev-story" agent to self-verify.
- Added specific JSON contract to prevent schema drift.
- Added mock proxy script to enable "dev-story" agent to self-verify.
- Addressed Mixed Content security constraint.
- Implemented `PrintingService` with unit tests.
- Enhanced `SimpleToast` to support `action` (Retry button).
- Integrated printing flow into `OrderDraftContext`.
- Used port 8090 for proxy to avoid conflict with Keycloak (8080).
- **Code Review**: Addressed findings including: default currency update (XOF), fixed toast timeout handling for actions, and robust item UUID mapping.
