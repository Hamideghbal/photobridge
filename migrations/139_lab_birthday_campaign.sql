CREATE TABLE IF NOT EXISTS lab_birthday_campaigns (
  lab_id uuid PRIMARY KEY REFERENCES labs(id) ON DELETE CASCADE,
  discount_enabled boolean NOT NULL DEFAULT false,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0,
  days_before integer NOT NULL DEFAULT 7,
  days_after integer NOT NULL DEFAULT 0,
  print_enabled boolean NOT NULL DEFAULT true,
  album_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  greeting text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lab_birthday_invoice_discounts (
  invoice_id uuid PRIMARY KEY REFERENCES invoices(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount bigint NOT NULL CHECK (amount>=0),
  adjustment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS lab_birthday_sms_log (
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jalali_year integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(lab_id,photographer_id,jalali_year)
);
