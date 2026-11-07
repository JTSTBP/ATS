async (page) => {
 let failNext=true;
 const payloads=[];
 await page.unroute('**/api/**');
 await page.route('**/api/**',route=>{
  const url=route.request().url();
  if(url.includes('/invoices/preview-download')) {
   payloads.push(route.request().postDataJSON());
   if(failNext) {failNext=false;return route.fulfill({status:500,json:{message:'Preview unavailable'}});}
   return route.fulfill({contentType:'application/pdf',body:Buffer.from('JVBERi0xLjMKJf////8KNyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9NZWRpYUJveCBbMCAwIDU5NS4yOCA4NDEuODldCi9Db250ZW50cyA1IDAgUgovUmVzb3VyY2VzIDYgMCBSCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovQ29sb3JTcGFjZSA8PAo+Pgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDI5Ci9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+CnN0cmVhbQp4nDNUMFAwUNA1VDBQsDAx1LOwVEjO5QIAJ/MD9gplbmRzdHJlYW0KZW5kb2JqCjkgMCBvYmoKKFBERktpdCkKZW5kb2JqCjEwIDAgb2JqCihQREZLaXQpCmVuZG9iagoxMSAwIG9iagooRDoyMDI2MTEwNzA5NTEwMlopCmVuZG9iago4IDAgb2JqCjw8Ci9Qcm9kdWNlciA5IDAgUgovQ3JlYXRvciAxMCAwIFIKL0NyZWF0aW9uRGF0ZSAxMSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDEgMCBSCi9OYW1lcyAyIDAgUgo+PgplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzcgMCBSXQo+PgplbmRvYmoKMiAwIG9iago8PAovRGVzdHMgPDwKICAvTmFtZXMgWwpdCj4+Cj4+CmVuZG9iagp4cmVmCjAgMTIKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwNTUyIDAwMDAwIG4gCjAwMDAwMDA2MDkgMDAwMDAgbiAKMDAwMDAwMDQ5MCAwMDAwMCBuIAowMDAwMDAwNDY5IDAwMDAwIG4gCjAwMDAwMDAyMTAgMDAwMDAgbiAKMDAwMDAwMDEyNSAwMDAwMCBuIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAzOTUgMDAwMDAgbiAKMDAwMDAwMDMxMCAwMDAwMCBuIAowMDAwMDAwMzM0IDAwMDAwIG4gCjAwMDAwMDAzNTkgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSAxMgovUm9vdCAzIDAgUgovSW5mbyA4IDAgUgovSUQgWzxiNWU3NmZhYzE5ODc3NjA1OGYwNWNmZjRlZDM4NzIwMj4gPGI1ZTc2ZmFjMTk4Nzc2MDU4ZjA1Y2ZmNGVkMzg3MjAyPl0KPj4Kc3RhcnR4cmVmCjY1NgolJUVPRgo=','base64')});
  }
  const data=url.includes('/CandidatesJob')?{success:true,candidates:[]}:url.includes('/invoices/summary')?{totalIncome:0,totalExpenses:0,netProfit:0,profitMargin:0}:url.includes('/invoices/')||url.includes('/expenses/')?[]:url.includes('/clients')?{success:true,clients:[]}:url.includes('/jobs')?{success:true,jobs:[]}:url.includes('/users')?[]:{success:true,data:[],activities:[],notifications:[],replies:[]};
  return route.fulfill({json:data});
 });
 await page.addInitScript(()=>{
  window.__invoicePreviewReleased=0;
  const revoke=URL.revokeObjectURL.bind(URL);
  URL.revokeObjectURL=url=>{window.__invoicePreviewReleased++;revoke(url);};
 });
 await page.evaluate(()=>{localStorage.setItem('user',JSON.stringify({_id:'finance-test',name:'Finance Preview',designation:'Finance'}));localStorage.setItem('token','preview-only');});
 await page.goto('http://127.0.0.1:5173/Admin/finance');
 await page.getByRole('button',{name:'Create Invoice',exact:true}).click();
 const preview=page.getByRole('region',{name:'Invoice preview',exact:true});
 await preview.getByRole('button',{name:'Retry preview',exact:true}).click();
 await preview.getByTitle('Invoice PDF preview',{exact:true}).waitFor();
 const ready=page.waitForResponse(r=>r.url().includes('/invoices/preview-download') && r.request().postDataJSON()?.invoiceNumber==='DRAFT-B');
 const number=page.getByPlaceholder('e.g. JT/RO/25-26/001');
 await number.fill('DRAFT-A'); await number.fill('DRAFT-B'); await ready;
 await preview.getByRole('status').waitFor({state:'hidden'});
 if(payloads.some(data=>data.invoiceNumber==='DRAFT-A')) throw new Error('Typing was not debounced');
 for(const width of [1440,1024,768,320]) {
  await page.setViewportSize({width,height:1000}); await page.waitForTimeout(400);
  const modal=page.locator('.fixed.inset-0.bg-slate-50');
  if(!await modal.evaluate(el=>el.scrollWidth<=el.clientWidth+1)) throw new Error('Invoice layout overflow '+width);
 }
 const releases=await page.evaluate(()=>window.__invoicePreviewReleased);
 await page.locator('.fixed.inset-0.bg-slate-50').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.waitForFunction(previous=>window.__invoicePreviewReleased>previous,releases);
 return 'PASS: PDF preview retry, debounce, responsive widths and object URL cleanup';
}
