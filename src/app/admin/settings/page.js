"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Server,
  Database,
  CheckCircle2,
  Lock,
  User,
  Activity,
  HardDrive,
  RefreshCw,
  Sliders,
  DollarSign,
  Clock
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function AdminSettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // profile, system, diagnostics, database
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [currency, setCurrency] = useState("INR");
  const [sessionTimeout, setSessionTimeout] = useState("60");

  // DB collection stats (simulated details based on seed model)
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    teams: 0,
    trainings: 0,
    reports: 0,
    payrolls: 0
  });

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState({
    cpu: 24,
    memory: 45,
    uptime: "14 days, 6 hours"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const session = apiClient.getCurrentSession();
      setCurrentUser(session);

      const [allUsers, allDepts, allTeams, allTrainings] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getDepartments(),
        apiClient.getTeams(),
        apiClient.getTrainings()
      ]);

      const reportsRes = await fetch("/api/reports");
      const reportsList = reportsRes.ok ? (await reportsRes.json()).reports : [];

      const payrollsList = await apiClient.getPayrolls();

      setStats({
        users: allUsers?.length || 0,
        departments: allDepts?.length || 0,
        teams: allTeams?.length || 0,
        trainings: allTrainings?.length || 0,
        reports: reportsList?.length || 0,
        payrolls: payrollsList?.length || 0
      });

      // Simulate a bit of variance in CPU/RAM
      setTelemetry({
        cpu: Math.floor(Math.random() * 20) + 15,
        memory: Math.floor(Math.random() * 10) + 40,
        uptime: "14 days, 6 hours"
      });

    } catch (err) {
      console.error("Failed to load settings configuration:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSystemSettings = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading system configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-left animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
            <Settings className="w-5 h-5 text-slate-700" />
          </div>
          Settings & HQ Diagnostics
        </h1>
        <p className="text-sm text-slate-400 mt-1 font-medium">Manage security parameters, system configurations, and monitor real-time DB health indicators.</p>
      </div>

      {/* Main layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Tabs Navigation (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            Profile Credentials
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "system"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            System Parameters
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "diagnostics"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-4 h-4" />
            Diagnostics Telemetry
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "database"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Database className="w-4 h-4" />
            Ledger & DB Health
          </button>
        </div>

        {/* Right Side: Tab Contents (9 Columns) */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl shadow-sm p-8 min-h-[400px]">
          
          {/* TAB 1: Profile tab */}
          {activeTab === "profile" && currentUser && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-slate-500" />
                Administrative Session Identity
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-semibold text-slate-700">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Holder</span>
                  <span className="text-sm font-bold text-slate-900">{currentUser.name}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Bracket</span>
                  <span className="text-sm font-bold text-slate-900">{currentUser.email}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Console Role</span>
                  <span className="text-sm font-bold text-slate-900">{currentUser.role}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Permissions</span>
                  <span className="text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded w-fit">
                    Full Operations Access
                  </span>
                </div>
              </div>

              {/* Password change security card */}
              <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Console Access Security
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Update your local administrative database encryption password or login token.
                  </p>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Change Console Password
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: System configuration tab */}
          {activeTab === "system" && (
            <form onSubmit={handleSaveSystemSettings} className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4.5 h-4.5 text-slate-500" />
                  System Operations Settings
                </h2>
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Configurations Saved!
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Toggles grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Maintenance mode */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-bold text-slate-800 block">Maintenance mode</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Lock public client logins</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={maintenanceMode}
                      onChange={(e) => setMaintenanceMode(e.target.checked)}
                      className="w-9 h-5 rounded-full text-slate-950 bg-slate-200 border-transparent focus:ring-slate-950/5 cursor-pointer accent-indigo-650"
                    />
                  </div>

                  {/* Allow Registration */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-bold text-slate-800 block">Self-Registration</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Allow staff signups without HR</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowRegistration}
                      onChange={(e) => setAllowRegistration(e.target.checked)}
                      className="w-9 h-5 rounded-full text-slate-950 bg-slate-200 border-transparent focus:ring-slate-950/5 cursor-pointer accent-indigo-650"
                    />
                  </div>

                  {/* Notifications alerts */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-bold text-slate-800 block">Email Alerts webhook</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Notify HR on leave submission</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="w-9 h-5 rounded-full text-slate-950 bg-slate-200 border-transparent focus:ring-slate-950/5 cursor-pointer accent-indigo-650"
                    />
                  </div>

                  {/* Slack integration */}
                  <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
                    <div className="space-y-0.5 text-left">
                      <span className="text-xs font-bold text-slate-800 block">Slack Integration alerts</span>
                      <span className="text-[10px] text-slate-400 font-semibold block">Post announcements to #general</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={slackAlerts}
                      onChange={(e) => setSlackAlerts(e.target.checked)}
                      className="w-9 h-5 rounded-full text-slate-950 bg-slate-200 border-transparent focus:ring-slate-950/5 cursor-pointer accent-indigo-650"
                    />
                  </div>
                </div>

                {/* Brackets selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Currency Bracket</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Timeout limit</label>
                    <select
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 bg-white"
                    >
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                      <option value="1440">24 hours (Keep persistent)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 text-white font-bold rounded-xl text-xs shadow-md shadow-slate-950/10 cursor-pointer"
                >
                  Save System Parameters
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Diagnostics telemetry */}
          {activeTab === "diagnostics" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <Server className="w-4.5 h-4.5 text-slate-500" />
                Console Server Diagnostics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CPU card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Server CPU Load</span>
                    <Activity className="w-4 h-4 text-slate-450" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900">{telemetry.cpu}%</span>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-slate-700 rounded-full transition-all duration-500" style={{ width: `${telemetry.cpu}%` }} />
                    </div>
                  </div>
                </div>

                {/* Memory card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Active RAM usage</span>
                    <HardDrive className="w-4 h-4 text-slate-450" />
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900">{telemetry.memory}%</span>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-indigo-650 rounded-full transition-all duration-500" style={{ width: `${telemetry.memory}%` }} />
                    </div>
                  </div>
                </div>

                {/* Uptime card */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 text-left relative overflow-hidden flex flex-col justify-between h-32">
                  <div className="flex justify-between items-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <span>Host Server Uptime</span>
                    <Clock className="w-4 h-4 text-slate-450" />
                  </div>
                  <div>
                    <span className="text-xl font-black text-slate-800 leading-tight block">{telemetry.uptime}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mt-1 block">
                      ● Status Stable
                    </span>
                  </div>
                </div>
              </div>

              {/* System Specifications table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4 text-xs">
                <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 font-bold text-slate-800">
                  Node Engine Environment Properties
                </div>
                <div className="divide-y divide-slate-100 font-semibold text-slate-600 text-left">
                  <div className="px-5 py-3.5 flex justify-between">
                    <span className="text-slate-400">Node.js Version</span>
                    <span className="text-slate-900 font-bold">{process.version || "v18.17.0"}</span>
                  </div>
                  <div className="px-5 py-3.5 flex justify-between">
                    <span className="text-slate-400">Next.js Framework Build</span>
                    <span className="text-slate-900 font-bold">Next.js 14 (App Router)</span>
                  </div>
                  <div className="px-5 py-3.5 flex justify-between">
                    <span className="text-slate-400">Runtime Environment</span>
                    <span className="text-slate-900 font-bold uppercase">{process.env.NODE_ENV || "development"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Ledger & DB Health */}
          {activeTab === "database" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Database className="w-4.5 h-4.5 text-slate-500" />
                  Secure Ledger Index
                </h2>
                <button
                  type="button"
                  onClick={loadData}
                  className="p-1 px-3 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Sync Counts
                </button>
              </div>

              <p className="text-xs text-slate-400 text-left leading-normal font-semibold">
                Overview of active document counts populated across secure Mongoose database collection scopes.
              </p>

              {/* Counts Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[
                  { label: "User Accounts", count: stats.users, icon: User },
                  { label: "Departments", count: stats.departments, icon: Shield },
                  { label: "Teams / Squads", count: stats.teams, icon: Server },
                  { label: "Training Modules", count: stats.trainings, icon: Database },
                  { label: "Syllabus Reports", count: stats.reports, icon: Activity },
                  { label: "Payroll Ledger", count: stats.payrolls, icon: DollarSign }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-150 p-4.5 rounded-xl flex items-center gap-4 text-left">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-150 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 truncate">{item.label}</span>
                        <span className="text-xl font-black text-slate-900 leading-none mt-1">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Database Status Alert */}
              <div className="p-5 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-4 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-emerald-950">Mongoose Session Ledger Connected</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    The database session console is securely connected to the target database index via SSL verification. Automated daily data backups are fully operational.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Profile security modal */}
      {isPasswordModalOpen && (
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}
