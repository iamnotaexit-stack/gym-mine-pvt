const fs = require('fs');

let md = fs.readFileSync('src/lib/mockData.ts', 'utf8');
md = md.replace(/, created_at: ''/g, '');
md = md.replace(/created_at: '2026/g, "created_by: 'system");
fs.writeFileSync('src/lib/mockData.ts', md);

let r = fs.readFileSync('src/pages/Receipt.tsx', 'utf8');
r = r.replace(/plan: \{ name: '3 Months Pro' \}/g, "plan: { id: 'p1', name: '3 Months Pro', months: 3, price: 2500 }");
fs.writeFileSync('src/pages/Receipt.tsx', r);

console.log('Fixed types!');
