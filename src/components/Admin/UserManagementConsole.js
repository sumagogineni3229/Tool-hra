"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  Edit2,
  Lock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  X,
  User,
  Mail,
  History,
  Trash2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function UserManagementConsole() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const filterParam = searchParams.get("filter") || "all";
  const actionParam = searchParams.get("action");

  const [searchTerm, setSearchTerm] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalNotification, setModalNotification] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State for creating a user
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("HR");
  const [newDepartment, setNewDepartment] = useState("Human Resource");
  const [newPermissions, setNewPermissions] = useState("Read/Write");
  const [newStatus, setNewStatus] = useState("Active");

  // Load users, departments, and current session on mount and action completion
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [users, depts] = await Promise.all([
          apiClient.getUsers(),
          apiClient.getDepartments()
        ]);
        setUsersList(users);
        setDepartments(depts || []);
        const session = apiClient.getCurrentSession();
        setCurrentUser(session);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [actionParam]);

  // Filter logic based on the sidebar option selected (All, HR, Managers)
  const filteredUsers = usersList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesFilter = true;
    if (filterParam === "hr") {
      matchesFilter = user.role === "HR";
    } else if (filterParam === "manager") {
      matchesFilter = user.role === "Manager";
    }

    return matchesSearch && matchesFilter;
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalNotification(null);

    try {
      const result = await apiClient.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        department: newDepartment,
        permissions: newPermissions,
        status: newStatus
      });

      if (result.success) {
        // Refresh users list immediately
        const users = await apiClient.getUsers();
        setUsersList(users);

        // Reset Form State
        setNewName("");
        setNewEmail("");
        setNewPassword("");
        setNewRole("HR");
        setNewDepartment("Human Resource");
        setNewPermissions("Read/Write");
        setNewStatus("Active");

        // Set success notification
        setModalNotification({
          type: "success",
          text: `Successfully provisioned ${result.user.name} as ${result.user.role}!`
        });

        // Clear notification after 4 seconds
        setTimeout(() => {
          setModalNotification(null);
        }, 4000);
      } else {
        setModalNotification({
          type: "error",
          text: "Verification Error: " + (result.message || "Failed to register user.")
        });
      }
    } catch (err) {
      console.error(err);
      setModalNotification({
        type: "error",
        text: "Failed to connect to the session portal."
      });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!id) return;
    setIsDeleting(true);
    setModalNotification(null);

    try {
      const result = await apiClient.deleteUser(id);
      if (result.success) {
        // Refresh users list immediately
        const users = await apiClient.getUsers();
        setUsersList(users);

        // Set success notification
        setModalNotification({
          type: "success",
          text: result.message || "Successfully deleted the system user!"
        });

        // Clear notification after 4 seconds
        setTimeout(() => {
          setModalNotification(null);
        }, 4000);
      } else {
        setModalNotification({
          type: "error",
          text: result.message || "Failed to delete the user account."
        });
      }
    } catch (err) {
      console.error(err);
      setModalNotification({
        type: "error",
        text: "Failed to connect to the session portal to delete user."
      });
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">

      {/* Global Toast/Notification Banner */}
      {modalNotification && actionParam !== "create" && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border animate-fade-in ${modalNotification.type === "success"
            ? "bg-emerald-50/70 text-emerald-800 border-emerald-100/70"
            : "bg-rose-50/70 text-rose-800 border-rose-100/70"
          }`}>
          {modalNotification.type === "success" ? (
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span>{modalNotification.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {filterParam === "hr"
              ? "HR Accounts Console"
              : filterParam === "manager"
                ? "Manager Accounts Console"
                : "User Management Portal"}
          </h1>
          <p className="text-xs text-slate-500">Configure administrative access credentials, group roles, and secure system session scopes.</p>
        </div>

        <button
          onClick={() => router.push("/admin/users?action=create")}
          className="px-4.5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-md shadow-slate-950/10 flex items-center gap-2 cursor-pointer w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Quick Access Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Total Admins */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Administrators</span>
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">{usersList.length} Users</span>
          </div>
        </div>

        {/* Card 2: Security Clearance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Sessions</span>
            <span className="text-2xl font-extrabold tracking-tight text-indigo-950">2 Online</span>
          </div>
        </div>

        {/* Card 3: System Audits */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Global Status</span>
            <span className="text-2xl font-extrabold tracking-tight text-emerald-950">100% Secure</span>
          </div>
        </div>

      </div>

      {/* Directory Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">

        {/* Table Filters Header */}
        <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm">Authorized Personnel Directory</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              {filteredUsers.length} Active Accounts
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Tool */}
            <div className="relative w-60">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors focus:ring-1 focus:ring-slate-950/5 text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Directory Viewport Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/20">
                <th className="px-6 py-4">User Profile Details</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">Permission Clearance</th>
                <th className="px-6 py-4">Session Status</th>
                <th className="px-6 py-4">Security Clearance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-55/10 transition-colors">

                    {/* User profile avatar, name, email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.badgeColor}`}>
                          {user.initials}
                        </div>
                        <div className="flex flex-col text-left min-w-0">
                          <span className="font-bold text-slate-900 text-xs truncate">{user.name}</span>
                          <span className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Department */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-slate-800">{user.role}</span>
                        <span className="text-[10px] text-slate-400 font-semibold mt-0.5">{user.department || "Operations"}</span>
                      </div>
                    </td>

                    {/* Permissions scope */}
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-500">{user.permissions}</span>
                    </td>

                    {/* Live Session Status */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${user.session === "Online"
                            ? "bg-emerald-500"
                            : user.session === "Away"
                              ? "bg-amber-400 animate-pulse"
                              : "bg-slate-300"
                          }`} />
                        <span className="text-xs font-semibold text-slate-600">{user.session}</span>
                      </div>
                    </td>

                    {/* User Status (Active/Suspended) */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${user.status === "Active"
                          ? "bg-emerald-50/60 text-emerald-800 border-emerald-100"
                          : "bg-rose-50/60 text-rose-800 border-rose-100"
                        }`}>
                        {user.status === "Active" ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{user.status}</span>
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => alert(`Modify profile for ${user.name}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200/50 transition-colors cursor-pointer"
                          title="Edit user profile"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => alert(`Suspend access permissions for ${user.name}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-55/10 border border-transparent hover:border-rose-100/50 transition-colors cursor-pointer"
                          title="Suspend User Access"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        {currentUser?.email !== user.email ? (
                          <button
                            type="button"
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                            title="Cannot delete your own active session account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 text-xs font-semibold bg-slate-50/10">
                    No system administrators match your current query or role selection parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Create User Modal Drawer */}
      {actionParam === "create" && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-backdrop">
          <div className="absolute inset-0 cursor-default" onClick={() => router.push("/admin/users")} />

          <div className="relative z-10 w-full max-w-4xl bg-white border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-950/20 flex flex-col animate-modal text-left overflow-hidden">
            {/* Close button */}
            <button
              onClick={() => router.push("/admin/users")}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer z-20"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 animate-fade-in">
              {/* Left Column: Create User Form (7 Columns) */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col gap-5 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold tracking-tight text-slate-950">Add System User</h2>
                  <p className="text-xs text-slate-500">Provision official administrative access, role groups, and session permissions.</p>
                </div>

                {/* Modal Toast/Notification Banner */}
                {modalNotification && (
                  <div className={`p-3.5 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-2.5 border animate-fade-in ${modalNotification.type === "success"
                      ? "bg-emerald-50/70 text-emerald-800 border-emerald-100/70"
                      : "bg-rose-50/70 text-rose-800 border-rose-100/70"
                    }`}>
                    {modalNotification.type === "success" ? (
                      <CheckCircle className="w-4.5 h-4.5 text-emerald-650 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4.5 h-4.5 text-rose-650 shrink-0 mt-0.5" />
                    )}
                    <span>{modalNotification.text}</span>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        required
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Alexander Green"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Workplace Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        required
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="alex@hraconnect.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Initial Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Initial Password / Passcode</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Selection Grids: Role & Department */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* System Role */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">System Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all cursor-pointer font-semibold"
                      >
                        <option value="Admin">Admin</option>
                        <option value="HR">HR</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>

                    {/* Role Selection (maps to department field) */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Role</label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all cursor-pointer font-semibold text-slate-750"
                      >
                        <option value="Human Resource">Human Resource</option>
                        <option value="Team Manager">Team Manager</option>
                        <option value="Engineer">Engineer</option>
                        <option value="Finance">Finance</option>
                        <option value="Operation">Operation</option>
                      </select>
                    </div>
                  </div>

                  {/* Clearance Scope */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Clearance Scope</label>
                    <select
                      value={newPermissions}
                      onChange={(e) => setNewPermissions(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:ring-2 focus:ring-slate-950/5 focus:border-slate-950 focus:outline-none transition-all cursor-pointer font-semibold"
                    >
                      <option value="Full Access">Full Access</option>
                      <option value="Read/Write">Read/Write</option>
                      <option value="Read Only">Read Only</option>
                    </select>
                  </div>

                  {/* Account Clearance */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Account Clearance</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="status"
                          value="Active"
                          checked={newStatus === "Active"}
                          onChange={() => setNewStatus("Active")}
                          className="w-4 h-4 rounded-full text-slate-950 border-slate-350 focus:ring-slate-950/5 cursor-pointer"
                        />
                        <span>Active Clearance</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="radio"
                          name="status"
                          value="Suspended"
                          checked={newStatus === "Suspended"}
                          onChange={() => setNewStatus("Suspended")}
                          className="w-4 h-4 rounded-full text-slate-950 border-slate-350 focus:ring-slate-950/5 cursor-pointer"
                        />
                        <span>Suspended Scope</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => router.push("/admin/users")}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
                    >
                      Close Form
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 active:bg-black focus:outline-none shadow-md shadow-slate-950/15 cursor-pointer"
                    >
                      Create Account
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: Last Created User History (5 Columns) */}
              <div className="md:col-span-5 bg-slate-50/50 p-6 sm:p-8 flex flex-col gap-5 text-left border-t md:border-t-0 border-slate-100">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold tracking-tight text-slate-850 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-650 shrink-0" />
                    <span>Last Created History</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Live chronological audit of recently provisioned system profiles.
                  </p>
                </div>

                {/* History Stream */}
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[430px] pr-1 scrollbar-thin">
                  {usersList.slice(0, 4).map((user) => (
                    <div
                      key={user.id || user.email}
                      className="bg-white border border-slate-150/75 p-3.5 rounded-xl shadow-xs flex items-center gap-3 hover:border-slate-350 transition-all duration-350 group animate-fade-in"
                    >
                      {/* Badge / Avatar */}
                      <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-300 ${user.badgeColor || 'bg-slate-900 text-white'}`}>
                        {user.initials || 'U'}
                      </div>

                      {/* Meta Info */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs truncate group-hover:text-indigo-950 transition-colors">{user.name}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8.5px] font-extrabold border shrink-0 ${user.status === "Active"
                              ? "bg-emerald-50/50 text-emerald-800 border-emerald-100"
                              : "bg-rose-50/50 text-rose-800 border-rose-100"
                            }`}>
                            {user.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.email}</span>
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-slate-500">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-tight">{user.department || 'Operations'}</span>
                          <span className="text-slate-350">•</span>
                          <span className="text-indigo-650 font-semibold">{user.permissions || 'Read/Write'}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {usersList.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-slate-400 text-xs font-semibold px-4 flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 animate-pulse" />
                      <span>No provisioned profiles found in secure index.</span>
                    </div>
                  )}
                </div>

                {/* Audit Security footer */}
                <div className="mt-auto pt-4 border-t border-slate-200/50 text-[10px] font-semibold text-slate-400 leading-normal flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Audit records are fully secure and immutable.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-backdrop">
          <div className="absolute inset-0 cursor-default" onClick={() => setUserToDelete(null)} />

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-950/20 p-6 flex flex-col gap-5 text-left animate-modal overflow-hidden">
            {/* Header info */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm leading-tight">Delete System User</h3>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Are you absolutely sure you want to permanently delete this user account? This action is irreversible.
                </p>
              </div>
            </div>

            {/* Profile summary card */}
            <div className="bg-slate-50 border border-slate-200/60 p-4.5 rounded-xl flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${userToDelete.badgeColor || 'bg-slate-900 text-white'}`}>
                {userToDelete.initials || 'U'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-900 text-xs truncate">{userToDelete.name}</span>
                <span className="text-[10px] text-slate-400 truncate mt-0.5">{userToDelete.email}</span>
                <div className="flex items-center gap-2 mt-2 text-[9px] font-bold text-slate-500">
                  <span className="bg-slate-200/50 px-1.5 py-0.5 rounded text-[8.5px] uppercase tracking-tight">{userToDelete.role}</span>
                  <span className="text-slate-350">•</span>
                  <span className="text-slate-600">{userToDelete.department || 'Operations'}</span>
                </div>
              </div>
            </div>

            {/* Control actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteUser(userToDelete.id || userToDelete._id)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all shadow-md shadow-rose-600/10 cursor-pointer flex items-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
