const fs = require('fs');

// Fix mockData.ts
let md = fs.readFileSync('src/lib/mockData.ts', 'utf8');
md = md.replace(/created_at:.*,/g, ''); // removes created_at lines entirely
fs.writeFileSync('src/lib/mockData.ts', md);

// Fix MemberDashboard.tsx
let mdb = fs.readFileSync('src/pages/MemberDashboard.tsx', 'utf8');
mdb = mdb.replace(/import React, { useEffect, useState } from 'react';/, "import { useEffect, useState } from 'react';");
mdb = mdb.replace(/, getCurrentISTDateString/, "");
fs.writeFileSync('src/pages/MemberDashboard.tsx', mdb);

// Fix Receipt.tsx
let rt = fs.readFileSync('src/pages/Receipt.tsx', 'utf8');
rt = rt.replace(/created_at: new Date\(\)\.toISOString\(\)/g, "created_by: 'system'");
fs.writeFileSync('src/pages/Receipt.tsx', rt);

console.log("Fixed!");
