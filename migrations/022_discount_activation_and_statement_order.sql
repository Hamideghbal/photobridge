-- PhotoBridge v0.17.0 — discount activation boundary + chronological sub-ledger placement

ALTER TABLE lab_customer_finance_settings
  ADD COLUMN IF NOT EXISTS discount_started_at timestamptz;

-- Preserve the beginning of already-existing automatic discount cycles when possible.
-- If a setting was enabled but had never produced an automatic discount, start it from
-- the time the setting itself was last saved so older invoices are not retroactively discounted.
UPDATE lab_customer_finance_settings s
SET discount_started_at = COALESCE(
  (
    SELECT min(x.period_from)
    FROM finance_customer_adjustments x
    WHERE x.lab_id=s.lab_id
      AND x.customer_id=s.customer_id
      AND x.kind='discount'
      AND x.percent IS NOT NULL
      AND x.invoice_count IS NOT NULL
      AND x.invoice_count>0
      AND x.period_from IS NOT NULL
  ),
  s.updated_at,
  now()
)
WHERE s.discount_enabled=true
  AND s.discount_started_at IS NULL;

UPDATE lab_customer_finance_settings
SET discount_started_at=NULL
WHERE discount_enabled=false;

-- Automatic discount documents belong immediately after the last invoice in their batch.
-- Older versions recorded them at the time the reconciliation job happened, which pushed
-- them to the end of the customer's statement.
UPDATE finance_transactions t
SET txn_date=x.period_to
FROM finance_customer_adjustments x
WHERE t.reference_type='customer_adjustment'
  AND t.reference_id=x.id
  AND x.kind='discount'
  AND x.percent IS NOT NULL
  AND x.invoice_count IS NOT NULL
  AND x.invoice_count>0
  AND x.period_to IS NOT NULL
  AND t.txn_date IS DISTINCT FROM x.period_to;

UPDATE finance_customer_adjustments
SET adjusted_at=period_to
WHERE kind='discount'
  AND percent IS NOT NULL
  AND invoice_count IS NOT NULL
  AND invoice_count>0
  AND period_to IS NOT NULL
  AND adjusted_at IS DISTINCT FROM period_to;

CREATE INDEX IF NOT EXISTS lab_customer_finance_settings_discount_started_idx
  ON lab_customer_finance_settings(lab_id,customer_id,discount_started_at)
  WHERE discount_enabled=true;
