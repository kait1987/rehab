#!/usr/bin/env python3
"""
Git filter-branch helper script to remove Service Role Key from README.md
"""
import sys
import re

# Read file content from stdin
content = sys.stdin.read()

# Replace the actual key with placeholder
pattern = r'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^\n]+'
replacement = 'SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key'

# Replace all occurrences
new_content = re.sub(pattern, replacement, content)

# Write to stdout
sys.stdout.write(new_content)

