const fs = require('fs');
const file = 'c:/MyProjects/OfficeProjects/ATS/Frontend/src/context/UserProvider.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /reporter\?: string\s*\)\s*=>\s*Promise<void>;/g,
  'reporter?: string,\n    disabled?: string\n  ) => Promise<void>;'
);

content = content.replace(
  /reporter = ""\s*\)\s*=>\s*\{/g,
  'reporter = "",\n    disabled = ""\n  ) => {'
);

content = content.replace(
  'params: { page, limit, search, role, isAdmin, reporter },',
  'params: { page, limit, search, role, isAdmin, reporter, disabled },'
);

fs.writeFileSync(file, content, 'utf8');
console.log('updated UserProvider');
