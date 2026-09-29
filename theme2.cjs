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
  { regex: /\bbg-zinc-950\b/g, replace: 'bg-white dark:bg-zinc-950' },
  { regex: /\bbg-black\b/g, replace: 'bg-white dark:bg-black' },
  { regex: /\bbg-zinc-900\b/g, replace: 'bg-gray-50 dark:bg-zinc-900' },
  { regex: /\bbg-zinc-800\b/g, replace: 'bg-gray-100 dark:bg-zinc-800' },
  
  { regex: /\bborder-red-950\b/g, replace: 'border-red-100 dark:border-red-950' },
  { regex: /\bborder-red-900\b/g, replace: 'border-red-200 dark:border-red-900' },
  { regex: /\bborder-red-800\b/g, replace: 'border-red-300 dark:border-red-800' },
  
  { regex: /\btext-gray-200\b/g, replace: 'text-gray-700 dark:text-gray-200' },
  { regex: /\btext-gray-300\b/g, replace: 'text-gray-600 dark:text-gray-300' },
  { regex: /\btext-gray-400\b/g, replace: 'text-gray-500 dark:text-gray-400' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  replacements.forEach(r => {
    content = content.replace(r.regex, r.replace);
  });

  // Handle text-white specifically to not break buttons (bg-red-600 text-white)
  // If text-white is NOT preceded or followed by a dark background or red background in the same string, maybe replace it.
  // Actually, standard text was replaced from text-gray-900/800 to text-white.
  // Let's replace `text-white` with `text-gray-900 dark:text-white` UNLESS it's a button.
  // We can just look for `text-white` and if it's in a class string that contains `bg-red-` or `bg-green-` or `text-white` is in `Layout` header, leave it.
  content = content.replace(/className="([^"]+)"/g, (match, classes) => {
    if (classes.includes('text-white') && !classes.includes('bg-red-') && !classes.includes('bg-green-')) {
      return `className="${classes.replace(/\btext-white\b/g, 'text-gray-900 dark:text-white')}"`;
    }
    return match;
  });
  
  fs.writeFileSync(file, content, 'utf-8');
});

console.log('Restored light mode & added dark mode variants!');
