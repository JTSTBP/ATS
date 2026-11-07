async (page) => {
 let lastPreview = null;
 const previewPDF = "JVBERi0xLjMKJf////8KNyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9NZWRpYUJveCBbMCAwIDU5NS4yOCA4NDEuODldCi9Db250ZW50cyA1IDAgUgovUmVzb3VyY2VzIDYgMCBSCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovQ29sb3JTcGFjZSA8PAo+Pgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDI5Ci9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+CnN0cmVhbQp4nDNUMFAwUNA1VDBQsDAx1LOwVEjO5QIAJ/MD9gplbmRzdHJlYW0KZW5kb2JqCjkgMCBvYmoKKFBERktpdCkKZW5kb2JqCjEwIDAgb2JqCihQREZLaXQpCmVuZG9iagoxMSAwIG9iagooRDoyMDI2MTEwNzA5NTEwMlopCmVuZG9iago4IDAgb2JqCjw8Ci9Qcm9kdWNlciA5IDAgUgovQ3JlYXRvciAxMCAwIFIKL0NyZWF0aW9uRGF0ZSAxMSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCi9OYW1lcyAyIDAgUgo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzcgMCBSXQo+PgplbmRvYmoKMiAwIG9iago8PAovRGVzdHMgPDwKICAvTmFtZXMgWwpdCj4+Cj4+CmVuZG9iagp4cmVmCjAgMTIKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwNTUyIDAwMDAwIG4gCjAwMDAwMDA2MDkgMDAwMDAgbiAKMDAwMDAwMDQ5MCAwMDAwMCBuIAowMDAwMDAwNDY5IDAwMDAwIG4gCjAwMDAwMDAyMTAgMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAzOTUgMDAwMDAgbiAKMDAwMDAwMDMxMCAwMDAwMCBuIAowMDAwMDAwMzM0IDAwMDAwIG4gCjAwMDAwMDAzNTkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSAxMgovUm9vdCAzIDAgUgovSW5mbyA4IDAgUgovSUQgWzxiNWU3NmZhYzE5ODc3NjA1OGYwNWNmZjRlZDM4NzIwMj4gPGI1ZTc2ZmFjMTk4Nzc2MDU4ZjA1Y2ZmNGVkMzg3MjAyPl0KPj4Kc3RhcnR4cmVmCjY1NgolJUVPRgo=";
 let list = [{_id:'new-candidate',dynamicFields:{Name:'New Candidate',CTC:'1000000'},status:'New',jobId:{_id:'job',title:'Engineer'}}];
 await page.unroute('**/api/**');
 await page.route('**/api/**', route => {
  const url=route.request().url();
  if(url.includes('/invoices/preview-download')) { lastPreview=route.request().postDataJSON(); return route.fulfill({contentType:'application/pdf',body:Buffer.from(previewPDF,'base64')}); }
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
 const previewReady=page.waitForResponse(r=>r.url().includes('/invoices/preview-download') && r.request().postDataJSON()?.candidates?.[0]?.candidateId?._id==='added-candidate');
 await modal.getByText('Added In Another Tab (New)',{exact:true}).click();
 await previewReady;
 if(await invoiceNumber.inputValue()!=='TEST-DRAFT') throw new Error('Refresh reset the invoice draft');
 await modal.getByTitle('Invoice PDF preview',{exact:true}).waitFor();
 if(lastPreview?.candidates?.[0]?.candidateId?.dynamicFields?.CandidateName!=='Added In Another Tab') throw new Error('PDF preview did not receive the candidate name');
 await modal.getByRole('button',{name:'Add Candidate',exact:true}).click();
 if(await modal.getByText('Select Candidate',{exact:true}).count()!==1) throw new Error('Add candidate row did not appear');
 await page.screenshot({path:'output/invoice-candidate-list-fixed.png',fullPage:true});
 return 'PASS: New candidates visible, names supported, returning to invoice refreshes choices, draft and added rows preserved';
}
