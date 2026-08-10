const fs = require('fs');
let content = fs.readFileSync('supabase/migrations/full_schema.sql', 'utf8');

// Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
content = content.replace(/CREATE TABLE (\w+)/g, 'CREATE TABLE IF NOT EXISTS $1');
content = content.replace(/CREATE TABLE public\.(\w+)/g, 'CREATE TABLE IF NOT EXISTS public.$1');

// Comment out ALTER TABLE ... ADD COLUMN so they don't crash, or use IF NOT EXISTS
content = content.replace(/ALTER TABLE (\w+) ADD COLUMN (\w+)/g, 'ALTER TABLE $1 ADD COLUMN IF NOT EXISTS $2');

// We need to safely handle policies so they don't crash if they exist.
// We can wrap them in DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;
// Actually, it's easier to just drop them first:
content = content.replace(/CREATE POLICY \"([^\"]+)\" ON (\w+)/g, 'DROP POLICY IF EXISTS \"$1\" ON $2;\nCREATE POLICY \"$1\" ON $2');

// Trigger fix:
content = content.replace(/CREATE OR REPLACE TRIGGER (\w+)\s+AFTER INSERT ON/g, 'DROP TRIGGER IF EXISTS $1 ON auth.users;\nCREATE TRIGGER $1\n    AFTER INSERT ON');

fs.writeFileSync('supabase/migrations/idempotent_schema.sql', content);
