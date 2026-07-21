# Billing Generator

Nova Nest's admin "Generate Bill" page (`src/pages/GenerateBillPage.tsx`) generates 3 document types, matching the reference PDFs in `Billing_inspiration/`. All math is plain deterministic TypeScript — no AI in the numeric path.

## Where things live

| Concern | File |
|---|---|
| Data model | `src/types/index.ts` — `BillingDoc` union (`SaleBookingDoc`, `CommissionDoc`, `ServiceDoc`) |
| Calculations | `src/utils/billingCalculations.ts` — pure functions per doc type, plus `formatINR` and `numberToIndianWords` |
| Default field values | `src/utils/billingDefaults.ts` |
| Storage (S3-as-DB) | `src/services/storageService.ts` — `getAllBillingDocs`, `getNextDocNumber`, `createBillingDoc`, `uploadBillingDocPdf` |
| PDF export (multi-page) | `src/utils/pdfExport.ts` — `renderNodeToPdf` |
| Shared design-system components | `src/app/components/billing/*.tsx` (`DocumentPage`, `DocumentHeader`, `CategoryPill`, `SectionHeading`, `LineItemsTable`, `TotalsBlock`, `AmountInWordsBox`, `DocumentFooter`) |
| Templates (the actual invoice bodies) | `src/app/components/billing/templates/*.tsx` |
| Forms + picker | `src/pages/billing/*.tsx` |

## How a document type is wired together

Each doc type needs 5 pieces:
1. A variant in the `BillingDoc` union (`src/types/index.ts`) with its own `docType` string and a `Computed` shape for its calculated totals.
2. A pure calculation function in `billingCalculations.ts` that turns raw inputs into the `Computed` shape.
3. A template component in `templates/` that renders one or more `DocumentPage`s from the shared primitives, wrapped in `data-pdf-page` so `renderNodeToPdf` can turn multi-page documents into a real multi-page PDF.
4. A form in `src/pages/billing/` — `useState` draft + `update()` helper (matches the rest of this app's admin forms), live preview on every keystroke by feeding the draft through the calculation function, required-field validation, and the save flow: `getNextDocNumber(docType)` → wait a tick for the preview to re-render with the real number → `renderNodeToPdf` → `uploadBillingDocPdf` → `createBillingDoc`.
5. A tile in `ServiceTypePicker.tsx` that routes to the form.

Document numbers follow `NN-{PREFIX}-{YEAR}-{SEQUENCE}` (e.g. `NN-SALE-2026-014`), scoped per docType+year by scanning `invoices/documents.json` in S3 — see `getNextDocNumber` in `storageService.ts`. Because the sequence is scoped per type, two different document types generated back-to-back never collide (the bug the old single shared counter had).

## Adding a 5th type (e.g. a future "Custom Quotation")

Copy the Service Invoice as the template to follow (it's the simplest — dynamic line items, optional GST):
1. Add a `CustomQuotationDoc` variant + `CustomQuotationComputed` to `src/types/index.ts`, and add `'custom_quotation'` to `BillingDocType`.
2. Add `calculateCustomQuotation()` to `billingCalculations.ts` and a prefix (e.g. `QUOT`) to `DOC_NUMBER_PREFIX` in `storageService.ts`.
3. Add `CustomQuotationTemplate.tsx` under `templates/`, built from the shared primitives.
4. Add `CustomQuotationForm.tsx` under `src/pages/billing/`, copying `ServiceInvoiceForm.tsx`'s structure.
5. Add a tile to `ServiceTypePicker.tsx` and a case to `GenerateBillPage.tsx`'s render switch.

## Note on the reference PDFs

The sample figures in `Billing_inspiration/1_sale_booking_confirmation.pdf` don't internally sum correctly (its own "Total Government Charges" doesn't equal the sum of its own line items). Those PDFs were used for **visual/layout reference only** — colors, structure, section numbering, table shapes. All arithmetic here follows the formulas in the original feature spec, which is the authoritative source.
