-- R1779: immutable print add-on model/color identity captured when the photo is ordered.
-- Never use mutable lab tariff labels to rename an existing customer's order.
ALTER TABLE order_files
  ADD COLUMN IF NOT EXISTS addon_selection jsonb NOT NULL DEFAULT '{}'::jsonb;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'order_files'::regclass
      AND conname = 'order_files_addon_selection_object'
  ) THEN
    ALTER TABLE order_files
      ADD CONSTRAINT order_files_addon_selection_object
      CHECK (jsonb_typeof(addon_selection)='object');
  END IF;
END $$;
