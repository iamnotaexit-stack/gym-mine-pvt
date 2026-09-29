const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'src'));

const replacements = [
  { regex: /\bbg-white\b/g, replace: 'bg-zinc-950' },
  { regex: /\bbg-gray-50\b/g, replace: 'bg-black' },
  { regex: /\bbg-gray-100\b/g, replace: 'bg-zinc-900' },
  { regex: /\bbg-gray-200\b/g, replace: 'bg-zinc-800' },
  
  { regex: /\bborder-gray-100\b/g, replace: 'border-red-950' },
  { regex: /\bborder-gray-200\b/g, replace: 'border-red-900' },
  { regex: /\bborder-gray-300\b/g, replace: 'border-red-800' },
  
  { regex: /\btext-gray-900\b/g, replace: 'text-white' },
  { regex: /\btext-gray-800\b/g, replace: 'text-white' },
  { regex: /\btext-gray-700\b/g, replace: 'text-gray-200' },
  { regex: /\btext-gray-600\b/g, replace: 'text-gray-300' },
  { regex: /\btext-gray-500\b/g, replace: 'text-gray-400' },
  
  { regex: /\bindigo-/g, replace: 'red-' },
  { regex: /\bgreen-/g, replace: 'red-' },
  { regex: /\borange-/g, replace: 'red-' },
  { regex: /\byellow-/g, replace: 'red-' },
  { regex: /\bblue-/g, replace: 'red-' }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replace);
  });
  
  fs.writeFileSync(file, content, 'utf-8');
});

console.log('Theme updated to dark red/white!');
