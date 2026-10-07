-- PhotoBridge v0.17.299 — permanent reusable Photographer/Lab referral codes
-- Photographer and Lab referral links are no longer time/use-limited. Admin keeps the
-- advanced invite controls for operational cases.

UPDATE photographer_invites
SET max_uses = NULL,
    expires_at = NULL,
    target_mobile = NULL,
    campaign = NULL,
    metadata = COALESCE(metadata,'{}'::jsonb) || '{"permanent":true,"reusable":true}'::jsonb,
    updated_at = now()
WHERE issuer_type IN ('photographer','lab')
  AND active = true;

-- Lab/Admin invitations never participate in photographer referral rewards. Keep existing
-- accounting transactions untouched, but normalize non-awarded rows so the UI/API cannot
-- imply a pending gift for these issuer types.
UPDATE photographer_invite_redemptions r
SET commission_status = 'not_applicable',
    commission_amount = 0
FROM photographer_invites i
WHERE r.invite_id = i.id
  AND i.issuer_type <> 'photographer'
  AND r.commission_transaction_id IS NULL;
