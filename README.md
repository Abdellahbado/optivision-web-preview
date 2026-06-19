# OptiVision

OptiVision is a French-language management application for an optical shop
(`opticien`). It is being built as a lightweight desktop app with a web preview
mode during development.

The goal is to support the daily workflow of a small optical store:
identify the customer, record the prescription, select frames and lenses,
prepare the order, invoice the sale, track payments, monitor stock, and protect
the shop data with backups.

## Current Status

- Platform target: desktop app with Tauri v2.
- Current preview mode: React web app served by Vite.
- Language: French.
- Currency target: DZD.
- Data model: customers, prescriptions, products, orders, invoices, lens lists,
  users, roles, stock movements, suppliers, and breakage records.
- Current runtime storage: browser `localStorage` through a Zustand store for
  demo/testing.
- Desktop persistence prepared: Tauri SQLite database modules exist, but the
  active UI still needs to be fully connected to SQLite before production use.

This means the app is useful for interface validation and workflow testing, but
it should not yet be treated as a production desktop system for real shop data.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tauri v2
- Tailwind CSS
- Zustand
- Tauri SQL plugin with SQLite preparation
- Bun for package scripts

## Implemented Application Areas

### Authentication and Roles

- Login screen.
- Admin and vendeur roles.
- Admin-only access for settings and backup.
- Permission model for sensitive data such as purchase prices, margins,
  reports, backup, and data deletion.

### Dashboard

- Business overview cards.
- Monthly revenue.
- Active orders.
- Ready orders.
- Unpaid invoices.
- Low-stock alerts.
- Recent customers and recent orders.

### Customer Intake

- Guided `Accueil client` workflow.
- Customer search by name, code, or phone.
- Create a new customer from the intake flow.
- Select or create a prescription.
- Prepare an order draft.

### Customers

- Customer list.
- Search and filters.
- Create, edit, and delete customers.
- Duplicate detection in the customer form using phone and name similarity.

### Prescriptions

- Prescription list.
- Create and edit prescriptions by customer.
- OD/OG optical fields: sphere, cylinder, axis, addition.
- Pupillary distance fields.
- Vision type fields.

### Products and Stock

- Product catalog for frames, lenses, contact lenses, accessories, and services.
- Purchase price and selling price support.
- Low-stock thresholds.
- Frame-specific fields.
- Lens-specific fields, including local coating categories such as HC, HMC, BB,
  PEG HC, PEB HC, PEG HMC, PEB HMC, PEG BLEU HMC, and PEG BB.
- Stock movement and breakage data types are defined.

### Orders

- Order list.
- Status workflow:
  `NEW`, `ORD`, `RCV`, `ASM`, `RDY`, `DLV`, `CAN`.
- Customer-linked orders.
- Expected and actual delivery dates.
- Order totals and workshop notes.

### Lens Lists

- A dedicated `Liste verres` area exists for preparing daily lens lists.
- The business requirement is to group lenses by type/coating so supplier calls
  are faster and less error-prone.

### Invoices and Payments

- Invoice list.
- Invoice statuses.
- Payment methods.
- Paid and unpaid amount tracking.
- Invoice line and payment data types are defined.

### Reports

- Revenue, unpaid invoices, stock, and order indicators.
- Admin/vendor permission model supports different report visibility.

### Backup and Settings

- JSON export/import backup screen in preview mode.
- Shop identity settings.
- Language and currency display.

## Market Research Summary

Mature optical systems are usually not generic POS applications. They combine
retail, healthcare-style records, optical measurements, stock, payments, and
supplier/lab workflows in one connected system.

Research sources used for this product direction:

- Ocuco Acuitas 3: presents independent optical software around connected
  workflows, a single patient/business view, stock management, dispensing,
  integrated payments, BI dashboards, equipment links, GDPR/security, and audit
  visibility.
  https://www.ocuco.com/industry-solutions/independents/acuitas-3/
- Ocuco company platform: positions optical software around practice, lab, and
  digital presence, with products for independents, chains, labs, eCommerce,
  and multi-location optical businesses.
  https://www.ocuco.com/
- RevolutionEHR: emphasizes eye-care-specific practice management rather than
  generic medical software, with billing, payments, scheduling/intake, patient
  engagement, reporting, inventory, integrations, and secure backups.
  https://www.revolutionehr.com/features/
- VisionWeb / HELIX: positions online optical ordering as a dedicated workflow
  for eye-care professionals.
  https://www.helixsolution.com/products/visionweb/

The main lesson for OptiVision is that the MVP should stay simple, but the data
model must be strong enough to grow into a real optical workflow: customer
history, prescription history, order tracking, lens ordering, stock accuracy,
payments, reports, backup, and security.

## Required Features for a Real Optical Shop

### Must Have for MVP Production

- SQLite persistence connected to all active UI screens.
- Database migrations and seed/demo-data separation.
- Reliable backup and restore for the SQLite database, not only JSON preview
  export.
- Customer file with full history: prescriptions, orders, invoices, payments,
  notes, and balance.
- Prescription validation for optical ranges and required fields.
- Latest-prescription selection when creating an order.
- Product stock with real stock movements: entry, sale, manual adjustment,
  breakage, cancellation.
- Purchase price visibility restricted to admin users.
- Order workflow from sale to delivery.
- Daily lens order list grouped by type/coating/supplier.
- Invoice numbering, payment tracking, unpaid balance, and printable/exportable
  invoice.
- Basic reports: daily revenue, monthly revenue, unpaid invoices, stock value,
  low stock, breakage/loss, and margin.
- Strong authentication: password hashing, no hardcoded production users.
- Audit trail for sensitive actions: delete, price change, payment change,
  stock adjustment, backup restore.
- Local legal/fiscal configuration for the target country: tax, invoice format,
  numbering rules, required company fields, and reimbursement invoice wording.

### Important Next Features

- Supplier management.
- Purchase orders and supplier receiving.
- Barcode support for frames, accessories, and stock search.
- Customer recall/reminder system for prescription renewal, order ready, unpaid
  balance, and follow-up.
- SMS/WhatsApp-ready contact actions, while keeping messages user-controlled.
- Appointment calendar if the shop also performs exams or scheduled visits.
- Customer profile page with one-screen summary.
- PDF export for invoices, order receipts, prescription cards, and daily lens
  lists.
- Import/export for product catalogs and stock counts.
- Inventory count workflow with discrepancy report.
- Refunds, returns, cancellations, and credit notes.
- Multi-user session handling.
- Configurable permissions by role.
- Automatic backup reminders and backup health status.

### Advanced Features

- Multi-store support.
- Centralized stock across stores.
- eCommerce/catalog sync.
- Optical equipment integrations.
- Supplier/lab order integration.
- Insurance, third-party payer, or reimbursement workflow when required by the
  local market.
- BI dashboards with drill-down reports.
- Data migration tool from spreadsheets or an old system.
- Encrypted local database or encrypted backup files.
- Cloud sync or remote backup, only after the offline desktop version is stable.

## Priority Roadmap

### P0 - Make the App Production-Safe

1. Connect active screens to the SQLite/Tauri data layer.
2. Add database migrations and a clear schema version.
3. Replace demo authentication with secure local users.
4. Add audit logs for payments, stock, deletes, and settings changes.
5. Convert backup/restore from preview JSON to real database backup.
6. Add PDF invoice generation.

### P1 - Complete the Shop Workflow

1. Finish the customer profile screen.
2. Add complete order creation with frame, OD lens, OG lens, options, discount,
   deposit, remaining amount, and delivery date.
3. Deduct stock only through stock movements.
4. Generate the daily lens order list from active orders.
5. Add supplier and receiving workflows.
6. Add unpaid balance and payment history per customer.

### P2 - Improve Optical Accuracy

1. Validate prescription values and lens availability.
2. Warn when a prescription is old.
3. Compare current and previous prescription.
4. Search lenses by sphere, cylinder, coating, index, and stock.
5. Track frame dimensions and lens compatibility where needed.

### P3 - Improve Commercial Operations

1. Add customer reminders and recall lists.
2. Add barcode scanning.
3. Add inventory counts.
4. Add profit and margin reports visible only to admins.
5. Add return/refund/credit-note flows.

### P4 - Scale Later

1. Multi-user permissions beyond admin/vendeur.
2. Multi-store stock.
3. Cloud backup/sync.
4. Supplier/lab API integrations.
5. Online ordering or customer portal.

## Development

Install dependencies:

```bash
bun install
```

Run the web preview:

```bash
bun run dev
```

Build the web app:

```bash
bun run build
```

Run Tauri during desktop development:

```bash
bun run tauri dev
```

## Production Build

Web build output:

```text
dist/
```

Desktop packaging should be done through Tauri once the SQLite persistence,
backup, invoice export, and production authentication are complete.

## Deployment Notes

The repository includes `vercel.json` for SPA deployment to Vercel. This is
useful for demos and client review, but the final product target remains a
desktop application for offline shop use.

Required Vercel settings:

- Build command: `bun run build`
- Output directory: `dist`

## Important Product Notes

- Do not use browser preview storage for real customer data.
- Confirm local legal and fiscal invoice requirements before using invoices in a
  real shop.
- Confirm health-data/privacy obligations for the target deployment country.
- Keep purchase prices, margins, backups, and destructive actions restricted to
  admin users.
- Treat backup/restore as a core feature, not an optional admin tool.
