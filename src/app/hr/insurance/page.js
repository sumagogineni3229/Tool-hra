"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldPlus,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Search,
  Plus,
  RefreshCw,
  X,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

const INSURANCE_TYPES = ["Health", "Life", "Accident", "Group Medical", "Dental", "Vision"];

const TYPE_COLORS = {
  Health:        "bg-emerald-50 text-emerald-700 border-emerald-100",
  Life:          "bg-indigo-50 text-indigo-700 border-indigo-100",
  Accident:      "bg-amber-50 text-amber-700 border-amber-100",
  "Group Medical": "bg-blue-50 text-blue-700 border-blue-100",
  Dental:        "bg-violet-50 text-violet-700 border-violet-100",
  Vision:        "bg-rose-50 text-rose-700 border-rose-100",
};

const STATUS_STYLES = {
  Active:          "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Expiring Soon": "bg-amber-50 text-amber-700 border-amber-100",
  Expired:         "bg-rose-50 text-rose-700 border-rose-100",
  Cancelled:       "bg-slate-100 text-slate-500 border-slate-200",
};

const EMPTY_FORM = {
  employeeEmail: "",
  employeeName:  "",
  providerName:  "",
  policyNumber:  "",
  insuranceType: "Health",
  coverageAmount: "",
  premiumAmount: "",
  startDate: "",
  expiryDate: "",
  policyDocUrl: "",
  insuranceCardUrl: "",
  notes: "",
};

export default function HRInsurancePage() {
  const [records,   setRecords]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [searchQ,   setSearchQ]   = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Modals
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editMode,      setEditMode]      = useState(false);
  const [selectedRec,   setSelectedRec]   = useState(null);

  // Form
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formError,  setFormError]  = useState("");
  const [formSaving, setFormSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insurance");
      const data = await res.json();
      if (data.success) setRecords(data.insurance || []);
    } catch (err) {
      console.warn("Insurance fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    apiClient.getUsers().then(users => {
      setEmployees(users.filter(u => u.role === "Employee"));
    }).catch(() => {});
  }, [fetchRecords]);

  // ── Stats ──────────────────────────────────────────────
  const total       = records.length;
  const active      = records.filter(r => r.status === "Active").length;
  const expiring    = records.filter(r => r.status === "Expiring Soon").length;
  const expired     = records.filter(r => r.status === "Expired").length;

  // ── Filtered list ──────────────────────────────────────
  const filtered = records.filter(r => {
    const q = searchQ.toLowerCase();
    const matchSearch =
      (r.employeeName  || "").toLowerCase().includes(q) ||
      (r.employeeEmail || "").toLowerCase().includes(q) ||
      (r.providerName  || "").toLowerCase().includes(q) ||
      (r.policyNumber  || "").toLowerCase().includes(q) ||
      (r.insuranceType || "").toLowerCase().includes(q);

    const matchTab =
      activeTab === "all"            ? true :
      activeTab === "active"         ? r.status === "Active" :
      activeTab === "expiring"       ? r.status === "Expiring Soon" :
      activeTab === "expired"        ? r.status === "Expired" :
      true;

    return matchSearch && matchTab;
  });

  // ── Form helpers ───────────────────────────────────────
  const handleEmployeeSelect = (e) => {
    const email = e.target.value;
    const emp = employees.find(u => u.email === email);
    setForm(f => ({ ...f, employeeEmail: email, employeeName: emp?.name || "" }));
  };

  const handleFormChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setFormError("");
  };

  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setEditMode(false);
    setFormError("");
    setShowAddModal(true);
  };

  const openEditModal = (rec) => {
    setForm({
      employeeEmail:    rec.employeeEmail,
      employeeName:     rec.employeeName,
      providerName:     rec.providerName,
      policyNumber:     rec.policyNumber,
      insuranceType:    rec.insuranceType,
      coverageAmount:   String(rec.coverageAmount),
      premiumAmount:    String(rec.premiumAmount),
      startDate:        rec.startDate ? rec.startDate.substring(0, 10) : "",
      expiryDate:       rec.expiryDate ? rec.expiryDate.substring(0, 10) : "",
      policyDocUrl:     rec.policyDocUrl || "",
      insuranceCardUrl: rec.insuranceCardUrl || "",
      notes:            rec.notes || "",
    });
    setSelectedRec(rec);
    setEditMode(true);
    setFormError("");
    setShowAddModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const required = ["employeeEmail", "providerName", "policyNumber", "insuranceType", "coverageAmount", "premiumAmount", "startDate", "expiryDate"];
    for (const f of required) {
      if (!form[f]) {
        setFormError(`Please fill in all required fields.`);
        return;
      }
    }
    setFormSaving(true);
    try {
      const payload = editMode
        ? { id: selectedRec._id, ...form }
        : form;

      const res = await fetch("/api/insurance", {
        method: editMode ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        setSuccessMsg(editMode ? "Policy updated successfully!" : "Insurance policy added successfully!");
        setTimeout(() => setSuccessMsg(""), 3500);
        fetchRecords();
      } else {
        setFormError(data.message || "Save failed");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/insurance?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setConfirmDeleteId(null);
        setSuccessMsg("Policy record deleted.");
        setTimeout(() => setSuccessMsg(""), 3000);
        fetchRecords();
      }
    } catch (err) {
      console.warn("Delete failed:", err);
    }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const getBgColor  = (name = "") => {
    const colors = ["bg-indigo-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-rose-500","bg-sky-500"];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <div className="flex flex-col gap-8 text-left">

      {/* ── Page Header ─────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <ShieldPlus className="w-6 h-6 text-indigo-600 shrink-0" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Insurance Management</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage employee insurance policies — add, edit, renew, and track coverage status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecords}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Policy
          </button>
        </div>
      </header>

      {/* ── Success Toast ────────────────────────────────── */}
      {successMsg && (
        <div className="flex items-center gap-2.5 px-5 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold animate-pulse shadow-sm">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ── KPI Stats Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Insured", value: total,   icon: Users,       color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { label: "Active",        value: active,   icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { label: "Expiring Soon", value: expiring, icon: ShieldAlert, color: "text-amber-600 bg-amber-50 border-amber-100" },
          { label: "Expired",       value: expired,  icon: ShieldX,     color: "text-rose-600 bg-rose-50 border-rose-100" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                {stat.label}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Main Console ─────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">

        {/* Controls */}
        <div className="px-8 py-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">

          {/* Tabs */}
          <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl w-fit gap-0.5">
            {[
              { id: "all",      label: "All",           badge: total },
              { id: "active",   label: "Active",        badge: active   },
              { id: "expiring", label: "Expiring Soon", badge: expiring },
              { id: "expired",  label: "Expired",       badge: expired  },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search name, provider, policy #..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-24 text-center flex flex-col items-center gap-3 text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin text-slate-300" />
              <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading policies...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                <ShieldPlus className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">No Policies Found</p>
              <p className="text-xs text-slate-400 font-medium">Add a new insurance policy using the button above.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Employee", "Type", "Provider", "Policy No.", "Coverage", "Premium/mo", "Expiry", "Status", "Actions"].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rec => (
                  <tr key={rec._id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* Employee */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black shrink-0 ${getBgColor(rec.employeeName)}`}>
                          {getInitials(rec.employeeName)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{rec.employeeName}</span>
                          <span className="text-[9px] text-slate-400 font-medium truncate max-w-[130px]">{rec.employeeEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${TYPE_COLORS[rec.insuranceType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {rec.insuranceType}
                      </span>
                    </td>

                    {/* Provider */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-700">{rec.providerName}</span>
                    </td>

                    {/* Policy No */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono font-bold text-slate-700">{rec.policyNumber}</span>
                    </td>

                    {/* Coverage */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-slate-900">{fmt(rec.coverageAmount)}</span>
                    </td>

                    {/* Premium */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-semibold text-slate-600">{fmt(rec.premiumAmount)}</span>
                    </td>

                    {/* Expiry */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs font-bold ${
                        rec.status === "Expired"
                          ? "text-rose-600"
                          : rec.status === "Expiring Soon"
                          ? "text-amber-600"
                          : "text-slate-700"
                      }`}>
                        {fmtDate(rec.expiryDate)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${STATUS_STYLES[rec.status] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {rec.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setSelectedRec(rec); setShowViewModal(true); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(rec)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors cursor-pointer"
                          title="Edit / Renew"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(rec._id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div className="px-8 py-3.5 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {filtered.length} of {total} records
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          ADD / EDIT MODAL
      ═══════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">

            {/* Header */}
            <div className="border-b border-slate-100 px-7 py-5 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <ShieldPlus className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">{editMode ? "Edit Insurance Policy" : "Add New Insurance Policy"}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                    {editMode ? "Update existing coverage record" : "Enter policy details to register"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSave} className="flex flex-col gap-5 px-7 py-6 overflow-y-auto">

              {/* Employee Selector (only in add mode) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  Employee <span className="text-rose-500">*</span>
                </label>
                {editMode ? (
                  <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                    {form.employeeName} ({form.employeeEmail})
                  </div>
                ) : (
                  <select
                    value={form.employeeEmail}
                    onChange={handleEmployeeSelect}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-300 cursor-pointer"
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map(emp => (
                      <option key={emp._id || emp.id} value={emp.email}>
                        {emp.name} ({emp.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Row 1: Insurance Type + Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Insurance Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.insuranceType}
                    onChange={e => handleFormChange("insuranceType", e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-indigo-300 cursor-pointer"
                  >
                    {INSURANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Provider Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.providerName}
                    onChange={e => handleFormChange("providerName", e.target.value)}
                    required
                    placeholder="e.g. Star Health, LIC, HDFC Ergo"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-indigo-300"
                  />
                </div>
              </div>

              {/* Policy Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  Policy Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.policyNumber}
                  onChange={e => handleFormChange("policyNumber", e.target.value)}
                  required
                  placeholder="e.g. POL/2026/0001234"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-indigo-300"
                />
              </div>

              {/* Row 2: Coverage + Premium */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Coverage Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.coverageAmount}
                    onChange={e => handleFormChange("coverageAmount", e.target.value)}
                    required
                    min="0"
                    placeholder="500000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Monthly Premium (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.premiumAmount}
                    onChange={e => handleFormChange("premiumAmount", e.target.value)}
                    required
                    min="0"
                    placeholder="2500"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-300"
                  />
                </div>
              </div>

              {/* Row 3: Start + Expiry Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => handleFormChange("startDate", e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-300 cursor-pointer"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">
                    Expiry Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => handleFormChange("expiryDate", e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 4: Document URLs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Policy Doc URL</label>
                  <input
                    type="url"
                    value={form.policyDocUrl}
                    onChange={e => handleFormChange("policyDocUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-indigo-300"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Insurance Card URL</label>
                  <input
                    type="url"
                    value={form.insuranceCardUrl}
                    onChange={e => handleFormChange("insuranceCardUrl", e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-indigo-300"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => handleFormChange("notes", e.target.value)}
                  rows={2}
                  placeholder="Any additional notes about this policy..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:border-indigo-300 resize-none"
                />
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formSaving ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    <><ShieldPlus className="w-3.5 h-3.5" /> {editMode ? "Update Policy" : "Add Policy"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          VIEW DETAIL MODAL
      ═══════════════════════════════════════════════════════ */}
      {showViewModal && selectedRec && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

            <div className="border-b border-slate-100 px-7 py-5 bg-gradient-to-r from-indigo-50/80 to-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white text-sm font-black ${getBgColor(selectedRec.employeeName)}`}>
                  {getInitials(selectedRec.employeeName)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-900">{selectedRec.employeeName}</span>
                  <span className="text-[9px] text-slate-400 font-bold">{selectedRec.employeeEmail}</span>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-7 flex flex-col gap-5">
              {/* Status badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${TYPE_COLORS[selectedRec.insuranceType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {selectedRec.insuranceType}
                  </span>
                  <span className={`px-3 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider ${STATUS_STYLES[selectedRec.status]}`}>
                    {selectedRec.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Provider",       value: selectedRec.providerName },
                  { label: "Policy No.",     value: selectedRec.policyNumber, mono: true },
                  { label: "Coverage",       value: fmt(selectedRec.coverageAmount) },
                  { label: "Premium/Month",  value: fmt(selectedRec.premiumAmount) },
                  { label: "Start Date",     value: fmtDate(selectedRec.startDate) },
                  { label: "Expiry Date",    value: fmtDate(selectedRec.expiryDate), highlight: selectedRec.status !== "Active" },
                ].map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-sm font-black leading-tight ${item.mono ? "font-mono" : ""} ${item.highlight ? "text-amber-700" : "text-slate-900"}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              {selectedRec.notes && (
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Notes</span>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">{selectedRec.notes}</p>
                </div>
              )}

              {/* Document Links */}
              {(selectedRec.policyDocUrl || selectedRec.insuranceCardUrl) && (
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documents</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedRec.policyDocUrl && (
                      <a
                        href={selectedRec.policyDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold hover:bg-indigo-100 transition-colors"
                      >
                        <FileText className="w-3 h-3" /> Policy Document <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {selectedRec.insuranceCardUrl && (
                      <a
                        href={selectedRec.insuranceCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3" /> Insurance Card <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-7 py-4 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => { setShowViewModal(false); openEditModal(selectedRec); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit / Renew
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ═══════════════════════════════════════════════════════ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-5 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-base font-black text-slate-900 uppercase tracking-tight">Delete Policy?</span>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                This will permanently remove the insurance record. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
