#!/usr/bin/env node
/**
 * Git filter-branch helper script to remove Service Role Key from README.md
 */
const fs = require("fs");
const readline = require("readline");

// Read from stdin
let content = "";
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on("line", (line) => {
  content += line + "\n";
});

rl.on("close", () => {
  // Replace the actual key with placeholder
  const pattern =
    /SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9[^\n]+/g;
  const replacement =
    "SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key";

  const newContent = content.replace(pattern, replacement);

  // Write to stdout
  process.stdout.write(newContent);
});
