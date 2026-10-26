# R1484 — explicit lab phone taps

On the public phone lab workspace, order-card whitespace no longer opens details. The existing Details button remains unchanged. Phone timeline clicks stop propagation. Download and unavailable stage taps show guidance and never dispatch a download or a transition. Available stages still use the previously approved server-confirmed workflow. Existing desktop disabled-state behavior is retained.

Phone folder support reports unavailable, and the shared folder picker refuses phone calls before touching any disk. This prevents implicit directory selection from order details or stage side effects. Windows/desktop keep the original picker implementation and behavior. The transform runs after the frozen native snapshot; no Windows source, settings, installer or backend changes.

Hide the walk-in order launcher on phone only; enlarge stage dots to 32px inside at least 48x80px touch targets. Align finance headings and navigation right. Stretch the existing invoice action buttons into equal-width columns across the card.

Validation: five tests execute the actual transformed card/stage/picker handlers, verify desktop behavior and all frozen Windows SHA-256 hashes. The final snapshot/freshness/wire pipeline and earlier phone tests pass. Authenticated real-phone visual testing remains unavailable.
