"use client";

import { useState, useEffect } from "react";
import { Eye, Edit3, Download, Printer, X, CheckCircle, Save, Clock } from "lucide-react";
import { printOrDownloadPayslip } from "@/lib/payslipGenerator";

import { apiClient } from "@/lib/apiClient";

export default function PayslipViewModal({ slip, isOpen, onClose, onUpdateSuccess, canEdit = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (slip) {
      setFormData({
        id: slip.id || slip._id,
        userEmail: slip.userEmail || "",
        userName: slip.userName || "",
        employeeId: slip.employeeId || "",
        designation: slip.designation || "",
        department: slip.department || "",
        band: slip.band || "H1",
        location: slip.location || "Hyderabad, Madhapur",
        dateOfJoining: slip.dateOfJoining || "",
        daysWorked: slip.daysWorked !== undefined ? slip.daysWorked : 30,
        period: slip.period || "",
        uanNumber: slip.uanNumber || "",
        panNumber: slip.panNumber || slip.panCard || "",
        bankName: slip.bankName || "",

        accountNumber: slip.accountNumber || "",
        ifscCode: slip.ifscCode || "",
        // Earnings
        basic: slip.basic || 0,
        hra: slip.hra || 0,
        medical: slip.medical || 0,
        incentives: slip.incentives || slip.allowances || 0,
        performancePay: slip.performancePay || 0,
        bonus: slip.bonus || 0,
        gross: slip.gross || 0,
        // Deductions
        pf: slip.pf || 0,
        healthInsurance: slip.healthInsurance || 0,
        lop: slip.lop || 0,
        employeeSavings: slip.employeeSavings || 0,
        adminTax: slip.adminTax !== undefined ? slip.adminTax : (slip.professionalTax || 0),
        deductions: slip.deductions || 0,
        // Net
        net: slip.net || 0,
        netPayable: slip.netPayable || 0,
      });
      setIsEditing(false);
    }
  }, [slip]);

  if (!isOpen || !slip) return null;

  const handleChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const basicVal = Number(formData.basic || 0);
  const hraVal = Number(formData.hra || 0);
  const medicalVal = Number(formData.medical || 0);
  const incentivesVal = Number(formData.incentives || 0);
  const performancePayVal = Number(formData.performancePay || 0);
  const bonusVal = Number(formData.bonus || 0);

  const calcGross = basicVal + hraVal + medicalVal + incentivesVal + performancePayVal + bonusVal;

  const pfVal = Number(formData.pf || 0);
  const healthInsVal = Number(formData.healthInsurance || 0);
  const lopVal = Number(formData.lop || 0);
  const employeeSavingsVal = Number(formData.employeeSavings || 0);
  const adminTaxVal = Number(formData.adminTax !== undefined ? formData.adminTax : (formData.professionalTax || 0));

  const calcDeductions = pfVal + healthInsVal + lopVal + employeeSavingsVal + adminTaxVal;
  const calcNet = calcGross - calcDeductions;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updatedPayload = {
      ...formData,
      basic: basicVal,
      hra: hraVal,
      medical: medicalVal,
      incentives: incentivesVal,
      performancePay: performancePayVal,
      bonus: bonusVal,
      gross: calcGross,
      pf: pfVal,
      healthInsurance: healthInsVal,
      lop: lopVal,
      employeeSavings: employeeSavingsVal,
      adminTax: adminTaxVal,
      professionalTax: adminTaxVal,
      deductions: calcDeductions,
      net: calcNet,
      netPayable: Number(formData.netPayable) || calcNet,
      daysWorked: Number(formData.daysWorked) || 30
    };

    const res = await apiClient.updatePayroll(updatedPayload);
    setSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      if (onUpdateSuccess) onUpdateSuccess(res.payroll);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditing(false);
      }, 1200);
    }
  };


  const formatNum = (val) => {
    const num = Number(val || 0);
    return isNaN(num) ? '0.00' : num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl my-8 border border-slate-100 text-left">
        
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                {isEditing ? "Edit Salary Payslip" : `Payslip Overview — ${formData.userName}`}
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase border border-indigo-100">
                {formData.band} Band
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Issued: {(() => {
                  const dateVal = slip?.createdAt || slip?.date;
                  if (dateVal) {
                    const d = new Date(dateVal);
                    if (!isNaN(d.getTime())) {
                      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + " at " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
                    }
                    return String(dateVal);
                  }
                  return "June 30, 2026 at 10:00 AM";
                })()}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {formData.period} • {formData.userEmail}
            </p>
          </div>


          <div className="flex items-center gap-2.5 shrink-0">
            {!isEditing && canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Payslip</span>
              </button>
            )}

            {!isEditing && (
              <>
                <button
                  onClick={() => printOrDownloadPayslip(formData, {}, 'print')}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => printOrDownloadPayslip(formData, {}, 'pdf')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View / Edit Content */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Payslip updated successfully!</span>
              </div>
            )}

            {/* Employee Info Editable Fields */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                1. Employee Details & Setup
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={e => handleChange("employeeId", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Employee Name</label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={e => handleChange("userName", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Designation / Role</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={e => handleChange("designation", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => handleChange("department", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase">Band (Editable)</label>
                  <select
                    value={formData.band}
                    onChange={e => handleChange("band", e.target.value)}
                    className="p-2.5 rounded-xl border border-indigo-200 text-slate-900 bg-indigo-50/40 focus:outline-none focus:border-indigo-600 font-bold"
                  >
                    <option value="H1">H1 Band</option>
                    <option value="H2">H2 Band</option>
                    <option value="H3">H3 Band</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => handleChange("location", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Date of Joining</label>
                  <input
                    type="text"
                    value={formData.dateOfJoining}
                    onChange={e => handleChange("dateOfJoining", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase">No. of Days Worked (Manual Entry)</label>
                  <input
                    type="number"
                    value={formData.daysWorked}
                    onChange={e => handleChange("daysWorked", e.target.value)}
                    className="p-2.5 rounded-xl border border-indigo-200 text-slate-900 bg-indigo-50/30 focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-indigo-600 uppercase">UAN Number (Setup/Update)</label>
                  <input
                    type="text"
                    value={formData.uanNumber}
                    onChange={e => handleChange("uanNumber", e.target.value)}
                    className="p-2.5 rounded-xl border border-indigo-200 text-slate-900 bg-indigo-50/30 focus:outline-none focus:border-indigo-600 font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">PAN Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={e => handleChange("panNumber", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={e => handleChange("bankName", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={e => handleChange("accountNumber", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-indigo-600 font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                2. Manual Entry Earnings (₹)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Basic Salary</label>
                  <input
                    type="number"
                    value={formData.basic}
                    onChange={e => handleChange("basic", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">HRA</label>
                  <input
                    type="number"
                    value={formData.hra}
                    onChange={e => handleChange("hra", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Medical Allowance</label>
                  <input
                    type="number"
                    value={formData.medical}
                    onChange={e => handleChange("medical", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-600 uppercase">Incentives (Manual Entry)</label>
                  <input
                    type="number"
                    value={formData.incentives}
                    onChange={e => handleChange("incentives", e.target.value)}
                    className="p-2.5 rounded-xl border border-amber-200 text-slate-900 bg-amber-50/30 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-600 uppercase">Performance Pay (Manual Entry)</label>
                  <input
                    type="number"
                    value={formData.performancePay}
                    onChange={e => handleChange("performancePay", e.target.value)}
                    className="p-2.5 rounded-xl border border-amber-200 text-slate-900 bg-amber-50/30 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-amber-600 uppercase">Bonus (Manual Entry)</label>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={e => handleChange("bonus", e.target.value)}
                    className="p-2.5 rounded-xl border border-amber-200 text-slate-900 bg-amber-50/30 focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Calculated Gross Earnings:</span>
                <span className="text-emerald-700 text-sm">₹{calcGross.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
                3. Manual Entry Deductions (₹)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Provident Fund (PF)</label>
                  <input
                    type="number"
                    value={formData.pf}
                    onChange={e => handleChange("pf", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">Health Insurance Premium (Manual Entry)</label>
                  <input
                    type="number"
                    value={formData.healthInsurance}
                    onChange={e => handleChange("healthInsurance", e.target.value)}
                    className="p-2.5 rounded-xl border border-rose-200 text-slate-900 bg-rose-50/30 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">LOP (No of Days) (Manual Entry)</label>
                  <input

                    type="number"
                    value={formData.lop}
                    onChange={e => handleChange("lop", e.target.value)}
                    className="p-2.5 rounded-xl border border-rose-200 text-slate-900 bg-rose-50/30 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-rose-600 uppercase">Employee Savings (Manual Entry)</label>
                  <input
                    type="number"
                    value={formData.employeeSavings}
                    onChange={e => handleChange("employeeSavings", e.target.value)}
                    className="p-2.5 rounded-xl border border-rose-200 text-slate-900 bg-rose-50/30 focus:outline-none font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">Admin Tax (₹)</label>
                  <input
                    type="number"
                    value={formData.adminTax !== undefined ? formData.adminTax : formData.professionalTax}
                    onChange={e => handleChange("adminTax", e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-900 focus:outline-none font-bold"
                  />
                </div>
              </div>


              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Calculated Total Deductions:</span>
                <span className="text-rose-700 text-sm">₹{calcDeductions.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Final Net Summary */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Final Net Salary Take-Home</span>
                <span className="text-2xl font-black">₹{calcNet.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving..." : "Save Payslip Updates"}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="mt-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2">
            
            {/* Company Logo Header Banner */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="HRA Groups Logo" className="h-10 w-auto object-contain" onError={(e) => { e.target.src = "/logo_transparent.png"; }} />
              </div>
              <div className="text-right">
                <span className="font-black text-xs text-slate-900 block uppercase tracking-tight">HRA GROUPS PRIVATE LIMITED</span>
                <span className="text-[10px] text-slate-500 font-semibold block">Madhapur, Hyderabad - 500081</span>
              </div>
            </div>

            {/* Employee details card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs">

              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Employee ID</span>
                <span className="font-bold text-slate-950">{formData.employeeId || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Days Worked</span>
                <span className="font-bold text-slate-950">{formData.daysWorked || 30} Days</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Employee Name</span>
                <span className="font-bold text-slate-950">{formData.userName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">UAN Number</span>
                <span className="font-bold text-slate-950">{formData.uanNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Designation / Role</span>
                <span className="font-bold text-slate-950">{formData.designation || "Employee"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">PAN Number</span>
                <span className="font-bold text-slate-950">{formData.panNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-bold text-slate-950">{formData.department || "Operations"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Bank Name</span>
                <span className="font-bold text-slate-950">{formData.bankName || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Band</span>
                <span className="font-black text-indigo-600">{formData.band}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Account Number</span>
                <span className="font-bold text-slate-950">{formData.accountNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">Location</span>
                <span className="font-bold text-slate-950">{formData.location}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500 font-medium">IFSC Code</span>
                <span className="font-bold text-slate-950">{formData.ifscCode || "N/A"}</span>
              </div>
            </div>

            {/* Tables breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              {/* Earnings Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2.5 font-bold uppercase tracking-wider text-[11px] flex justify-between">
                  <span>Earnings Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 p-2 font-medium">
                  <div className="flex justify-between py-1.5 px-2"><span>Basic Salary</span><span>₹{formatNum(formData.basic)}</span></div>
                  <div className="flex justify-between py-1.5 px-2"><span>HRA</span><span>₹{formatNum(formData.hra)}</span></div>
                  <div className="flex justify-between py-1.5 px-2"><span>Medical Allowance</span><span>₹{formatNum(formData.medical)}</span></div>
                  <div className="flex justify-between py-1.5 px-2 text-amber-700 bg-amber-50/50 font-bold rounded"><span>Incentives</span><span>₹{formatNum(formData.incentives)}</span></div>
                  <div className="flex justify-between py-1.5 px-2 text-amber-700 bg-amber-50/50 font-bold rounded"><span>Performance Pay</span><span>₹{formatNum(formData.performancePay)}</span></div>
                  <div className="flex justify-between py-1.5 px-2 text-amber-700 bg-amber-50/50 font-bold rounded"><span>Bonus</span><span>₹{formatNum(formData.bonus)}</span></div>
                </div>
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 font-black text-slate-900 flex justify-between">
                  <span>Gross Earnings</span>
                  <span className="text-emerald-700">₹{formatNum(formData.gross || calcGross)}</span>
                </div>
              </div>

              {/* Deductions Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-900 text-white px-4 py-2.5 font-bold uppercase tracking-wider text-[11px] flex justify-between">
                  <span>Deduction Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 p-2 font-medium">
                  <div className="flex justify-between py-1.5 px-2"><span>Provident Fund (PF)</span><span>₹{formatNum(formData.pf)}</span></div>
                  <div className="flex justify-between py-1.5 px-2 text-rose-700 bg-rose-50/50 font-bold rounded"><span>Health Insurance Premium</span><span>₹{formatNum(formData.healthInsurance)}</span></div>
                  <div className="flex justify-between py-1.5 px-2 text-rose-700 bg-rose-50/50 font-bold rounded"><span>LOP (No of Days)</span><span>₹{formatNum(formData.lop)}</span></div>

                  <div className="flex justify-between py-1.5 px-2 text-rose-700 bg-rose-50/50 font-bold rounded"><span>Employee Savings</span><span>₹{formatNum(formData.employeeSavings)}</span></div>
                  <div className="flex justify-between py-1.5 px-2"><span>Admin Tax</span><span>₹{formatNum(formData.adminTax !== undefined ? formData.adminTax : formData.professionalTax)}</span></div>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 font-black text-slate-900 flex justify-between">
                  <span>Total Deductions</span>
                  <span className="text-rose-700">₹{formatNum(formData.deductions || calcDeductions)}</span>
                </div>
              </div>

            </div>

            {/* Summary Box */}
            <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-850 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Net Take-Home Salary</span>
                <span className="text-2xl font-black text-emerald-400">₹{formatNum(formData.net || calcNet)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Net Salary Payable</span>
                <span className="text-2xl font-black text-white">₹{formatNum(formData.netPayable || formData.net || calcNet)}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
