"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function EmployeePayroll() {
  const [currentUser, setCurrentUser] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      const session = apiClient.getCurrentSession();
      console.log("[PAYROLL DIAGNOSTIC] Current Session:", session);
      if (session) {
        setCurrentUser(session);
        // Simulator check: If Admin is viewing employee portal for testing, show default employee stubs
        const emailToQuery = session.role === "Admin" ? "employee@hraconnect.com" : session.email;
        const data = await apiClient.getPayrolls(emailToQuery);
        console.log("[PAYROLL DIAGNOSTIC] Loaded Payslips for:", emailToQuery, data);
        setPayslips(data);
      } else {
        console.warn("[PAYROLL DIAGNOSTIC] No active session found!");
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleDownload = (id) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      setSuccessMsg(`Payslip HRA-SLIP-${id}.pdf has been saved to your downloads.`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    }, 1500);
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return "0.00";
    // Strip everything except numbers and dots (e.g. removes "₹", ",", etc.)
    const cleanVal = String(val).replace(/[^\d.]/g, "");
    const num = Number(cleanVal);
    return isNaN(num) ? "0.00" : num.toLocaleString("en-IN");
  };

  const latestSlip = payslips[0];
  const netPayStr = latestSlip ? `₹${formatCurrency(latestSlip.net)}` : "₹72,500.00";
  const deductionsStr = latestSlip ? `₹${formatCurrency(latestSlip.deductions)}` : "₹12,500.00";
  
  const rawDeductions = latestSlip ? Number(String(latestSlip.deductions).replace(/[^\d.]/g, "")) : 12500;
  const pfStr = `₹${formatCurrency(Math.round(rawDeductions * 0.54))}`;
  const tdsStr = `₹${formatCurrency(Math.round(rawDeductions * 0.46))}`;
  const dateStr = latestSlip ? new Date(latestSlip.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "May 30, 2026";

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Salary & Compensation Console</h1>
        <p className="text-xs text-slate-500">Access your monthly itemized payslips, view taxes/deductions audits, and manage primary disbursement routes.</p>
      </div>

      {/* Download Alert Notification */}
      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-sm max-w-2xl">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Salary Card */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start z-10">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">Net Take-Home Pay</span>
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-200 text-[10px] font-bold">Current Cycle</span>
          </div>
          <div className="mt-8 z-10">
            <span className="text-3xl font-extrabold tracking-tight">{netPayStr}</span>
            <span className="block text-[10px] text-indigo-300 font-medium mt-1">Disbursed on {dateStr}</span>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 z-0">
            <CreditCard className="w-36 h-36" />
          </div>
        </div>

        {/* Deductions Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deductions (Tax & PF)</span>
            <span className="p-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3" />
              <span>14.7%</span>
            </span>
          </div>
          <div className="mt-8">
            <span className="text-2xl font-bold text-slate-950">{deductionsStr}</span>
            <span className="block text-[10px] text-slate-400 font-semibold mt-1">{pfStr} PF contribution + {tdsStr} TDS</span>
          </div>
        </div>

        {/* Annual CTC Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Fixed Compensation</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>CTC</span>
            </span>
          </div>
          <div className="mt-8">
            <span className="text-2xl font-bold text-slate-950">₹10.2 Lakhs</span>
            <span className="block text-[10px] text-slate-400 font-semibold mt-1">Standard corporate bracket (L3 Grade)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Payslips Table List (8 Columns) */}
        <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40">
            <h3 className="font-bold text-slate-900 text-sm">Published Payslips</h3>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {payslips.map((slip) => (
              <div key={slip.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950 text-xs">Payslip — {slip.id}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wide">₹{formatCurrency(slip.net)} Net Pay</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    Cycle period: {slip.period}
                  </span>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleDownload(slip.id)}
                    disabled={downloadingId === slip.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-extrabold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer transition-all shadow-sm"
                  >
                    {downloadingId === slip.id ? (
                      <>
                        <div className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-slate-800 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banking Route & Tax Info (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col gap-6 text-left">
          {/* Disbursement Route */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-950">
              <Building className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider">Disbursement Account</h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">HDFC Bank Limited</span>
              <span className="text-xs font-bold text-slate-900 leading-none">Savings A/C: •••• 8902</span>
              <span className="text-[9px] font-semibold text-slate-400">Primary Salary Disbursement Account</span>
              <div className="mt-1 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded border border-emerald-100">
                <span>Verified Direct-Deposit</span>
              </div>
            </div>
            
            <p className="text-[10px] leading-relaxed text-slate-400 font-semibold">To alter banking details or routing structures, please contact the HR operations team through the administrative verifications module.</p>
          </div>

          {/* Tax documents block */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-3">
            <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Tax & Audit Documents</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Form 16 Tax returns certificate and annual declarations for fiscal year 2025-2026 are ready for verification and audit clearances.</p>
            <button className="w-full mt-1 flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer">
              <span>Inspect Tax Form 16</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
