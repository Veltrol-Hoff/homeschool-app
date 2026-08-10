import re

file_path = r'C:\Users\ewhof\.gemini\antigravity\brain\0772288e-39e9-4683-a48b-40af064eb763\idempotent_schema.sql'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'CREATE POLICY\s+"([^"]+)"\s*(?:[\n\r\s]*)ON\s+([a-zA-Z0-9_]+)', re.IGNORECASE)

def replacer(match):
    policy_name = match.group(1)
    table_name = match.group(2)
    drop_statement = f'DROP POLICY IF EXISTS "{policy_name}" ON {table_name};\n'
    return drop_statement + match.group(0)

new_content = pattern.sub(replacer, content)

# Clean up double drops
double_drop_pattern = re.compile(r'DROP POLICY IF EXISTS "([^"]+)" ON ([a-zA-Z0-9_]+);[\s\n\r]*DROP POLICY IF EXISTS "\1" ON \2;', re.IGNORECASE)
new_content = double_drop_pattern.sub(r'DROP POLICY IF EXISTS "\1" ON \2;', new_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Schema patched successfully!')
