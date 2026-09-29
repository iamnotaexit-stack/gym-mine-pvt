const fs = require('fs');
let config = fs.readFileSync('vite.config.ts', 'utf8');
config = config.replace(/base: '\/gym-mine-pvt\/',/g, '');
fs.writeFileSync('vite.config.ts', config);
