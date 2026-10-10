const fs = require('fs');
const file = 'c:/MyProjects/OfficeProjects/ATS/Frontend/src/components/AdminPanel/usermanagement.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for disabledFilter
content = content.replace(
  'const [reporterFilter, setReporterFilter] = useState("");',
  'const [reporterFilter, setReporterFilter] = useState("");\n  const [disabledFilter, setDisabledFilter] = useState(false);'
);

// 2. Add disabledFilter to fetchPaginatedUsers dependencies and call
content = content.replace(
  /fetchPaginatedUsers\(\s*currentPage,\s*limit,\s*searchTerm,\s*effectiveRole,\s*adminFilter\s*\|\|\s*"",\s*reporterFilter\s*\)\.finally\(\(\)\s*=>\s*\{/g,
  'fetchPaginatedUsers(currentPage, limit, searchTerm, effectiveRole, adminFilter || "", reporterFilter, disabledFilter ? "true" : "").finally(() => {'
);

content = content.replace(
  '  }, [currentPage, searchTerm, effectiveRole, adminFilter, reporterFilter]);',
  '  }, [currentPage, searchTerm, effectiveRole, adminFilter, reporterFilter, disabledFilter]);'
);

content = content.replace(
  '  }, [searchTerm, effectiveRole, adminFilter, reporterFilter]);',
  '  }, [searchTerm, effectiveRole, adminFilter, reporterFilter, disabledFilter]);'
);

// 3. Add clearFilter logic
content = content.replace(
  '    setReporterFilter("");\n  };',
  '    setReporterFilter("");\n    setDisabledFilter(false);\n  };'
);

// 4. Add the toggle UI.
const toggleUI = `          <div className="w-full sm:w-56">
            <SearchableSelect
              options={[
                { value: "", label: "All Reporters" },
                ...Array.from(
                  new Map(
                    users
                      .filter((u: any) => !u.isDisabled)
                      .map((u: any) => u.reporter)
                      .filter(Boolean)
                      .map((r: any) => [r._id, r])
                  ).values()
                ).map((r: any) => ({
                  value: r._id,
                  label: r.name
                }))
              ]}
              value={reporterFilter}
              onChange={(val) => setReporterFilter(val)}
              placeholder="Filter by Reporter"
            />
          </div>
          
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
              checked={disabledFilter}
              onChange={(e) => setDisabledFilter(e.target.checked)}
            />
            Only Disabled
          </label>`;

content = content.replace(
  /<div className="w-full sm:w-56">[\s\S]*?<\/div>\s*<div className="flex items-center gap-2 order-first sm:order-last">/,
  toggleUI + '\n\n          <div className="flex items-center gap-2 order-first sm:order-last">'
);

fs.writeFileSync(file, content, 'utf8');
console.log('updated usermanagement');
