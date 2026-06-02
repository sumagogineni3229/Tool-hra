"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  FileText,
  ExternalLink,
  Phone,
  Mail,
  Heart,
  CreditCard,
  Lock,
  RefreshCw
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

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

const TYPE_GRADIENTS = {
  Health:        "from-emerald-500 to-teal-600 shadow-emerald-100",
  Life:          "from-indigo-500 to-blue-600 shadow-indigo-100",
  Accident:      "from-amber-500 to-orange-600 shadow-amber-100",
  "Group Medical": "from-blue-500 to-indigo-600 shadow-blue-100",
  Dental:        "from-violet-500 to-purple-600 shadow-violet-100",
  Vision:        "from-rose-500 to-pink-600 shadow-rose-100",
};

export default function EmployeeInsurance() {
  const [currentUser, setCurrentUser] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const session = apiClient.getCurrentSession();
      if (session) {
        setCurrentUser(session);
        try {
          const emailToQuery = session.role === "Admin" ? "employee@hraconnect.com" : session.email;
          const res = await fetch(`/api/insurance?email=${emailToQuery}`);
          const data = await res.json();
          if (data.success) {
            setPolicies(data.insurance || []);
          }
        } catch (err) {
          console.warn("Failed to fetch employee insurance:", err);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Insurance Benefits</h1>
          <p className="text-xs text-slate-500">Access and view your corporate sponsored insurance coverage details.</p>
        </div>
        <div className="py-24 text-center flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-300" />
          <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading insurance profile...</span>
        </div>
      </div>
    );
  }

  // Active policy first or fallback
  const activePolicy = policies.find(p => p.status === "Active" || p.status === "Expiring Soon") || policies[0];

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Insurance Benefits</h1>
        <p className="text-xs text-slate-500">Access your active health policies, download corporate insurance cards, and check coverage audits.</p>
      </div>

      {!activePolicy ? (
        /* Empty State */
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center flex flex-col items-center gap-4 max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <Heart className="w-8 h-8 text-rose-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-900 text-sm">No Active Insurance Policy</h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed font-semibold">
              We couldn't find any corporate-sponsored insurance policy linked to your account.
              Please reach out to the HR Operations team to check your eligibility or to update your credentials.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <a
              href="mailto:hr@hragroups.com"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" /> Email HR
            </a>
            <a
              href="/employee/feedback"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-md shadow-rose-200"
            >
              Submit Ticket
            </a>
          </div>
        </div>
      ) : (
        /* Content Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Card Mockup & General Actions (5 columns) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Digital Card Preview */}
            <div className={`relative h-64 rounded-3xl bg-gradient-to-br ${TYPE_GRADIENTS[activePolicy.insuranceType] || "from-slate-800 to-slate-900"} text-white p-6 shadow-xl flex flex-col justify-between overflow-hidden group hover:scale-[1.01] transition-transform`}>
              
              {/* Abstract Glass shapes */}
              <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none" />

              {/* Top Row: Provider & Chip */}
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest leading-none">Insurance Provider</span>
                  <span className="text-lg font-black tracking-tight mt-1">{activePolicy.providerName}</span>
                </div>
                <div className="w-10 h-7 rounded bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Mid Row: Policy details */}
              <div className="flex flex-col gap-1 z-10">
                <span className="text-[8px] font-black text-white/60 uppercase tracking-wider leading-none">Policy Number</span>
                <span className="text-xl font-mono font-bold tracking-widest">{activePolicy.policyNumber}</span>
              </div>

              {/* Bottom Row: Employee + Expire */}
              <div className="flex justify-between items-end border-t border-white/20 pt-4 z-10">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/60 uppercase tracking-wider leading-none">Insured Employee</span>
                  <span className="text-xs font-bold mt-1 truncate max-w-[180px]">{activePolicy.employeeName}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/60 uppercase tracking-wider leading-none">Valid Till</span>
                  <span className="text-xs font-bold mt-1">{new Date(activePolicy.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </div>

            {/* Document Links */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Policy Documents</h3>
              <p className="text-[10px] text-slate-450 font-semibold leading-relaxed">
                Download your official policy document or print your cashless insurance card to present at networked hospitals.
              </p>
              
              <div className="flex flex-col gap-2">
                {activePolicy.policyDocUrl ? (
                  <a
                    href={activePolicy.policyDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" /> Policy Handbook
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 bg-slate-50/50 border border-dashed border-slate-200">
                    <FileText className="w-4 h-4 opacity-55" /> Policy Handbook Unavailable
                  </div>
                )}

                {activePolicy.insuranceCardUrl ? (
                  <a
                    href={activePolicy.insuranceCardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cashless Digital Card
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 bg-slate-50/50 border border-dashed border-slate-200">
                    <ShieldCheck className="w-4 h-4 opacity-55" /> Cashless Card Unavailable
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Policy Audits & Support Details (7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Policy Overview Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 px-6 py-4.5 bg-slate-50/40 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Policy Details</h3>
                <span className={`px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${STATUS_STYLES[activePolicy.status]}`}>
                  {activePolicy.status}
                </span>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                {[
                  { label: "Insurance Type",  value: activePolicy.insuranceType, badge: true },
                  { label: "Total Coverage",  value: fmt(activePolicy.coverageAmount) },
                  { label: "Premium (Paid by HRA)", value: `${fmt(activePolicy.premiumAmount)}/mo` },
                  { label: "Policy Number",   value: activePolicy.policyNumber, mono: true },
                  { label: "Coverage Start",  value: fmtDate(activePolicy.startDate) },
                  { label: "Expiry Date",     value: fmtDate(activePolicy.expiryDate) },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</span>
                    {item.badge ? (
                      <span className={`w-fit px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${TYPE_COLORS[item.value] || "bg-slate-100 text-slate-700"}`}>
                        {item.value}
                      </span>
                    ) : (
                      <span className={`text-sm font-black leading-tight text-slate-900 ${item.mono ? "font-mono" : ""}`}>
                        {item.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {activePolicy.notes && (
                <div className="mx-6 mb-6 p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/50">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">HR Admin Remarks</span>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed">{activePolicy.notes}</p>
                </div>
              )}
            </div>

            {/* Claims & Hospitalization Quick Guide */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="font-bold text-slate-950 text-xs uppercase tracking-wider">Cashless & Claims Info</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Your group insurance program provides access to cashless hospitalization across 10,000+ networked hospitals nationwide.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Cashless Admission</span>
                  <p className="text-[10px] text-slate-455 font-semibold leading-relaxed">
                    Present your digital insurance card and Government ID card at the TPA desk of any network hospital 24 hours prior to planned admission, or within 24 hours of emergency admission.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-900">Reimbursement Claims</span>
                  <p className="text-[10px] text-slate-455 font-semibold leading-relaxed">
                    If hospitalized at a non-network hospital, settle bills directly and submit all original discharge summaries, reports, and bills to HR within 15 days of discharge for reimbursement audits.
                  </p>
                </div>
              </div>

              {/* Support Contacts */}
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Support Helpdesk</span>
                  <span className="text-xs font-bold text-slate-800">Need help with pre-auth or hospital desks?</span>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="tel:+1800123456"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-indigo-600" /> 1800-123-456
                  </a>
                  <a
                    href="mailto:claims@hragroups.com"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" /> claims@hragroups.com
                  </a>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
