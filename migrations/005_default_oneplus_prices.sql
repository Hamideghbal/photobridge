-- PhotoBridge default One+ print tariff supplied by the project owner
INSERT INTO print_sizes(id,label,width_cm,height_cm,active) VALUES
('10x15','۱۰×۱۵',10,15,true),('13x18','۱۳×۱۸',13,18,true),('13x26','۱۳×۲۶',13,26,true),('16x21','۱۶×۲۱',16,21,true),
('20x30','۲۰×۳۰',20,30,true),('30x30','۳۰×۳۰',30,30,true),('30x40','۳۰×۴۰',30,40,true),('30x45','۳۰×۴۵',30,45,true),
('30x60','۳۰×۶۰',30,60,true),('30x80','۳۰×۸۰',30,80,true),('40x60','۴۰×۶۰',40,60,true),('40x80','۴۰×۸۰',40,80,true),
('50x70','۵۰×۷۰',50,70,true),('50x80','۵۰×۸۰',50,80,true),('60x90','۶۰×۹۰',60,90,true),('70x100','۷۰×۱۰۰',70,100,true),
('75x120','۷۵×۱۲۰',75,120,true),('75x200','۷۵×۲۰۰',75,200,true)
ON CONFLICT(id) DO UPDATE SET label=EXCLUDED.label,width_cm=EXCLUDED.width_cm,height_cm=EXCLUDED.height_cm,active=true;

INSERT INTO lab_prices(lab_id,size_id,luster,silk,metallic,chassis,updated_at)
SELECT l.id,v.size_id,v.luster,v.silk,v.metallic,v.chassis,now()
FROM labs l CROSS JOIN (VALUES
('10x15',30000::bigint,45000::bigint,NULL::bigint,45000::bigint),
('13x18',45000,75000,NULL,80000),('13x26',55000,85000,NULL,NULL),('16x21',60000,90000,130000,90000),
('20x30',130000,170000,220000,130000),('30x30',195000,255000,NULL,270000),('30x40',260000,340000,500000,260000),('30x45',290000,390000,500000,315000),
('30x60',390000,500000,660000,420000),('30x80',520000,680000,880000,520000),('40x60',520000,650000,1100000,600000),('40x80',670000,840000,1480000,650000),
('50x70',600000,840000,1300000,650000),('50x80',700000,920000,1500000,760000),('60x90',1200000,1600000,2400000,1200000),('70x100',1400000,1900000,2700000,1400000),
('75x120',1700000,2300000,3200000,2300000),('75x200',2800000,3600000,NULL,NULL)
) AS v(size_id,luster,silk,metallic,chassis)
ON CONFLICT(lab_id,size_id) DO UPDATE SET
  luster=EXCLUDED.luster,
  silk=EXCLUDED.silk,
  metallic=EXCLUDED.metallic,
  chassis=EXCLUDED.chassis,
  updated_at=now();
