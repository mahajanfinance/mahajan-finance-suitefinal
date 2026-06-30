# Plan: Separate Customer/Partner Logins + Full Accounting Suite for Cash Flow

## 1. Separate Customer & Partner Logins

**Auth page redesign (`/auth`)**
- Top tab switcher: **Customer** | **Partner** (two distinct flows, different colors/icons)
- Each tab has its own Login + Register sub-tabs
- Registration writes `user_type` ("customer" | "partner") into user metadata AND a new `profiles` table (via trigger)
- Login validates the selected role matches the stored role (prevents a customer logging in via the Partner tab)

**Database**
- `profiles` table: `user_id`, `full_name`, `mobile`, `city`, `user_type`, `created_at`, `updated_at` (auto-created via `handle_new_user` trigger from `auth.users` metadata)
- `user_roles` table + `app_role` enum (`customer`, `partner`, `admin`) + `has_role()` security definer function (per security best practice — never store role on profiles for auth decisions)

**Routing & Dashboard**
- `/dashboard` auto-detects role and renders one of:
  - **CustomerDashboard** — my loan applications, my insurance enquiries, EMI calculator history, cash-flow shortcut, downloadable PDFs, profile settings
  - **PartnerDashboard** — leads received, commission tracker (mock list), referral link, partner KYC status, payout history (mock), training resources, marketing kit downloads
- Header "Login/Dashboard" pill stays the same; after login it routes to the role-appropriate dashboard

## 2. Cash Flow Manager → Full Accounting Software

Replace current simple income/expense tracker with a proper double-entry-style small-business accounting app.

**New tables (all RLS-scoped to `auth.uid()`):**
- `acc_accounts` — chart of accounts (name, type: asset/liability/equity/income/expense, opening_balance)
- `acc_parties` — customers & vendors (name, type, gstin, phone, email, address, opening_balance)
- `acc_items` — products/services (name, sku, hsn, unit, sale_price, purchase_price, gst_rate, stock_qty)
- `acc_invoices` — sales invoices (party_id, invoice_no, date, due_date, status, subtotal, tax, total, notes)
- `acc_invoice_items` — line items
- `acc_bills` — purchase bills (mirror of invoices for vendors)
- `acc_bill_items` — line items
- `acc_payments` — received/paid (party_id, ref_invoice/bill, mode: cash/bank/upi, amount, date)
- `acc_expenses` — quick expenses (account_id, party_id?, amount, date, category, gst, notes, receipt_url)
- `acc_journal` — manual journal entries (date, narration, lines: account_id, debit, credit)
- Existing `tracker_subscriptions` stays as the gate

**Cash Flow page (`/tracker`) — tabbed layout:**
1. **Dashboard** — KPIs (income MTD, expense MTD, profit, cash in hand, receivables, payables), 12-month bar chart, top customers/vendors, overdue invoices
2. **Sales** — invoice list, create invoice (line items, GST, discount), record payment, PDF download, share via WhatsApp/email, mark paid/cancelled
3. **Purchases** — bills, vendor payments
4. **Parties** — customer & vendor master with statements
5. **Items** — product/service master, stock view
6. **Expenses** — quick expense entry with categories + receipt upload to storage
7. **Banking** — accounts, transfers, reconciliation list, bank statement import (reuse existing `parse-bank-statement` edge function)
8. **Reports** — P&L, Balance Sheet, Trial Balance, GST summary (GSTR-1/3B style), Day Book, Customer/Vendor ledger, daily/weekly/monthly/yearly cash flow — all exportable to PDF & Excel
9. **Settings** — business profile (name, GSTIN, logo, address — used on invoice PDF), invoice numbering, tax rates

**Subscription gate (already 15-day trial → ₹499/mo)**
- Keep existing `TrackerSubscriptionGate` logic
- Add a richer "Why upgrade?" panel listing all accounting features (see below) above the paywall
- Add a persistent feature/benefits drawer on the Cash Flow page (accessible via "ℹ️ About Cash Flow Pro" button) detailing:
  - 15-day free trial, no card required
  - ₹499/month — cancel anytime
  - Unlimited invoices, bills, parties, items
  - GST-ready invoices with HSN/SAC
  - Auto P&L, Balance Sheet, GSTR-1/3B reports
  - Bank statement import & reconciliation
  - WhatsApp/email invoice sharing
  - Receipt photo storage
  - Multi-user (future)
  - Secure PIN vault
  - Daily backup
  - Export to PDF/Excel
  - Indian compliance (GST, TDS-ready)

**Login requirement**
- `/tracker` already requires login; we'll make the "not logged in" state show the full benefits + "Login as Customer" / "Register" CTAs (not a blank redirect)

## Technical Notes

- New components under `src/components/accounting/` (one per tab), kept small
- Reuse `jspdf` (already in deps for `emiPdf.ts`) for invoice + report PDFs; add `xlsx` for Excel export
- Storage bucket `receipts` (private, user-scoped) for expense receipts and business logo
- All money in paise (integer) to avoid float bugs; display formatted as ₹
- Charts via `recharts` (already in shadcn deps)
- Migration runs in one batch with all tables, GRANTs, RLS, triggers, `has_role()` function
- `useAutoLogout` 15-min idle timer already handles security

## Out of scope (will note for later)
- E-invoice IRN generation (requires GSP API)
- Multi-user / team accounts
- Bank API auto-sync (manual import only)
- Payroll module
