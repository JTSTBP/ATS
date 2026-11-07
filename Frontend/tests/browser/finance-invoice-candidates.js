async (page) => {
 let list = [{_id:'new-candidate',dynamicFields:{Name:'New Candidate',CTC:'1000000'},status:'New',jobId:{_id:'job',title:'Engineer'}}];
 await page.unroute('**/api/**');
 await page.route('**/api/**', route => {
  const url=route.request().url();
  const data=url.includes('/CandidatesJob')?{success:true,candidates:list}:url.includes('/invoices/summary')?{totalIncome:0,totalExpenses:0,netProfit:0,profitMargin:0}:url.includes('/invoices/')||url.includes('/expenses/')?[]:url.includes('/clients')?{success:true,clients:[{_id:'client',companyName:'Example Client',agreementPercentage:10}]}:url.includes('/jobs')?{success:true,jobs:[]}:url.includes('/users')?[]:{success:true,data:[],activities:[],notifications:[],replies:[]};
  return route.fulfill({json:data});
 });
 await page.evaluate(()=>{localStorage.setItem('user',JSON.stringify({_id:'preview-admin',name:'Preview Admin',designation:'Admin',isAdmin:true}));localStorage.setItem('token','preview-only');});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5173/Admin/finance');
 await page.getByRole('button',{name:'Create Invoice',exact:true}).click();
 const modal=page.locator('.fixed.inset-0.bg-slate-50');
 await modal.getByText('Select Candidate',{exact:true}).click();
 if(!await modal.getByText('New Candidate (New)',{exact:true}).isVisible()) throw new Error('Newly created candidate is missing from invoice choices');
 await modal.getByText('New Candidate (New)',{exact:true}).click();
 const invoiceNumber=modal.getByPlaceholder('e.g. JT/RO/25-26/001');
 await invoiceNumber.fill('TEST-DRAFT');
 list=[...list,{_id:'added-candidate',dynamicFields:{CandidateName:'Added In Another Tab'},status:'New',jobId:{_id:'job',title:'Engineer'}}];
 const refreshed=page.waitForResponse(r=>r.url().includes('/CandidatesJob'));
 await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); await refreshed;
 await modal.getByText('New Candidate (New)',{exact:true}).click();
 await modal.getByText('Added In Another Tab (New)',{exact:true}).waitFor({timeout:3000});
 await modal.getByText('Added In Another Tab (New)',{exact:true}).click();
 if(await invoiceNumber.inputValue()!=='TEST-DRAFT') throw new Error('Refresh reset the invoice draft');
 await modal.locator('td').filter({hasText:'Added In Another Tab'}).first().waitFor();
 await modal.getByRole('button',{name:'Add Candidate',exact:true}).click();
 if(await modal.getByText('Select Candidate',{exact:true}).count()!==1) throw new Error('Add candidate row did not appear');
 await page.screenshot({path:'output/invoice-candidate-list-fixed.png',fullPage:true});
 return 'PASS: New candidates visible, names supported, returning to invoice refreshes choices, draft and added rows preserved';
}
