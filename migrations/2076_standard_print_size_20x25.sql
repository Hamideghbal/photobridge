-- R2076: one shared standard 20 x 25 cm print size, for colleague and walk-in tariffs.
-- Do not invent prices, change existing prices or modify any historical order.
WITH added AS (
  INSERT INTO print_sizes(id,label,width_cm,height_cm,active,owner_lab_id,updated_at)
  VALUES ('20x25','۲۰×۲۵',20,25,true,NULL,now())
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
-- Existing labs may already have a custom 20x25. Preserve that exact size and
-- its existing tariff; suppress only the newly introduced duplicate for them.
INSERT INTO lab_hidden_print_sizes(lab_id,size_id)
SELECT DISTINCT p.owner_lab_id,added.id
FROM added CROSS JOIN print_sizes p
WHERE p.owner_lab_id IS NOT NULL AND p.active=true
  AND abs(p.width_cm-20)<0.001 AND abs(p.height_cm-25)<0.001
  AND NOT EXISTS (
    SELECT 1 FROM lab_hidden_print_sizes h
    WHERE h.lab_id=p.owner_lab_id AND h.size_id=p.id
  )
ON CONFLICT DO NOTHING;
