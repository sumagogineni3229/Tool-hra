"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Users,
  CheckCircle,
  Calendar,
  DollarSign,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Building,
  Search
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRPayroll() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [selectedEmail, setSelectedEmail] = useState("");
  const [period, setPeriod] = useState("June 1 - June 30, 2026");
  const [basic, setBasic] = useState("");
  const [hra, setHra] = useState("");
  const [allowances, setAllowances] = useState("");
  const [pf, setPf] = useState("");
  const [tds, setTds] = useState("");
  const [professionalTax, setProfessionalTax] = useState("");

  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [showBankModal, setShowBankModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const allUsers = await apiClient.getUsers();
        // Filter roles that should receive payrolls (Employees and Interns)
        const staff = allUsers.filter(u => ["Employee", "Intern"].includes(u.role));
        setEmployees(staff);
        if (staff.length > 0) {
          setSelectedEmail(staff[0].email);
        }

        const allPayrolls = await apiClient.getPayrolls();
        setPayrolls(allPayrolls);
      } catch (err) {
        console.error("Failed to load users or payrolls data:", err);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  // Real-time formula math
  const basicVal = Number(basic) || 0;
  const hraVal = Number(hra) || 0;
  const allowancesVal = Number(allowances) || 0;
  const pfVal = Number(pf) || 0;
  const tdsVal = Number(tds) || 0;
  const professionalTaxVal = Number(professionalTax) || 0;
  const deductionsVal = pfVal + tdsVal + professionalTaxVal;
  const calculatedNet = basicVal + hraVal + allowancesVal - deductionsVal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmail || !period || calculatedNet <= 0) return;

    const matchedEmp = employees.find(emp => emp.email === selectedEmail);
    const empName = matchedEmp ? matchedEmp.name : "Staff Member";

    const payrollPayload = {
      userEmail: selectedEmail,
      userName: empName,
      period,
      basic: basicVal,
      hra: hraVal,
      allowances: allowancesVal,
      pf: pfVal,
      tds: tdsVal,
      professionalTax: professionalTaxVal,
      deductions: deductionsVal,
      net: calculatedNet
    };

    const res = await apiClient.createPayroll(payrollPayload);
    if (res.success) {
      setPayrolls(prev => [res.payroll, ...prev]);
      setSuccessMsg(`Payroll slip published successfully for ${empName}!`);
      setSuccess(true);

      // Reset form options
      setBasic("");
      setHra("");
      setAllowances("");
      setPf("");
      setTds("");
      setProfessionalTax("");
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  // Metrics calculations
  const totalDisbursed = payrolls.reduce((sum, item) => sum + Number(item.net), 0);
  const paidStaffCount = new Set(payrolls.map(p => p.userEmail)).size;
  const averageNet = payrolls.length > 0 ? Math.round(totalDisbursed / payrolls.length) : 0;

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">HR Operations Payroll Console</h1>
          <p className="text-xs text-slate-500">Calculate, verify, and publish active payroll records and monthly direct-deposits for HRA staff members.</p>
        </div>
        <button
          onClick={() => setShowBankModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Employee Bank Accounts</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Disbursed (All-Time)</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>Direct</span>
            </span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-950">₹{totalDisbursed.toLocaleString("en-IN")}</span>
            <span className="block text-[10px] text-slate-400 font-semibold mt-1">Across all historic pay stubs</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Paid Employees</span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">{paidStaffCount} Staff</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-950">{paidStaffCount} Accounts</span>
            <span className="block text-[10px] text-slate-400 font-semibold mt-1">With direct-deposit payroll stubs</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Monthly Net</span>
            <span className="p-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">Calculated</span>
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold text-slate-950">₹{averageNet.toLocaleString("en-IN")}</span>
            <span className="block text-[10px] text-slate-400 font-semibold mt-1">Average net take-home per slip</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* Form panel: 5 Columns */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">Publish New Salary Slip</h3>
            <p className="text-[11px] text-slate-400">Specify employee brackets and submit for instant ledger posting.</p>
          </div>

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Select Employee */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Select Employee Account</label>
              <select
                value={selectedEmail}
                onChange={e => setSelectedEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none cursor-pointer font-bold text-slate-700"
              >
                {employees.map(emp => (
                  <option key={emp.id || emp._id} value={emp.email}>
                    {emp.name} ({emp.role} — {emp.email})
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const selectedEmployee = employees.find(emp => emp.email === selectedEmail);
              return selectedEmployee && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1.5 text-[10px]">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/40">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[8px]">Selected Direct Deposit</span>
                    <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100 uppercase">Verified</span>
                  </div>
                  {selectedEmployee.bankName ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Bank Name</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.bankName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Account Number</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.bankAccountNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">IFSC Code</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.bankIfscCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold block text-[8px] uppercase">Branch</span>
                        <span className="font-bold text-slate-800">{selectedEmployee.bankBranch}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-semibold italic text-[9px]">No bank details provided by this staff member.</span>
                  )}
                </div>
              );
            })()}

            {/* Pay Period */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Pay Period</label>
              <input
                required
                type="text"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="e.g. June 1 - June 30, 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
              />
            </div>

            {/* Financial Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Basic (₹)</label>
                <input
                  required
                  type="number"
                  value={basic}
                  onChange={e => setBasic(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">HRA (₹)</label>
                <input
                  required
                  type="number"
                  value={hra}
                  onChange={e => setHra(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Allowances (₹)</label>
                <input
                  required
                  type="number"
                  value={allowances}
                  onChange={e => setAllowances(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deductions (₹)</label>
                <input
                  disabled
                  type="number"
                  value={deductionsVal}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500 focus:outline-none cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="border-t border-slate-150/50 my-1 pt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Deductions Breakdown</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">PF (₹)</label>
                  <input
                    required
                    type="number"
                    value={pf}
                    onChange={e => setPf(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">TDS (₹)</label>
                  <input
                    required
                    type="number"
                    value={tds}
                    onChange={e => setTds(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850 focus:border-slate-950"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">Admin tax (₹)</label>
                  <input
                    required
                    type="number"
                    value={professionalTax}
                    onChange={e => setProfessionalTax(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-850 focus:border-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Net Preview */}
            <div className="mt-2 p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Calculated Net Pay</span>
                <span className="text-xl font-extrabold text-slate-950">₹{calculatedNet.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-[8px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                Formula Match
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 active:bg-black shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Payroll Slip</span>
            </button>
          </form>
        </div>

        {/* List panel: 7 Columns */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Disbursed Ledger stubs</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Recent Activity</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[580px]">
            {payrolls.map((payroll) => (
              <div key={payroll.id} className="px-6 py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-950 text-xs">{payroll.userName}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{payroll.period}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold mt-1">
                    Basic: ₹{Number(payroll.basic).toLocaleString("en-IN")} — HRA: ₹{Number(payroll.hra).toLocaleString("en-IN")} — Deductions: ₹{Number(payroll.deductions).toLocaleString("en-IN")}
                    {(payroll.pf !== undefined || payroll.tds !== undefined || payroll.professionalTax !== undefined) && (
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Breakdown: PF: ₹{Number(payroll.pf || 0).toLocaleString("en-IN")} | TDS: ₹{Number(payroll.tds || 0).toLocaleString("en-IN")} | Admin tax: ₹{Number(payroll.professionalTax || 0).toLocaleString("en-IN")}
                      </span>
                    )}
                  </span>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className="font-extrabold text-xs text-slate-900">₹{Number(payroll.net).toLocaleString("en-IN")}</span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-100">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Paid</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Employee Bank Directory Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden text-left border border-slate-100">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 blur-[100px] -z-10 rounded-full translate-x-1/2 -translate-y-1/2" />

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Employee Bank Directory</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Registered direct deposit accounts for Employees and Interns.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email, ID..."
                    className="pl-8 pr-4 py-2 w-64 rounded-xl border border-slate-200 text-xs bg-white text-slate-950 focus:outline-none focus:border-indigo-400 transition-all font-semibold"
                  />
                </div>
                <button
                  onClick={() => {
                    setShowBankModal(false);
                    setSearchTerm("");
                  }}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all cursor-pointer font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[450px] border border-slate-200/60 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/60 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">IFSC Code</th>
                    <th className="py-3 px-4">Branch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/60 text-xs font-semibold text-slate-800">
                  {(() => {
                    const filteredEmployees = employees.filter(emp =>
                      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
                    );

                    if (filteredEmployees.length === 0) {
                      return (
                        <tr>
                          <td colSpan="6" className="text-center py-8 text-slate-400 italic">
                            No staff members found matching your search.
                          </td>
                        </tr>
                      );
                    }

                    return filteredEmployees.map(emp => (
                      <tr key={emp.id || emp._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{emp.email}</span>
                            {emp.employeeId && (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 w-fit mt-1">
                                {emp.employeeId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${emp.role === "Employee"
                              ? "bg-rose-50 text-rose-700 border-rose-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {emp.bankName || <span className="text-slate-300 font-normal italic">Unsubmitted</span>}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {emp.bankAccountNumber || <span className="text-slate-300 font-normal italic">Unsubmitted</span>}
                        </td>
                        <td className="py-3.5 px-4 uppercase text-slate-600">
                          {emp.bankIfscCode || <span className="text-slate-300 font-normal italic">Unsubmitted</span>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {emp.bankBranch || <span className="text-slate-300 font-normal italic">Unsubmitted</span>}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowBankModal(false);
                  setSearchTerm("");
                }}
                className="px-5 py-2.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-xs cursor-pointer"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
