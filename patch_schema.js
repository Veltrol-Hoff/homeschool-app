const fs = require('fs');

const filePath = 'C:\\Users\\ewhof\\.gemini\\antigravity\\brain\\0772288e-39e9-4683-a48b-40af064eb763\\idempotent_schema.sql';
let content = fs.readFileSync(filePath, 'utf8');

const pattern = /CREATE POLICY\s+"([^"]+)"\s*(?:[\n\r\s]*)ON\s+([a-zA-Z0-9_]+)/gi;

let newContent = content.replace(pattern, (match, p1, p2) => {
    return `DROP POLICY IF EXISTS "${p1}" ON ${p2};\n${match}`;
});

const doubleDrop = /DROP POLICY IF EXISTS "([^"]+)" ON ([a-zA-Z0-9_]+);[\s\n\r]*DROP POLICY IF EXISTS "\1" ON \2;/gi;
newContent = newContent.replace(doubleDrop, 'DROP POLICY IF EXISTS "$1" ON $2;');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Schema patched successfully!');
