const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const PDFDocument = require('pdfkit');
const pdfParse = require('pdf-parse');
const { PDFDocument: ReadPDF } = require('pdf-lib');

function generatorWithImagesAvailable(images) {
 class ObservedPDF extends PDFDocument {
  image(...args) { images.push(args); return super.image(...args); }
 }
 const module = { exports: {} };
 vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../utils/pdfGenerator.js'), 'utf8'), { module, __dirname: path.join(__dirname, '../utils'), require(name) {
  if (name === 'pdfkit') return ObservedPDF;
  if (name === 'fs') return { ...fs, existsSync: () => true };
  return require(name);
 } });
 return module.exports.generateInvoicePDF;
}
const invoice = (state = 'Uttar Pradesh') => ({
 invoiceNumber: 'JT/TEST/26-27/01', invoiceDate: '2026-08-25',
 client: {companyName:'Example Client'}, billingAddress:'Example Office\nIndustrial Area', billingState:state,
 gstNumber:'TEST-GST', candidates:[{candidateId:{dynamicFields:{CandidateName:'Alias Candidate'}},designation:'Finance Executive',doj:'2026-08-03',ctc:1450000,amount:120785}]
});
async function render(t, data, images) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ats-invoice-format-'));
 const output=path.join(dir,'invoice.pdf');
 t.after(()=>{ if(fs.existsSync(output)) fs.unlinkSync(output); fs.rmdirSync(dir); });
 await generatorWithImagesAvailable(images)(data,null,output);
 const bytes=fs.readFileSync(output);
 return {parsed:await pdfParse(Uint8Array.from(bytes)), document:await ReadPDF.load(bytes),raw:bytes.toString("latin1")};
}
test('reference invoice keeps A4, Helvetica and the supplied logo and signature',async t=>{
 const images=[]; const result=await render(t,invoice(),images);
 assert.ok(result.raw.includes("/BaseFont /Helvetica"),"Reference uses Helvetica");
 assert.equal(images.length,2,'Invoices must include the supplied logo and signature');
 assert.equal(path.basename(images[0][0]),'logo.png');
 assert.equal(path.basename(images[1][0]),'signature.jpeg');
 assert.equal(result.document.getPageCount(),1);
 const size=result.document.getPage(0).getSize();
 assert.ok(Math.abs(size.width-595.28)<0.1 && Math.abs(size.height-841.89)<0.1);
 for(const text of ['Invoice','JT/TEST/26-27/01','Alias Candidate','Bank Details','Note :-','SAC Code:-998512','IGST@18%','1,42,526','One Lakh Forty Two Thousand Five Hundred and Twenty Six Only']) assert.ok(result.parsed.text.includes(text),text);
});
test('the reference format retains existing split-GST rounding for Karnataka',async t=>{
 const result=await render(t,invoice('Karnataka'),[]);
 for(const text of ['CGST@9%','SGST@9%','10,871','1,42,527']) assert.ok(result.parsed.text.includes(text),text);
 assert.ok(!result.parsed.text.includes('IGST@18%'));
});
