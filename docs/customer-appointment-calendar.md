# Customer appointment calendar

The shared CRM page (`/customer-crm.html?portal=lab` or `portal=photographer`) includes a Persian monthly calendar, a desktop day agenda, and a mobile day dialog. Operators can select a registered customer or create one inline, enter the requested service, time in Tehran, duration, notes and optional SMS reminder, and later edit, complete or cancel the appointment. Future bookings are independent of completed services, occasions and invoices.

Migration `200_customer_appointments.sql` adds owner-scoped appointments and a server-only reminder outbox. Appointments use the CRM's existing authenticated owner and RLS settings; customer relationships have composite owner foreign keys. Calendar reads are limited to a maximum 100-day interval. An owner advisory transaction lock serializes conflict checks and writes. Revision checks protect edits from stale devices.

Internal reminders are mandatory. Jobs become due 24 hours before the appointment; appointments created within that window are eligible immediately on the next worker sweep. The server checks pending jobs at startup and every minute. Cancellation and relevant schedule edits invalidate old pending jobs. Note-only changes do not create another paid reminder. Reminders for appointments whose start has passed are suppressed.

An internal job atomically saves a system notification and its delivery state, then uses existing Web Push subscriptions. Device notifications require browser permission and support; the calendar exposes the normal subscription flow and handles foreground notifications. Push links open the relevant calendar date. The in-app record remains available when push is unavailable.

SMS is off by default and is sent to the owner (photographer account or the lab's first active administrator), never to the appointment customer. The form shows the recipient, current price per SMS segment, estimated segment count/cost and wallet balance. Actual charging uses the existing segment-metered SMS provider/wallet/refund implementation and its tariff at send time. Insufficient balance prevents contacting the provider; provider errors use existing refunds. Internal reminders do not depend on SMS availability or balance.

The outbox durably claims SMS before contacting an external provider. A crash after claiming leaves `processing`, shown as under review; failures are recorded without an automatic paid retry. This intentionally avoids duplicate provider calls/charges when delivery is ambiguous. This is not an exactly-once guarantee from the external provider. Investigate the existing SMS delivery log and wallet transaction before any manual retry.

Validation:

- `node --test features/customer-crm/*.test.mjs scripts/test-r1766-crm-unified.cjs`
- `DATABASE_URL=<local PostgreSQL URL> node --test scripts/test-customer-calendar-postgres.mjs` creates and removes an isolated test database; it refuses non-local servers.
- `NODE_PATH=<Playwright modules> PB_BROWSER_EXECUTABLE=<Chromium> node scripts/test-customer-calendar-browser.cjs`
- `npm run build`

Calendar unit checks run in the production build; browser and PostgreSQL checks also run in the release workflow. Development never sends a paid test SMS or changes the production database.
