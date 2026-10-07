-- PhotoBridge v904R52 — short numeric invoice numbers for equipment rental.
CREATE SEQUENCE IF NOT EXISTS equipment_rental_invoice_number_seq START WITH 10001;

SELECT setval(
  'equipment_rental_invoice_number_seq',
  GREATEST(
    COALESCE((SELECT max(invoice_number::bigint)
              FROM equipment_rental_invoices
              WHERE invoice_number ~ '^[0-9]+$'), 0),
    10000
  ),
  true
);

WITH legacy AS (
  SELECT id
  FROM equipment_rental_invoices
  WHERE invoice_number !~ '^[0-9]+$'
  ORDER BY issued_at, id
)
UPDATE equipment_rental_invoices i
SET invoice_number = nextval('equipment_rental_invoice_number_seq')::text
FROM legacy l
WHERE i.id = l.id;

SELECT setval(
  'equipment_rental_invoice_number_seq',
  GREATEST(
    COALESCE((SELECT max(invoice_number::bigint)
              FROM equipment_rental_invoices
              WHERE invoice_number ~ '^[0-9]+$'), 0),
    10000
  ),
  true
);
