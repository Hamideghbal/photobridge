-- PhotoBridge v0.17.61 — optional SMS alerts for the lab manager

ALTER TABLE lab_sms_settings
  ADD COLUMN IF NOT EXISTS manager_order_submitted_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manager_chat_enabled boolean NOT NULL DEFAULT false;

UPDATE platform_services
SET name='پیامک عملیاتی',
    description='پیامک‌های عملیاتی مشتری، عکاس و اعلان‌های اختیاری مدیر لابراتوار.',
    updated_at=now()
WHERE service_key='sms_customer_notification';
