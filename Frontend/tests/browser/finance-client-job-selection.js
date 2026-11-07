async (page) => {
 const clients=[{_id:'client-a',companyName:'Alpha Client'},{_id:'client-b',companyName:'Beta Client'}];
 const jobs=[{_id:'a-open',title:'Engineer',status:'Open',clientId:clients[0],candidateFields:[{id:'name',name:'Name',type:'text'}]}, {_id:'a-closed',title:'Accountant',status:'Closed',clientId:clients[0],candidateFields:[{id:'name',name:'Name',type:'text'}]}, {_id:'b-open',title:'Designer',status:'Open',clientId:clients[1],candidateFields:[{id:'name',name:'Name',type:'text'}]}];
 await page.unroute('**/api/**');
 await page.route('**/api/**',route=>{
  const url=route.request().url();
  const data=url.includes('/jobs')?{success:true,jobs}:url.includes('/clients')?{success:true,clients}:url.includes('/CandidatesJob')?{success:true,candidates:[{_id:'candidate-existing',jobId:jobs[1],dynamicFields:{Name:'Existing Candidate'},createdBy:{_id:'finance-preview'},status:'New'}],currentPage:1,totalPages:1,totalCandidates:1}:url.includes('/users')?[]:{success:true,data:[],activities:[],notifications:[],replies:[]};
  return route.fulfill({json:data});
 });
 await page.evaluate(()=>{localStorage.setItem('user',JSON.stringify({_id:'finance-preview',name:'Finance Preview',designation:'Finance'}));localStorage.setItem('token','preview-only');});
 await page.setViewportSize({width:1366,height:900});
 await page.goto('http://127.0.0.1:5173/Admin/candidates/add');
 await page.getByRole('heading',{name:'Candidate Application Form',exact:true}).waitFor();
 const client=page.getByLabel('Select Client',{exact:true});
 if(await client.count()!==1) throw new Error('Finance candidate form is missing its client selector');
 const role=page.getByLabel(/^Select Job Role/);
 if(!await role.isDisabled()) throw new Error('Job role should wait for client selection');
 await client.selectOption('client-a');
 await role.selectOption('a-open');
 if(!(await role.locator('option:checked').innerText()).includes('Active (Open)')) throw new Error('Active status missing');
 if(await role.getByRole('option',{name:'Designer — Active (Open)',exact:true}).count()) throw new Error('Other client jobs leaked into roles');
 await role.selectOption('a-closed');
 if(await role.getByRole('option',{name:'Accountant — Inactive (Closed)',exact:true}).count()!==1) throw new Error('Closed status missing');
 await page.getByPlaceholder('Add any notes...').fill('Keep these notes');
 await client.selectOption('client-b');
 if(await role.inputValue()!=='') throw new Error('Changing client did not clear role');
 if(await page.getByPlaceholder('Add any notes...').inputValue()!=='Keep these notes') throw new Error('Changing client cleared personal notes');
 await role.selectOption('b-open');
 await page.screenshot({path:'output/finance-candidate-client-role.png',fullPage:true});
 await page.goto('http://127.0.0.1:5173/Admin/candidates');
 await page.locator('.candidate-card-actions button[title=Edit]').click();
 if(await page.getByLabel('Select Client',{exact:true}).inputValue()!=='client-a') throw new Error('Existing client was not restored');
 if(await page.getByLabel(/^Select Job Role/).inputValue()!=='a-closed') throw new Error('Existing inactive role was not restored');
 return 'PASS: client-first filtering, active/inactive labels, dependent reset, notes preserved, existing candidate restored';
}
