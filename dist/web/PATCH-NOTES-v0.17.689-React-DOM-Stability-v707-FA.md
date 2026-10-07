# PhotoBridge v707 — React DOM Stability

- علت دقیق خطای `NotFoundError: insertBefore` پیدا شد: runtime نسخه 706 دکمه‌های React را با `appendChild / insertBefore / replaceChildren / remove` جابه‌جا می‌کرد. هنگام reconciliation بعدی، React مرجع sibling قبلی را دیگر در parent مورد انتظار پیدا نمی‌کرد و ErrorBoundary پیام «نمایش این صفحه متوقف شد» را نشان می‌داد.
- runtime v707 هیچ node داخل `#root` را ایجاد، حذف، جابه‌جا یا reparent نمی‌کند.
- MutationObserver سراسری v706 حذف شد.
- «دعوت همکار» بدون جابه‌جایی DOM و فقط با CSS در ردیف دوم موبایل نمایش داده می‌شود.
- دکمه PWA «نصب برنامه» خارج از React root و روی `document.body` نصب می‌شود تا با reconciliation تداخل نداشته باشد.
- استایل دسکتاپ فقط با class decoration انجام می‌شود و هیچ دکمه/جداکننده‌ای داخل React تزریق نمی‌شود.
- query باندل از `pb=701` به `pb=707` تغییر کرد تا مرورگر نسخه تازه را قطعی دریافت کند.
- Service Worker v707 هیچ fetch را intercept نمی‌کند.
