import { testAccountSql } from './test-account-visibility.js';

const mobileKey = value => String(value || '').replace(/[۰-۹٠-٩]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.includes(c) ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(c) : '٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g, '').slice(-10);

export async function shopSmsTestRecipient(db, shopId, mobile) {
    const key = mobileKey(mobile);
    if (!/^9\d{9}$/.test(key)) return false;
    const q = await db.query(`SELECT admin.mobile FROM users admin WHERE admin.active=true AND admin.platform_role='platform_admin' AND EXISTS(SELECT 1 FROM equipment_rental_shops test_shop WHERE test_shop.id=$1 AND ${testAccountSql('shop','test_shop')})`, [shopId]);
    return q.rows.some(admin => mobileKey(admin.mobile) === key);
}

export function productionOrderSms(shop, order, action) {
    const config = {
        confirm: ['booking_approved', 'production_confirmed', 'تأیید شد.'],
        cancel: ['booking_status', 'production_cancelled', 'رد یا لغو شد.'],
        ready: ['order_ready', 'production_ready', 'آماده است.']
    }[action];
    if (!config) return null;
    const [setting, eventKey, status] = config;
    const delivery = action === 'ready' ? (order.delivery_method === 'courier' ? '\nبرای ارسال با پیک پیگیری کنید.' : '\nبرای دریافت حضوری مراجعه کنید.') : '';
    return { setting, eventKey, purpose: 'rental_' + eventKey, message: `PhotoBridge\nسفارش قاب و شاسی شما در «${shop.name || 'فروشگاه'}» ${status}\nکد سفارش: ${String(order.id).slice(0,8).toUpperCase()}${delivery}` };
}
