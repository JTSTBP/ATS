const fs = require('fs');
const file = 'c:/MyProjects/OfficeProjects/ATS/Frontend/src/components/AdminPanel/usermanagement.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { useAuth }')) {
  content = content.replace('import { useUserContext } from "../../context/UserProvider";', 'import { useUserContext } from "../../context/UserProvider";\nimport { useAuth } from "../../context/AuthContext";');
}

if (!content.includes('const { user: currentUser } = useAuth();')) {
  content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { user: currentUser } = useAuth();');
}

content = content.replace('{user.isDisabled ? "Disabled" : "Active"}', `{user.isDisabled ? (
                          <div className="flex flex-col items-center">
                            <span>Disabled</span>
                            {user.disabledBy?.name && (
                              <span className="text-[10px] mt-0.5 font-normal opacity-80">by {user.disabledBy.name}</span>
                            )}
                          </div>
                        ) : "Active"}`);

content = content.replace('onClick={() => toggleUserStatus(user._id)}', 'onClick={() => toggleUserStatus(user._id, currentUser?._id)}');

fs.writeFileSync(file, content);
console.log('usermanagement.tsx updated');
