const fs = require('fs');
const file = 'c:/MyProjects/OfficeProjects/ATS/Frontend/src/context/UserProvider.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('isDisabled: boolean;', 'isDisabled: boolean;\n  disabledBy?: {\n    _id: string;\n    name: string;\n  };');
content = content.replace('toggleUserStatus: (id: string) => Promise<boolean>;', 'toggleUserStatus: (id: string, disabledBy?: string) => Promise<boolean>;');
content = content.replace('const toggleUserStatus = async (id: string) => {', 'const toggleUserStatus = async (id: string, disabledBy?: string) => {');
content = content.replace('const res = await axios.patch(`${API_BASE_URL}/api/users/${id}/toggle-status`);', 'const res = await axios.patch(`${API_BASE_URL}/api/users/${id}/toggle-status`, { disabledBy });');
content = content.replace(/prev\.map\(\(u\) => \(u\._id === id \? \{ \.\.\.u, isDisabled: res\.data\.isDisabled \} : u\)\)/g, 'prev.map((u) => (u._id === id ? { ...u, isDisabled: res.data.isDisabled, disabledBy: res.data.disabledBy } : u))');

fs.writeFileSync(file, content);
console.log('UserProvider updated');
