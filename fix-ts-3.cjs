const fs = require('fs');

let md = fs.readFileSync('src/lib/mockData.ts', 'utf8');
md = md.replace(/deleted_at: null,/g, "deleted_at: null, created_by: 'system',");
fs.writeFileSync('src/lib/mockData.ts', md);

let r = fs.readFileSync('src/pages/Receipt.tsx', 'utf8');
r = r.replace(/import type { Payment, Member }/g, "import type { Payment }");
fs.writeFileSync('src/pages/Receipt.tsx', r);

console.log('Fixed types!');
