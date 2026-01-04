import sys
import re

path = 'apps/api/src/package/package.service.ts'

with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
# We will iterate and remove lines that are "id: ..." if we just saw one.
# This assumes they are on separate lines.
# If they are on the same line, we need regex.
# The previous script injected "id: ..., updatedAt: ...," possibly on the same line or newly inserted line.

for i, line in enumerate(lines):
    # Check for duplicate 'id:' on same line
    # e.g. "          id: crypto.randomUUID(), id: crypto.randomUUID(),"
    if line.count('id: crypto.randomUUID(),') > 1:
        line = line.replace('id: crypto.randomUUID(),', '', 1) # remove first one
    
    if line.count('updatedAt: new Date(),') > 1:
        line = line.replace('updatedAt: new Date(),', '', 1)

    # Check for "id:" line followed immediately by another "id:" line (ignoring whitespace)
    if i > 0:
        prev = new_lines[-1].strip()
        curr = line.strip()
        if prev.startswith('id: crypto.randomUUID()') and curr.startswith('id:'):
            # Skip this line (the old one) or keep it? 
            # If I injected the first one, the second one is the old one.
            # But the old one might be `id: somethingElse`.
            # If I injected, I want mine? Or do I want to preserve the old variable?
            # If old variable is `id: readableId`, that's wrong field.
            # If old variable is `id: providedId`, maybe I should keep it?
            # The errors were "Missing property id", so likely there was NO id before.
            # The duplicate error implies there WAS one (maybe I double injected).
            # If I double injected, both differ only by randomness.
            # I will skip the current line if it looks like a duplicate key.
            continue
            
    new_lines.append(line)

# This is weak. 
# Let's try specifically targeting the known locations from previous TS errors.
# 571, 1403, 1630, 1640, 1705.
# These lines had "Multiple properties...".
# I'll just rewrite the file content using a robust regex that removes specific duplicate patterns I created.

content = "".join(lines)
# Remove "id: ..., id: ..." pattern created by my replace script if any.
content = re.sub(r'(id: crypto\.randomUUID\(\),)\s*id:', r'\1', content)
content = re.sub(r'(updatedAt: new Date\(\),)\s*updatedAt:', r'\1', content)

# Remove "id: ..., \n id:" pattern
content = re.sub(r'(id: crypto\.randomUUID\(\),)\s*\n\s*id:', r'\1', content)

with open(path, 'w') as f:
    f.write(content)

print(f"Fixed {path}")
