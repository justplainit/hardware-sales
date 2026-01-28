# HardwareFlow Architecture & Workflow

## Overview

HardwareFlow tracks a single client quote that can span multiple suppliers. Once a client approves, the system auto-splits items into supplier-specific purchase orders and enforces a strict Goods Receipt (GRN) step before technicians can act.

## Core Entities

- **Client**: payment terms and privileged flag.
- **Supplier**: lead days and contacts.
- **Quote**: quote header, totals, and status.
- **QuoteItem**: line item with pricing, supplier, delivery method, technician assignment, and lifecycle status.
- **SupplierOrder**: purchase orders grouped by supplier.
- **Invoice**: internal payment tracking, with privileged terms override.
- **GoodsReceipt**: official acknowledgement of stock arrival (GRN).
- **Dispatch**: items leaving the office.
- **Task**: technician action items created on GRN.
- **Notification**: in-app alerts + email placeholder.

## Numbering

Sequences use prefixes with year and padded counters:

- Quote: `Q-YYYY-0001`
- Supplier Order: `PO-YYYY-0001`
- GRN: `GRN-YYYY-0001`
- Dispatch: `DIS-YYYY-0001`
- Invoice: `INV-YYYY-0001`

## Workflow Triggers

1. **Technician Request**
   - Creates a Draft Quote with initial items.
   - Assigns Sales owner.
   - Sales notified.

2. **Sales Pricing & Supplier**
   - Sales selects supplier and sets pricing per item.
   - Margin warnings fire if margin < threshold.
   - Quote totals recalculated.

3. **Send Quote**
   - Sales sends the quote to a public client link.
   - Client reminders at 24h and 72h.
   - Marked stale after 7 days without response.

4. **Client Approval**
   - Quote -> **APPROVED**
   - SupplierOrders created in a transaction, grouped by supplier.
   - QuoteItems -> **ORDER_PENDING**

5. **Invoice & Payment**
   - Accounts creates invoice.
   - Standard clients must be PAID before orders can be marked ORDERED.
   - Privileged clients may proceed.

6. **Supplier Order Ordered**
   - Sales marks SupplierOrder **ORDERED**.
   - QuoteItems -> **ORDERED**

7. **Goods Receipt (GRN)**
   - Only GRN counts as arrival.
   - QuoteItems -> **RECEIVED_OFFICE** or **DELIVERED_DIRECT**.
   - SupplierOrder -> **PARTIALLY_RECEIVED** or **RECEIVED**
   - Technician tasks created: "Schedule installation/delivery"
   - Notifications: tech(s), sales, optional admin

8. **Dispatch**
   - Items leave office.
   - QuoteItems -> **DISPATCHED**
   - Notifications to tech + sales.

9. **Installation**
   - Tech marks item **INSTALLED** and captures serial/warranty.
   - Quote -> **FULFILLED** when all items installed or cancelled.

## Notifications

- In-app table + SMTP placeholder.
- Triggers: Quote sent/approved/declined/stale, SupplierOrder created/ordered, GRN, Dispatch, ETA overdue.

## Cron Endpoints

- `POST /api/cron/quote-reminders`
  - 24h + 72h client reminders
  - Mark stale after 7 days
- `POST /api/cron/eta-overdue`
  - Alert sales + admin when ETA overdue
