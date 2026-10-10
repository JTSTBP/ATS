const fs = require('fs');
const file = 'c:/MyProjects/OfficeProjects/ATS/Frontend/src/components/AdminPanel/usermanagement.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '{user.disabledBy?.name && (\n                              <span className="text-[10px] mt-0.5 font-normal opacity-80">by {user.disabledBy.name}</span>\n                            )}',
  `{user.disabledBy?.name && (
                              <span className="text-[10px] mt-0.5 font-normal opacity-80">
                                by {user.disabledBy.name} {user.disabledAt && \`on \${new Date(user.disabledAt).toLocaleDateString()}\`}
                              </span>
                            )}`
);

fs.writeFileSync(file, content);
console.log('usermanagement.tsx updated');
