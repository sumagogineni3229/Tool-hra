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

  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankUpdating, setBankUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      const session = apiClient.getCurrentSession();
      console.log("[PAYROLL DIAGNOSTIC] Current Session:", session);
      if (session) {
        setCurrentUser(session);
        setBankName(session.bankName || "");
        setBankAccountNumber(session.bankAccountNumber || "");
        setBankIfscCode(session.bankIfscCode || "");
        setBankBranch(session.bankBranch || "");

        // Fetch fresh user data from database/api to get latest bank details
        try {
          const res = await fetch(`/api/users?id=${session.id || session._id}`);
          if (res.ok) {
            const freshUser = await res.json();
            setCurrentUser(freshUser);
            setBankName(freshUser.bankName || "");
            setBankAccountNumber(freshUser.bankAccountNumber || "");
            setBankIfscCode(freshUser.bankIfscCode || "");
            setBankBranch(freshUser.bankBranch || "");
            localStorage.setItem("currentUser", JSON.stringify(freshUser));
          }
        } catch (e) {
          console.warn("Failed to fetch fresh user bank details, using session data.", e);
        }

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

  const generatePayslipPDF = (slip) => {
    const user = currentUser || {
      name: "John Doe",
      email: "employee@hraconnect.com",
      role: "Employee",
      department: "Engineer",
      employeeId: "EMP-2026-0004",
      designation: "Software Engineer"
    };

    const formatNum = (val) => {
      const cleanVal = String(val).replace(/[^\d.]/g, "");
      const num = Number(cleanVal);
      return isNaN(num) ? "0.00" : num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const gross = Number(slip.gross || (slip.net * 1.15));
    const deductions = Number(slip.deductions || (slip.net * 0.15));
    const net = Number(slip.net);

    const basic = gross * 0.50;
    const hra = gross * 0.30;
    const special = gross * 0.15;
    const conveyance = gross * 0.05;

    const pf = deductions * 0.54;
    const tds = deductions * 0.46;

    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) {
      alert("Please allow popups to download/print the salary slip.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payslip - ${slip.period} - ${user.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          * { box-sizing: border-box; }
          @page { size: A4; margin: 0; }
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 20px;
            color: #1e293b;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 11px;
          }
          @media print {
            body { padding: 15mm 20mm; }
            html, body { height: auto; overflow: visible; }
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .company-info {
            text-align: right;
          }
          .company-name {
            font-size: 16px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
            letter-spacing: -0.5px;
          }
          .company-details {
            font-size: 10px;
            color: #64748b;
            line-height: 1.4;
            font-weight: 500;
          }
          .logo {
            height: 40px;
          }
          .title-section {
            text-align: center;
            margin-bottom: 14px;
          }
          .slip-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
          }
          .slip-period {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
            margin-top: 3px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-bottom: 14px;
            font-size: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          .info-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 3px;
          }
          .info-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .info-label {
            font-weight: 600;
            color: #64748b;
          }
          .info-value {
            font-weight: 700;
            color: #0f172a;
          }
          .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 10px;
          }
          .salary-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 10px;
            text-align: left;
          }
          .salary-table th:nth-child(even), .salary-table td:nth-child(even) {
            text-align: right;
          }
          .salary-table td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 500;
          }
          .salary-table tr.total-row td {
            background-color: #f8fafc;
            font-weight: 800;
            border-top: 2px solid #e2e8f0;
            border-bottom: 2px solid #e2e8f0;
            font-size: 11px;
          }
          .net-pay-box {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 14px 18px;
            border-radius: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
          }
          .net-pay-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #94a3b8;
          }
          .net-pay-value {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
          }
          .footer-note {
            text-align: center;
            font-size: 9px;
            color: #94a3b8;
            margin-top: 10px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            font-weight: 500;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 18px;
            padding: 0 20px;
          }
          .sig-box {
            text-align: center;
            font-size: 10px;
            font-weight: 600;
            color: #64748b;
          }
          .sig-line {
            width: 120px;
            border-top: 1px solid #94a3b8;
            margin-bottom: 6px;
            margin-top: 25px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img class="logo" src="/logo.png" alt="Company Logo" onerror="this.src='/logo_transparent.png'" />
          <div class="company-info">
            <div class="company-name">HRA GROUPS PRIVATE LIMITED</div>
            <div class="company-details">
              Madhapur, Hyderabad.<br/>
              contact@hragroups.com | +91 9676272283
            </div>
          </div>
        </div>

        <div class="title-section">
          <h1 class="slip-title">PAYSLIP</h1>
          <div class="slip-period">For the Pay Period of ${slip.period}</div>
        </div>

        <div class="info-grid">
          <div class="info-block">
            <div class="info-row">
              <span class="info-label">Employee ID</span>
              <span class="info-value">${user.employeeId || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Employee Name</span>
              <span class="info-value">${user.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email Address</span>
              <span class="info-value">${user.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Designation / Role</span>
              <span class="info-value">${user.designation || user.role || 'Employee'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Department</span>
              <span class="info-value">${user.department || 'Engineer'}</span>
            </div>
          </div>
          <div class="info-block">
            <div class="info-row">
              <span class="info-label">Bank Name</span>
              <span class="info-value">${bankName || 'HDFC Bank Limited'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Number</span>
              <span class="info-value">${bankAccountNumber || '•••• 8902'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">IFSC Code</span>
              <span class="info-value">${bankIfscCode || 'HDFC0000001'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bank Branch</span>
              <span class="info-value">${bankBranch || 'HQ Main Branch'}</span>
            </div>
          </div>
        </div>

        <table class="salary-table">
          <thead>
            <tr>
              <th>Earnings Description</th>
              <th>Amount (₹)</th>
              <th>Deductions Description</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Basic Salary (50%)</td>
              <td>₹${formatNum(basic)}</td>
              <td>Provident Fund (PF)</td>
              <td>₹${formatNum(pf)}</td>
            </tr>
            <tr>
              <td>House Rent Allowance (HRA)</td>
              <td>₹${formatNum(hra)}</td>
              <td>Income Tax (TDS)</td>
              <td>₹${formatNum(tds)}</td>
            </tr>
            <tr>
              <td>Special Allowance</td>
              <td>₹${formatNum(special)}</td>
              <td>Professional Tax</td>
              <td>₹200.00</td>
            </tr>
            <tr>
              <td>Conveyance Allowance</td>
              <td>₹${formatNum(conveyance)}</td>
              <td>-</td>
              <td>₹0.00</td>
            </tr>
            <tr class="total-row">
              <td>Gross Salary</td>
              <td>₹${formatNum(gross)}</td>
              <td>Total Deductions</td>
              <td>₹${formatNum(deductions + 200)}</td>
            </tr>
          </tbody>
        </table>

        <div class="net-pay-box">
          <div class="net-pay-label">NET SALARY PAYABLE</div>
          <div class="net-pay-value">₹${formatNum(net)}</div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            Employee Signature
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            Authorized Signatory
          </div>
        </div>

        <div class="footer-note">
          This is a system-generated salary slip and does not require a physical stamp or signature.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleBankUpdate = async (e) => {
    e.preventDefault();
    setBankUpdating(true);
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) {
      alert("Session expired. Please log in again.");
      setBankUpdating(false);
      return;
    }

    const res = await apiClient.updateUserBankInfo(userId, {
      bankName,
      bankAccountNumber,
      bankIfscCode,
      bankBranch
    });

    if (res.success) {
      setIsEditingBank(false);
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const playNote = (frequency, startTime, duration) => {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.04);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
          };
          playNote(659.25, audioCtx.currentTime, 0.35);
          playNote(880.00, audioCtx.currentTime + 0.12, 0.45);
        }
      } catch (error) {
        console.warn("Failed to play notification sound:", error);
      }
      setSuccessMsg("Disbursement bank details updated successfully.");
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } else {
      alert(res.message || "Failed to update bank details.");
    }
    setBankUpdating(false);
  };

  const handleDownload = (id) => {
    setDownloadingId(id);
    const slip = payslips.find(s => s.id === id);
    if (slip) {
      generatePayslipPDF(slip);
    }
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
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{bankName || "HDFC Bank Limited"}</span>
              <span className="text-xs font-bold text-slate-900 leading-none">Savings A/C: {bankAccountNumber || "•••• 8902"}</span>
              <span className="text-[9px] font-semibold text-slate-400">Branch: {bankBranch || "HQ Main Branch"} (IFSC: {bankIfscCode || "HDFC0000001"})</span>
              <div className="mt-1 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 w-fit px-1.5 py-0.5 rounded border border-emerald-100">
                <span>Verified Direct-Deposit</span>
              </div>
            </div>
            
            <button 
              onClick={() => setIsEditingBank(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              Edit Bank Details
            </button>
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

      {/* Edit Bank Details Modal */}
      {isEditingBank && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden text-left border border-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Update Bank Account</h3>
              <button
                onClick={() => setIsEditingBank(false)}
                className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBankUpdate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank Limited"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-950 font-bold focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Account Number</label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="e.g. 50100293810293"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-950 font-bold focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">IFSC Code</label>
                <input
                  type="text"
                  required
                  value={bankIfscCode}
                  onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000001"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-950 font-bold focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Branch Name</label>
                <input
                  type="text"
                  required
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="e.g. HQ Main Branch"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-950 font-bold focus:outline-none focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditingBank(false)}
                  className="flex-1 py-3.5 font-bold text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-all text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bankUpdating}
                  className="flex-[2] py-3.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {bankUpdating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
