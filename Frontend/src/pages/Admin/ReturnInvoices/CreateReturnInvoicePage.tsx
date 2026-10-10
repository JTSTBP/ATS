import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, DownloadCloud, Search, Calendar, FileText, Upload, Trash2 } from "lucide-react";
import { useAuth } from "../../../context/AuthProvider";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { formatDate } from "../../utils/dateUtils";

/**
 * Component to preview the return invoice details in real-time.
 * It receives the current form data and resolves related display names.
 */
function InvoicePreview({ formData, clients, candidates }) {
  const client = clients.find(c => c._id === formData.client);
  const clientName = client ? client.companyName : "-";
  const selectedCandidates = candidates.filter(c => formData.candidateIds.includes(c._id));
  const candidateNames = selectedCandidates.map(c => c.dynamicFields.Name || c.dynamicFields.candidateName || "Unknown").join(", ");
  const clientAddress = client ? client.companyInfo || "[Client Address]" : "-";
  const gstNumber = client ? client.gstNumber || "-" : "-";

  // Helper to convert number to words (simplified)
  const numberToWords = (num) => {
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const g = ["", "Thousand", "Million", "Billion", "Trillion"];
    if (num === 0) return "Zero";
    let grp = 0;
    let str = "";
    while (num > 0) {
      const n = num % 1000;
      if (n !== 0) {
        let s = "";
        if (n % 100 < 20) {
          s = a[n % 100];
        } else {
          s = b[Math.floor((n % 100) / 10)] + (n % 10 ? " " + a[n % 10] : "");
        }
        if (Math.floor(n / 100)) {
          s = a[Math.floor(n / 100)] + " Hundred " + s;
        }
        str = s + (g[grp] ? " " + g[grp] + " " : "") + str;
      }
      num = Math.floor(num / 1000);
      grp++;
    }
    return str.trim();
  };

  const totalAmount = Number(formData.amount) || 0;
  const amountInWords = numberToWords(totalAmount);

  return (
    <div className="bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden min-h-[800px] flex flex-col">
  <div className="bg-slate-800 p-3 text-white flex justify-between items-center text-xs font-bold uppercase tracking-widest">
    <span>Live Invoice Preview</span>
    {/* Placeholder for download button if needed */}
  </div>
  <div className="p-8 flex-1 flex flex-col text-[11px] leading-tight text-slate-800 font-sans bg-white overflow-y-auto">
    {/* Header */}
    <div className="flex justify-between items-start mb-4">
      <img src="/src/images/logo.png" alt="Logo" className="w-32" />
    </div>
    {/* Boxed Header Info */}
    <div className="border border-slate-400 mb-6">
      {/* Invoice Title Bar */}
      <div className="border-b border-slate-400 py-1 bg-slate-50 text-center">
        <span className="font-bold text-sm uppercase tracking-wider">Invoice</span>
      </div>
      {/* Client and Invoice Details */}
      <div className="flex min-h-[80px]">
        {/* Left: To Address */}
        <div className="w-[60%] border-r border-slate-400 p-2">
          <p className="font-bold mb-1">To,</p>
          <p className="font-bold text-[12px] mb-1">
            {clients.find(c => c._id === formData.client)?.companyName || "[Client Name]"}
          </p>
          <div className="text-slate-600 leading-snug max-w-[250px]">
            {(() => {
              const client = clients.find(c => c._id === formData.client);
              if (!client) return "Select a client to view address...";
              const addressParts = [];
              if (client.companyInfo) addressParts.push(client.companyInfo);
              if (client.billingAddress) addressParts.push(client.billingAddress);
              if (client.billingState) addressParts.push(client.billingState);
              return addressParts.join(', ');
            })()}
          </div>
          <div className="mt-2 font-bold text-[10px]">
            {(() => {
              const client = clients.find(c => c._id === formData.client);
              const gst = formData.gstNumber || client?.gstNumber;
              return gst ? <span>GST No: {gst}</span> : null;
            })()}
          </div>
        </div>
        {/* Middle: Spacer */}
        <div className="w-[10%] border-r border-slate-400"></div>
        {/* Right: Invoice Details */}
        <div className="w-[30%]">
          <div className="p-2 border-b border-slate-400 h-1/3 flex items-center">
            <span className="font-bold">Invoice No. {formData.invoiceNumber || "JT/RO/25-26/XXXX"}</span>
          </div>
          <div className="p-2 border-b border-slate-400 h-1/3 flex items-center">
            <span>Date :- {new Date(formData.invoiceDate || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')}</span>
          </div>
          <div className="p-2 h-1/3 flex items-center">
            <span className="font-bold">SAC Code:-998512</span>
          </div>
        </div>
      </div>
    </div>
    {/* Grid Table */}
    <div className="border border-slate-400 mb-6">
      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="bg-slate-50 font-bold border-b border-slate-400 text-center">
            <td className="py-1 px-1 border-r border-slate-400 w-8">Sr. No.</td>
            <td className="py-1 px-1 border-r border-slate-400">Name Of the Candidate</td>
            <td className="py-1 px-1 border-r border-slate-400 w-16">D.O.J</td>
            <td className="py-1 px-1 border-r border-slate-400 w-24">Designation</td>
            <td className="py-1 px-1 border-r border-slate-400 w-16">CTC</td>
            <td className="py-1 px-1 w-16">Amount</td>
          </tr>
        </thead>
        <tbody>
           {formData.candidateIds.map((candId, i) => {
               const row = formData.candidates.find(r => r.candidateId === candId) || {};
               return (
                 <tr key={i} className="border-b border-slate-400 text-center">
                   <td className="py-2 px-1 border-r border-slate-400">{i + 1}</td>
                   <td className="py-2 px-1 border-r border-slate-400 font-bold">
                     {candidates.find(c => c._id === row.candidateId)?.dynamicFields?.candidateName ||
                      candidates.find(c => c._id === row.candidateId)?.dynamicFields?.Name ||
                      "[Candidate Name]"}
                   </td>
                   <td className="py-2 px-1 border-r border-slate-400">
                     {row.doj ? new Date(row.doj).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "-"}
                   </td>
                   <td className="py-2 px-1 border-r border-slate-400 text-[9px]">{row.designation || "-"}</td>
                   <td className="py-2 px-1 border-r border-slate-400">{row.ctc ? Number(row.ctc).toLocaleString() : "0"}</td>
                   <td className="py-2 px-1">{Number(formData.amount || 0).toLocaleString()}</td>
                 </tr>
               );
             })}
          {/* Totals */}
          {(() => {
            const isKarnataka = (clients.find(c => c._id === formData.client)?.billingState || '').toLowerCase() === 'karnataka';
            const total = Number(formData.amount) || 0;
            const rowStyle = "border-b border-slate-400 font-bold text-center bg-slate-50/30";
            const labelCell = "py-1 px-1 border-r border-slate-400";
            const valCell = "py-1 px-1";
            if (isKarnataka) {
              const halfTax = Math.round(total * 0.09);
              return (
                  <>
                  <tr className={rowStyle}>
                    <td colSpan={4} className={labelCell}>Total</td>
                    <td colSpan={2} className={valCell}>{total.toLocaleString()}</td>
                  </tr>
                  <tr className={rowStyle}>
                    <td colSpan={4} className={labelCell}>CGST@9%</td>
                    <td colSpan={2} className={valCell}>{halfTax.toLocaleString()}</td>
                  </tr>
                  <tr className={rowStyle}>
                    <td colSpan={4} className={labelCell}>SGST@9%</td>
                    <td colSpan={2} className={valCell}>{halfTax.toLocaleString()}</td>
                  </tr>
                  <tr className="font-bold text-center bg-slate-100">
                    <td colSpan={4} className={labelCell}>Grand Total</td>
                    <td colSpan={2} className={valCell}>{(total + halfTax * 2).toLocaleString()}</td>
                  </tr>
</>
              );
            }
            const tax = Math.round(total * 0.18);
            return (
              <>
                <tr className={rowStyle}>
                  <td colSpan={4} className={labelCell}>Total</td>
                  <td colSpan={2} className={valCell}>{total.toLocaleString()}</td>
                </tr>
                <tr className={rowStyle}>
                  <td colSpan={4} className={labelCell}>IGST@18%</td>
                  <td colSpan={2} className={valCell}>{tax.toLocaleString()}</td>
                </tr>
                <tr className="font-bold text-center bg-slate-100">
                  <td colSpan={4} className={labelCell}>Grand Total</td>
                  <td colSpan={2} className={valCell}>{(total + tax).toLocaleString()}</td>
                </tr>
              </>
            );
          })()}
        </tbody>
      </table>
    </div>
          {/* Amount in words */}
          <p className="mb-4 font-medium text-[10px]">
            Amount in words- {(() => {
              // Calculate total based on number of selected candidates and the overall amount
              const candidateCount = formData.candidateIds.length;
              const total = formData.amount ? Number(formData.amount) * candidateCount : 0;
              const isKarnataka = (clients.find(c => c._id === formData.client)?.billingState || '').toLowerCase() === 'karnataka';
              const grandTotal = isKarnataka ? total + Math.round(total * 0.09) * 2 : Math.round(total * 1.18);
              return numberToWords(grandTotal);
            })()}.
          </p>
    {/* Bank Details & Signature */}
    <div className="mt-2 flex justify-between items-start">
      <div className="space-y-3">
        <div><p className="font-bold underline mb-1">Bank Details</p>
          <div className="space-y-0.5 text-[9px]">
            <div className="flex gap-4"><span className="w-20 font-semibold">Name</span><span>: Jobs Territory</span></div>
            <div className="flex gap-4"><span className="w-20 font-semibold">Bank Name</span><span>: IDFC Bank</span></div>
            <div className="flex gap-4"><span className="w-20 font-semibold">Account Number</span><span>: 89686116220</span></div>
            <div className="flex gap-4"><span className="w-20 font-semibold">Branch Name</span><span>: Whitefield Branch</span></div>
            <div className="flex gap-4"><span className="w-20 font-semibold">IFSC Code</span><span>: IDFB0080153</span></div>
          </div>
        </div>
        <div className="space-y-0.5 mt-2 text-[9px]"><p><span className="font-semibold">PAN</span> :- AIPPJ6608Q</p><p><span className="font-semibold">GST No</span> :- 29AIPPJ6608Q1ZB</p></div>
      </div>
      <div className="relative pt-4 pr-12 flex flex-col items-center">
        <img src="/src/images/stamp.png" alt="Stamp" className="w-24 h-24 object-contain opacity-80 rotate-6" />
        <p className="mt-[-10px] font-bold text-sm italic text-slate-700">Sarun</p>
      </div>
    </div>
    {/* Note & Footer */}
    <div className="mt-auto">
      <div className="border border-slate-400 p-0.5 mb-2"><span className="font-bold text-[9px]">Note :-</span></div>
      <div className="text-center space-y-0.5 text-[9px]">
        <p className="font-bold">Address: Door No. 108, 1st Floor Brigade Arcade, Whitefield Road, Mahadevapura, Bangalore Karnataka -560048</p>
        <p className="font-bold text-blue-600">www.jobsterritory.com</p>
      </div>
    </div>
  </div>
</div>
  );
}

export const CreateReturnInvoicePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState<Client[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [formData, setFormData] = useState({
      client: "",
      candidateIds: [] as string[],
      candidates: [] as Array<{ candidateId: string; designation: string; doj: string; ctc: string; amount: string }> ,
      amount: "",
      reason: "",
      invoiceNumber: "",
      invoiceDate: new Date().toISOString().split('T')[0],
      sacCode: "998512",
      billingAddress: "",
      billingState: "",
      gstNumber: "",
      returnDate: new Date().toISOString().split('T')[0]
    });
  const [proofFile, setProofFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  // Load clients & candidates
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/clients`);
        if (response.data.success) setClients(response.data.clients);
      } catch (error) {
        console.error("Error fetching clients:", error);
        toast.error("Failed to load clients");
      }
    };
    const fetchCandidates = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/CandidatesJob`);
        if (response.data.success) setCandidates(response.data.candidates);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        toast.error("Failed to load candidates");
      }
    };
    fetchClients();
    fetchCandidates();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name !== "candidate") {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions).map(o => o.value);
    setFormData(prev => ({ ...prev, candidateIds: selected }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setProofFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      toast.error("Please upload a proof document");
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      data.append("client", formData.client);
      data.append("candidate", JSON.stringify(formData.candidateIds));
      data.append("candidates", JSON.stringify(formData.candidates)); // include detailed rows
      data.append("invoiceNumber", formData.invoiceNumber);
      data.append("invoiceDate", formData.invoiceDate);
      data.append("sacCode", formData.sacCode);
      data.append("billingAddress", formData.billingAddress);
      data.append("billingState", formData.billingState);
      data.append("gstNumber", formData.gstNumber);
      data.append("reason", formData.reason);
      data.append("returnDate", formData.returnDate);
      data.append("proofDocument", proofFile);
      data.append("createdBy", user?._id || "");
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/return-invoices/create`, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Return invoice created successfully");
      navigate('/Admin/return-invoices');
    } catch (error) {
      console.error("Error creating return invoice:", error);
      toast.error("Failed to create return invoice");
    } finally {
      setLoading(false);
    }
  };

  // ----- New helper functions for multiple candidates -----
  const addCandidateRow = () => {
    setFormData(prev => ({
      ...prev,
      candidates: [...prev.candidates, { candidateId: "", designation: "", doj: "", ctc: "", amount: "" }],
      // also add placeholder for candidateIds to keep UI in sync
      candidateIds: [...prev.candidateIds, ""]
    }));
  };

  // Remove a candidate row by index
    const removeCandidateRow = (index: number) => {
      console.log(index,"ind")
    setFormData(prev => {
      const newCandidates = [...prev.candidates];
      newCandidates.splice(index, 1);
      const newCandidateIds = [...prev.candidateIds];
      newCandidateIds.splice(index, 1);
      return { ...prev, candidates: newCandidates, candidateIds: newCandidateIds };
    });
  };

  const handleCandidateDetailChange = (index: number, field: string, value: string) => {
    setFormData(prev => {
      const newCand = [...prev.candidates];
      (newCand[index] as any)[field] = value;
      return { ...prev, candidates: newCand };
    });
  };

  return (
    <div className="p-6 flex flex-col lg:flex-row gap-6">
      {/* Left Form */}
      <div className="flex-1 bg-white rounded-xl shadow-sm p-6 border border-slate-200 overflow-y-auto max-h-screen">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Create Return Invoice</h2>
        <form id="return-invoice-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Client *</label>
              <select name="client" required value={formData.client} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50">
                <option value="">Select Client</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.companyName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">GST Number</label>
              <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="e.g., 22AAAAA0000A1Z5" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Billing Address</label>
              <textarea name="billingAddress" value={formData.billingAddress} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" rows={2}
                placeholder="Enter billing address" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Billing State</label>
              <input type="text" name="billingState" value={formData.billingState} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="State" />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <label className="block text-base font-bold text-slate-800">Candidates *</label>
              <button
                type="button"
                onClick={addCandidateRow}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Plus size={16} />
                Add Candidate
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.candidates.map((row, idx) => (
                <div key={idx} className="p-4 sm:p-5 bg-slate-50/50 rounded-2xl border border-slate-200 relative group transition-all hover:border-blue-200 hover:shadow-sm">
                  <button
                    type="button"
                    onClick={() => removeCandidateRow(idx)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    title="Remove candidate"
                  >
                    <Trash2 size={18} />
                  </button>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-10 sm:pr-14">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Candidate</label>
                      <select
                        value={row.candidateId}
                        onChange={e => handleCandidateDetailChange(idx, "candidateId", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      >
                        <option value="">Select Candidate</option>
                        {candidates.map(c => (
                          <option key={c._id} value={c._id}>
                            {c.dynamicFields.Name || c.dynamicFields.candidateName || "Unknown"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Designation</label>
                      <input
                        type="text"
                        placeholder="Designation"
                        value={row.designation}
                        onChange={e => handleCandidateDetailChange(idx, "designation", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">DOJ</label>
                      <input
                        type="date"
                        value={row.doj?.split('T')[0] || ''}
                        onChange={e => handleCandidateDetailChange(idx, "doj", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">CTC</label>
                      <input
                        type="number"
                        placeholder="CTC"
                        value={row.ctc}
                        onChange={e => handleCandidateDetailChange(idx, "ctc", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Amount</label>
                      <input
                        type="number"
                        placeholder="Amt"
                        value={row.amount}
                        onChange={e => handleCandidateDetailChange(idx, "amount", e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white font-semibold text-emerald-700 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Invoice No. *</label>
              <input type="text" name="invoiceNumber" required value={formData.invoiceNumber} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" placeholder="Enter invoice number" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Invoice Date *</label>
              <input type="date" name="invoiceDate" required value={formData.invoiceDate} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">SAC Code</label>
              <input type="text" name="sacCode" value={formData.sacCode} readOnly
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Amount (₹) *</label>
              <input type="number" name="amount" required value={formData.amount} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-bold text-slate-800" placeholder="Enter amount" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Date *</label>
              <input type="date" name="returnDate" required value={formData.returnDate} onChange={handleInputChange}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason / Resignation Details *</label>
            <textarea name="reason" required value={formData.reason} onChange={handleInputChange} rows={3}
              className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 resize-none"
              placeholder="Explain why this amount is being returned..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Proof Document *</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label className="relative cursor-pointer bg-white rounded-md font-bold text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                  </label>
                </div>
                <p className="text-xs text-slate-500">PDF, PNG, JPG up to 10MB</p>
                {proofFile && (
                  <p className="text-sm font-bold text-emerald-600 mt-2">Selected: {proofFile.name}</p>
                )}
              </div>
            </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => navigate('/Admin/return-invoices')}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors">
              Cancel
            </button>

            <button type="submit" disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Save Return Invoice
            </button>
          </div>
        
</form>
      </div>
      {/* Live Preview */}
      <InvoicePreview formData={formData} clients={clients} candidates={candidates} />
    </div>
  );
};

export default CreateReturnInvoicePage;

interface Client {
    _id: string;
    companyName: string;
}

interface Candidate {
    _id: string;
    dynamicFields: {
        Name?: string;
        candidateName?: string;
        [key: string]: any;
    };
}
