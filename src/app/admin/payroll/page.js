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
  Search,
  Eye,
  Edit3,
  Download,
  Printer,
  History,
  FileText,
  Filter,
  Trash2
} from "lucide-react";

import { apiClient } from "@/lib/apiClient";
import PayslipViewModal from "@/components/Common/PayslipViewModal";
import { printOrDownloadPayslip } from "@/lib/payslipGenerator";

export default function AdminPayroll() {
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab: "publish" | "history"
  const [activeTab, setActiveTab] = useState("publish");
  const [historySearch, setHistorySearch] = useState("");

  // Form states - Employee Info & Details
  const [selectedEmail, setSelectedEmail] = useState("");
  const [department, setDepartment] = useState("Software Development");
  const [period, setPeriod] = useState("June 1 - June 30, 2026");

  const [band, setBand] = useState("H1");
  const [location, setLocation] = useState("Hyderabad, Madhapur");
  const [daysWorked, setDaysWorked] = useState("30");
  const [uanNumber, setUanNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");

  // Earnings manual inputs
  const [basic, setBasic] = useState("");
  const [hra, setHra] = useState("");
  const [medical, setMedical] = useState("");
  const [incentives, setIncentives] = useState("");
  const [performancePay, setPerformancePay] = useState("");
  const [bonus, setBonus] = useState("");

  // Deductions manual inputs
  const [pf, setPf] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [lop, setLop] = useState("");
  const [employeeSavings, setEmployeeSavings] = useState("");
  const [adminTax, setAdminTax] = useState("");

  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [showBankModal, setShowBankModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal view/edit states
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const allUsers = await apiClient.getUsers();
        const staff = allUsers.filter(u => ["Employee", "Intern", "Manager", "HR", "Admin"].includes(u.role));
        setEmployees(staff);
        if (staff.length > 0) {
          const defaultEmp = staff.find(u => u.role === "Employee") || staff[0];
          setSelectedEmail(defaultEmp.email);
          if (defaultEmp.uanNumber) setUanNumber(defaultEmp.uanNumber);
          if (defaultEmp.panNumber) setPanNumber(defaultEmp.panNumber);
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

  // Sync employee defaults when selected employee changes
  useEffect(() => {
    if (selectedEmail && employees.length > 0) {
      const emp = employees.find(e => e.email === selectedEmail);
      if (emp) {
        setUanNumber(emp.uanNumber || "");
        setPanNumber(emp.panCard || emp.panNumber || "");
        if (emp.department) setDepartment(emp.department);
      }
    }
  }, [selectedEmail, employees]);

  // Real-time Earnings math
  const basicVal = Number(basic) || 0;
  const hraVal = Number(hra) || 0;
  const medicalVal = Number(medical) || 0;
  const incentivesVal = Number(incentives) || 0;
  const performancePayVal = Number(performancePay) || 0;
  const bonusVal = Number(bonus) || 0;

  const grossVal = basicVal + hraVal + medicalVal + incentivesVal + performancePayVal + bonusVal;

  // Real-time Deductions math
  const pfVal = Number(pf) || 0;
  const healthInsuranceVal = Number(healthInsurance) || 0;
  const lopVal = Number(lop) || 0;
  const employeeSavingsVal = Number(employeeSavings) || 0;
  const adminTaxVal = Number(adminTax) || 0;

  const deductionsVal = pfVal + healthInsuranceVal + lopVal + employeeSavingsVal + adminTaxVal;
  const calculatedNet = grossVal - deductionsVal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmail || !period || grossVal <= 0) return;

    const matchedEmp = employees.find(emp => emp.email === selectedEmail);
    const empName = matchedEmp ? matchedEmp.name : "Staff Member";

    const payrollPayload = {
      userEmail: selectedEmail,
      userName: empName,
      employeeId: matchedEmp?.employeeId || "EMP-2026",
      designation: matchedEmp?.designation || matchedEmp?.role || "Employee",
      department: department || matchedEmp?.department || "Software Development",

      band,
      location,
      dateOfJoining: matchedEmp?.dateOfJoining || matchedEmp?.dob || "01/01/2024",
      daysWorked: Number(daysWorked) || 30,
      period,
      uanNumber,
      panNumber,
      bankName: matchedEmp?.bankName || "",
      accountNumber: matchedEmp?.bankAccountNumber || "",
      ifscCode: matchedEmp?.bankIfscCode || "",

      basic: basicVal,
      hra: hraVal,
      medical: medicalVal,
      incentives: incentivesVal,
      performancePay: performancePayVal,
      bonus: bonusVal,
      gross: grossVal,

      pf: pfVal,
      healthInsurance: healthInsuranceVal,
      lop: lopVal,
      employeeSavings: employeeSavingsVal,
      adminTax: adminTaxVal,
      professionalTax: adminTaxVal,
      deductions: deductionsVal,

      net: calculatedNet,
      netPayable: calculatedNet
    };

    const res = await apiClient.createPayroll(payrollPayload);
    if (res.success) {
      if (panNumber && matchedEmp) {
        const empId = matchedEmp.id || matchedEmp._id;
        if (empId) {
          apiClient.updateUserBankInfo(empId, { panCard: panNumber, panNumber });
        }
      }
      setPayrolls(prev => [res.payroll, ...prev]);
      setSuccessMsg(`Payroll slip published successfully for ${empName}!`);
      setSuccess(true);


      // Reset numerical inputs
      setBasic("");
      setHra("");
      setMedical("");
      setIncentives("");
      setPerformancePay("");
      setBonus("");
      setPf("");
      setHealthInsurance("");
      setLop("");
      setEmployeeSavings("");
      setAdminTax("");

      setTimeout(() => setSuccess(false), 3000);
    }
  };

  const handleModalUpdate = (updatedPayroll) => {
    setPayrolls(prev => prev.map(p => (p.id === updatedPayroll.id || p._id === updatedPayroll.id) ? updatedPayroll : p));
  };

  const handleDeletePayroll = async (id, userName) => {
    if (confirm(`Are you sure you want to delete the payslip record for ${userName}?`)) {
      const targetId = id || "";
      const res = await apiClient.deletePayroll(targetId);
      if (res.success) {
        setPayrolls(prev => prev.filter(p => p.id !== targetId && p._id !== targetId));
        setSuccessMsg(`Payslip record for ${userName} deleted successfully.`);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    }
  };


  // Metrics calculations
  const totalDisbursed = payrolls.reduce((sum, item) => sum + Number(item.net || 0), 0);
  const paidStaffCount = new Set(payrolls.map(p => p.userEmail)).size;
  const averageNet = payrolls.length > 0 ? Math.round(totalDisbursed / payrolls.length) : 0;

  // Filter history records
  const filteredHistory = payrolls.filter(p =>
    p.userName?.toLowerCase().includes(historySearch.toLowerCase()) ||
    p.userEmail?.toLowerCase().includes(historySearch.toLowerCase()) ||
    p.period?.toLowerCase().includes(historySearch.toLowerCase()) ||
    (p.band && p.band.toLowerCase().includes(historySearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Administrative Payroll Console</h1>
          <p className="text-xs text-slate-500">Calculate, verify, publish, and audit active payroll records & historic payslips for organization staff.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab(activeTab === "publish" ? "history" : "publish")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-sm cursor-pointer ${
              activeTab === "history"
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>{activeTab === "publish" ? "Payslip History" : "Publish New Slip"}</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
              {payrolls.length}
            </span>
          </button>

          <button
            onClick={() => setShowBankModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Bank Directory</span>
          </button>
        </div>
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

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("publish")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "publish"
              ? "bg-slate-950 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Publish New Salary Slip</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-slate-950 text-white shadow-md"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <History className="w-4 h-4 text-indigo-400" />
          <span>Payslip History (Disbursed Ledger Stubs)</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
            {payrolls.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === "publish" ? (
        /* Full Width Publish New Salary Slip Form */
        <div className="w-full bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col gap-8 text-left">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-slate-950 text-base">Publish New Salary Slip</h3>
              <p className="text-xs text-slate-500 mt-0.5">Specify employee parameters, manual entry earnings, and manual entry deductions for instant ledger posting.</p>
            </div>
            <button
              onClick={() => setActiveTab("history")}
              className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer"
            >
              <History className="w-4 h-4" />
              <span>View Disbursed History ({payrolls.length})</span>
            </button>
          </div>

          {success && (
            <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* 1. Employee Selection & Setup */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">1. Employee Selection & Profile Setup</span>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Select Employee Account</label>
                  <select
                    value={selectedEmail}
                    onChange={e => setSelectedEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 font-bold focus:outline-none focus:border-indigo-600 shadow-sm"
                  >
                    {employees.map(emp => (
                      <option key={emp.id || emp._id} value={emp.email}>
                        {emp.name} ({emp.role} — {emp.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Band (Editable)</label>
                  <select
                    value={band}
                    onChange={e => setBand(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-xs bg-indigo-50/60 text-indigo-950 font-bold focus:outline-none focus:border-indigo-600 shadow-sm"
                  >
                    <option value="H1">H1 Band</option>
                    <option value="H2">H2 Band</option>
                    <option value="H3">H3 Band</option>
                  </select>
                </div>
              </div>

              {/* Selected Employee Profile & Bank Details Card */}
              {(() => {
                const selectedEmployee = employees.find(emp => emp.email === selectedEmail);
                if (!selectedEmployee) return null;
                return (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Employee Profile & Direct Deposit Details</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase">
                        Verified Profile
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 text-xs items-start">
                      <div className="flex flex-col justify-start">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase mb-1">Employee ID</span>
                        <span className="font-bold text-slate-900 leading-tight py-1">{selectedEmployee.employeeId || "EMP-2026"}</span>
                      </div>
                      <div className="flex flex-col justify-start">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase mb-1">Employee Name</span>
                        <span className="font-bold text-slate-900 leading-tight py-1">{selectedEmployee.name}</span>
                      </div>
                      <div className="flex flex-col justify-start">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase mb-1">Designation / Role</span>
                        <span className="font-bold text-slate-900 leading-tight py-1">{selectedEmployee.designation || selectedEmployee.role || "Employee"}</span>
                      </div>
                      <div className="flex flex-col justify-start">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase mb-1">Department</span>
                        <select
                          value={department}
                          onChange={e => setDepartment(e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-900 bg-indigo-50/50 focus:outline-none focus:border-indigo-600 cursor-pointer"
                        >
                          <option value="Software Development">Software Development</option>
                          <option value="Digital Marketing">Digital Marketing</option>
                          <option value="Human Resources (HR)">Human Resources (HR)</option>
                          <option value="Business Development">Business Development</option>
                          <option value="Soft Skills & Communication Training">Soft Skills & Communication Training</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-start">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase mb-1">PAN Number</span>
                        <span className="font-bold text-indigo-900 leading-tight py-1">{panNumber || selectedEmployee.panCard || selectedEmployee.panNumber || "N/A"}</span>
                      </div>

                      <div className="flex flex-col justify-start">
                        <span className="text-slate-400 font-semibold block text-[9px] uppercase mb-1">Bank Details</span>
                        {selectedEmployee.bankName ? (
                          <div className="flex flex-col leading-tight py-0.5">
                            <span className="font-bold text-indigo-700">{selectedEmployee.bankName}</span>
                            <span className="text-[10px] text-slate-700 font-bold">A/C: {selectedEmployee.bankAccountNumber || "N/A"}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">IFSC: {selectedEmployee.bankIfscCode || "N/A"}</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-bold italic text-[10px] py-1">No bank account submitted</span>
                        )}
                      </div>
                    </div>


                  </div>
                );
              })()}


              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">No. of Days Worked</label>
                  <input
                    type="number"
                    value={daysWorked}
                    onChange={e => setDaysWorked(e.target.value)}
                    placeholder="30"
                    className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">UAN Number</label>
                  <input
                    type="text"
                    value={uanNumber}
                    onChange={e => setUanNumber(e.target.value)}
                    placeholder="e.g. UAN-1009283"
                    className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">PAN Number</label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={e => setPanNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600 uppercase"
                  />
                </div>


                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pay Period</label>
                  <input
                    required
                    type="text"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    placeholder="e.g. June 1 - June 30, 2026"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Manual Entry Earnings */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">2. Earnings Components (Manual Entry — Will Not Auto-Overwrite)</span>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100">
                  Gross Earnings: ₹{grossVal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Basic Salary (₹)</label>
                  <input
                    required
                    type="number"
                    value={basic}
                    onChange={e => setBasic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">House Rent Allowance (HRA) (₹)</label>
                  <input
                    required
                    type="number"
                    value={hra}
                    onChange={e => setHra(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Medical Allowance (₹)</label>
                  <input
                    type="number"
                    value={medical}
                    onChange={e => setMedical(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-700 uppercase">Incentives (Manual Entry) (₹)</label>
                  <input
                    type="number"
                    value={incentives}
                    onChange={e => setIncentives(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-700 uppercase">Performance Pay (Manual Entry) (₹)</label>
                  <input
                    type="number"
                    value={performancePay}
                    onChange={e => setPerformancePay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-700 uppercase">Bonus (Manual Entry) (₹)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={e => setBonus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Manual Entry Deductions */}
            <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">3. Deductions Components (Manual Entry)</span>
                <span className="text-xs font-black text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-100">
                  Total Deductions: ₹{deductionsVal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Provident Fund (PF) (₹)</label>
                  <input
                    type="number"
                    value={pf}
                    onChange={e => setPf(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-rose-700 uppercase">Health Insurance Premium (Manual Entry) (₹)</label>
                  <input
                    type="number"
                    value={healthInsurance}
                    onChange={e => setHealthInsurance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-rose-700 uppercase">LOP (No of Days) (Manual Entry) (₹)</label>
                  <input

                    type="number"
                    value={lop}
                    onChange={e => setLop(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-rose-700 uppercase">Employee Savings (Manual Entry) (₹)</label>
                  <input
                    type="number"
                    value={employeeSavings}
                    onChange={e => setEmployeeSavings(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700 uppercase">Admin Tax (₹)</label>
                  <input
                    type="number"
                    value={adminTax}
                    onChange={e => setAdminTax(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

            </div>

            {/* Calculated Net Preview */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Net Take-Home Salary</span>
                <span className="text-3xl font-black text-emerald-400">₹{calculatedNet.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  View History ({payrolls.length})
                </button>

                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Payroll Slip</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      ) : (
        /* Full Width Payslip History Section (Disbursed Ledger Stubs) */
        <div className="w-full bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col text-left">
          
          {/* Section Bar */}
          <div className="border-b border-slate-200/80 px-6 py-5 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-950 text-base">Disbursed Ledger Stubs (Payslip History)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Audit, view detailed records, edit authorized fields, or print historic payslips.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Filter history by name, email, period, band..."
                  className="pl-9 pr-4 py-2 w-72 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-sm"
                />
              </div>

              <button
                onClick={() => setActiveTab("publish")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Publish New Slip</span>
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="divide-y divide-slate-100 flex-1 min-h-[400px]">
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 italic text-xs font-semibold">
                No historic payslip records found matching your search.
              </div>
            ) : (
              filteredHistory.map((payroll) => (
                <div key={payroll.id || payroll._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-950 text-sm">{payroll.userName}</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                        {payroll.band || "H1"} Band
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{payroll.userEmail}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium mt-0.5">
                      <span>Pay Period: <strong className="text-slate-800 font-bold">{payroll.period}</strong></span>
                      <span>Days Worked: <strong className="text-slate-800 font-bold">{payroll.daysWorked || 30}</strong></span>
                      <span>Gross: <strong className="text-emerald-700 font-bold">₹{Number(payroll.gross || payroll.basic || 0).toLocaleString("en-IN")}</strong></span>
                      <span>Deductions: <strong className="text-rose-700 font-bold">₹{Number(payroll.deductions || 0).toLocaleString("en-IN")}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <div className="flex flex-col items-end mr-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Net Salary Take-Home</span>
                      <span className="font-black text-xs text-slate-950">₹{Number(payroll.net || 0).toLocaleString("en-IN")}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedSlip(payroll);
                        setIsModalOpen(true);
                      }}
                      className="py-1 px-2 rounded-[8px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-slate-200/60 shadow-2xs"
                      title="View Payslip"
                    >
                      <Eye className="w-3 h-3 text-indigo-600" />
                      <span>View</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedSlip(payroll);
                        setIsModalOpen(true);
                      }}
                      className="py-1 px-2 rounded-[8px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-indigo-100 shadow-2xs"
                      title="Edit Payslip"
                    >
                      <Edit3 className="w-3 h-3 text-indigo-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => printOrDownloadPayslip(payroll, {}, 'pdf')}
                      className="py-1 px-2 rounded-[8px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-emerald-100 shadow-2xs"
                      title="Download PDF"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => printOrDownloadPayslip(payroll, {}, 'print')}
                      className="py-1 px-2 rounded-[8px] bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      title="Print Payslip"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={() => handleDeletePayroll(payroll.id || payroll._id, payroll.userName)}
                      className="p-1.5 rounded-[8px] bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all border border-rose-100 shadow-2xs cursor-pointer flex items-center justify-center"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    </button>

                  </div>

                </div>

              ))
            )}
          </div>

        </div>
      )}

      {/* Payslip Detailed View / Edit Modal */}
      <PayslipViewModal
        slip={selectedSlip}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlip(null);
        }}
        onUpdateSuccess={handleModalUpdate}
        canEdit={true}
      />

      {/* Employee Bank Directory Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white rounded-[2rem] p-8 shadow-2xl overflow-hidden text-left border border-slate-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Employee Bank Directory</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Registered direct deposit accounts for staff members.</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search by name, email..."
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
                    <th className="py-3 px-4">PAN Number</th>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">IFSC Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/60 text-xs font-semibold text-slate-800">
                  {employees
                    .filter(emp =>
                      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(emp => (
                      <tr key={emp.id || emp._id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs">{emp.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{emp.email}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-100">
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-indigo-900 uppercase">
                          {emp.panCard || emp.panNumber || <span className="text-slate-300 font-normal italic">Unsubmitted</span>}
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
                      </tr>

                    ))}
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
