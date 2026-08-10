const fs = require('fs');
let content = fs.readFileSync('C:/Users/ewhof/.gemini/antigravity/brain/0772288e-39e9-4683-a48b-40af064eb763/missing_schema.sql', 'utf8');

content = content.replace(/INSERT INTO storage\.buckets/g, '-- INSERT INTO storage.buckets');
content = content.replace(/CREATE POLICY \"Public Access\" ON storage\.objects/g, '-- CREATE POLICY \"Public Access\" ON storage.objects');
content = content.replace(/CREATE POLICY \"Authenticated users can upload media\" ON storage\.objects/g, '-- CREATE POLICY \"Authenticated users can upload media\" ON storage.objects');
content = content.replace(/CREATE POLICY \"Authenticated users can update media\" ON storage\.objects/g, '-- CREATE POLICY \"Authenticated users can update media\" ON storage.objects');
content = content.replace(/CREATE POLICY \"Authenticated users can delete media\" ON storage\.objects/g, '-- CREATE POLICY \"Authenticated users can delete media\" ON storage.objects');

fs.writeFileSync('C:/Users/ewhof/.gemini/antigravity/brain/0772288e-39e9-4683-a48b-40af064eb763/missing_schema.sql', content);
