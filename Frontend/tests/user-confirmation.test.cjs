const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function mount(confirmed, isDisabled = false) {
  let hook = 0; const requests = [], prompts = [];
  const account = { _id:'sample', name:'Sample recruiter', email:'sample@example.com', isDisabled };
  const react = { createContext: () => ({Provider:'Provider'}), useEffect() {}, useState: initial => [hook++ < 2 ? [account] : initial, () => {}] };
  const axios = Object.fromEntries(['get','put','patch','delete'].map(method => [method, async (...args) => { requests.push({method,args}); return { data:method==='get'?[account]:{success:true,isDisabled:!isDisabled} }; }]));
  const module = { exports:{} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/context/UserProvider.tsx'),'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  vm.runInNewContext(code.replace('import.meta.env.VITE_BACKEND_URL', "'http://test.local'"), {module,exports:module.exports,console,window:{confirm(message) {prompts.push(message); return confirmed;}},require(name) { if(name==='react') return react; if(name==='react/jsx-runtime') return {jsx:(_type,props)=>({props})}; if(name==='axios') return {default:axios}; if(name==='react-toastify') return {toast:{success(){},error(){}}}; throw Error(name); }});
  const api = module.exports.UserProvider({children:null}).props.value;
  return {api,requests,prompts};
}
for (const action of ['delete','disable','edit-disable']) test(`canceling ${action} sends no mutation and returns false`, async()=>{
 const app=mount(false);
 const result=await (action==='delete'?app.api.deleteUser('sample'):action==='disable'?app.api.toggleUserStatus('sample'):app.api.updateUser('sample',{name:'Sample recruiter',isDisabled:true}));
 assert.equal(result,false); assert.equal(app.requests.length,0); assert.equal(app.prompts.length,1); assert.match(app.prompts[0],/Sample recruiter/); assert.match(app.prompts[0],/sample@example.com/);
 if(action==='delete') assert.match(app.prompts[0],/cannot be undone/);
});
for (const action of ['delete','disable','edit-disable']) test(`confirming ${action} allows exactly one mutation`, async()=>{
 const app=mount(true); const result=await(action==='delete'?app.api.deleteUser('sample'):action==='disable'?app.api.toggleUserStatus('sample'):app.api.updateUser('sample',{name:'Sample recruiter',isDisabled:true}));
 assert.equal(result,true); assert.equal(app.requests.filter(request=>request.method!=='get').length,1); assert.equal(app.prompts.length,1);
});
test('ordinary profile edits do not prompt and do not change status',async()=>{const app=mount(false);assert.equal(await app.api.updateUser('sample',{name:'Updated name'}),true);assert.equal(app.prompts.length,0);assert.equal(app.requests[0].method,'put');});
test('saving an already-disabled account does not prompt again',async()=>{const app=mount(false,true);assert.equal(await app.api.updateUser('sample',{name:'Sample recruiter',isDisabled:true}),true);assert.equal(app.prompts.length,0);});
