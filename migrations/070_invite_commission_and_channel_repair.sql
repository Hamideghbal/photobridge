-- PhotoBridge v0.17.292 — automatic invite source + successful-signup commission
ALTER TABLE photographer_invites ALTER COLUMN campaign DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN channel DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN target_mobile DROP NOT NULL;
UPDATE photographer_invites SET channel='issuer:'||COALESCE(NULLIF(issuer_type,''),'admin') WHERE channel IS NULL OR btrim(channel)='';

ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_amount bigint NOT NULL DEFAULT 0;
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_status text NOT NULL DEFAULT 'not_applicable';
ALTER TABLE photographer_invite_redemptions ADD COLUMN IF NOT EXISTS commission_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS photographer_invite_redemptions_commission_idx ON photographer_invite_redemptions(commission_status,redeemed_at DESC);

INSERT INTO platform_settings(key,value,updated_at) VALUES('photographer_invite_commission','{"enabled":false,"amount":0}'::jsonb,now()) ON CONFLICT(key) DO NOTHING;
