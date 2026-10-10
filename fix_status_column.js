const fs = require('fs');
const file = 'c:/MyProjects/OfficeProjects/ATS/Frontend/src/components/AdminPanel/usermanagement.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = '{/* Status Column */}';
const endMarker = '{/* Actions Column */}';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

const newStatusColumn = `{/* Status Column */}
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={\`inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border \${user.isDisabled
                          ? "bg-rose-50 text-rose-700 border-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100"
                          }\`}>
                          <span className={\`w-1.5 h-1.5 rounded-full \${user.isDisabled ? "bg-rose-500" : "bg-emerald-500"}\`}></span>
                          {user.isDisabled ? "Disabled" : "Active"}
                        </span>
                        {user.isDisabled && (user as any).disabledBy?.name && (
                          <span className="text-[10px] text-rose-500 font-medium">
                            by {(user as any).disabledBy.name}
                            {(user as any).disabledAt && (
                              <span className="text-slate-400 font-normal ml-1">
                                on {new Date((user as any).disabledAt).toLocaleDateString()}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </td>

                    `;

content = content.slice(0, startIdx) + newStatusColumn + content.slice(endIdx);

fs.writeFileSync(file, content);
console.log('Status column fixed successfully!');
