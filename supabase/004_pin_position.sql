-- ピン位置カラムをscoresテーブルに追加
-- グリーンの9分割位置を記録する（front/middle/back × left/center/right）

ALTER TABLE scores
ADD COLUMN pin_position TEXT
CHECK (pin_position IS NULL OR pin_position IN (
  'front-left', 'front-center', 'front-right',
  'middle-left', 'center', 'middle-right',
  'back-left', 'back-center', 'back-right'
));
