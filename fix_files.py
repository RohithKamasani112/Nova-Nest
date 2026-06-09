import os
import re

proj_path = r'c:\Users\Hp\Downloads\Real Estate Web Application'
os.chdir(proj_path)

# Fix LoginPage.tsx - remove everything after the first closing };
login_file = r'src\pages\LoginPage.tsx'
with open(login_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the first occurrence of "};" after line 180
lines = content.split('\n')
new_lines = []
found_end = False
for i, line in enumerate(lines):
    new_lines.append(line)
    if not found_end and i >= 175 and '};' in line:
        found_end = True
        break

with open(login_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines) + '\n')
print(f'✓ Fixed LoginPage.tsx - kept {len(new_lines)} lines')

# Fix LeadsManagementPage.tsx - similar approach
leads_file = r'src\pages\LeadsManagementPage.tsx'
with open(leads_file, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
new_lines = []
found_end = False
for i, line in enumerate(lines):
    new_lines.append(line)
    if not found_end and i >= 240 and '};' in line:
        found_end = True
        break

with open(leads_file, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines) + '\n')
print(f'✓ Fixed LeadsManagementPage.tsx - kept {len(new_lines)} lines')

# Cleanup temp files
import glob
for f in glob.glob('src/pages/*_fixed.tsx'):
    os.remove(f)
    print(f'✓ Cleaned up {f}')

print('\nAll syntax errors fixed! Ready to run: npm run dev')
