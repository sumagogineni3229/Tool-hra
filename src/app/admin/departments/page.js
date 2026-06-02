"use client";

import { useState, useEffect } from "react";
import {
  Network,
  FolderPlus,
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  Check,
  Layers,
  AlertCircle
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function AdminDepartmentsPage() {
  // Data states
  const [departments, setDepartments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab state: 'overview' | 'departments' | 'teams'
  const [activeTab, setActiveTab] = useState("overview");

  // Form states
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [teamForm, setTeamForm] = useState({
    id: null, // null for create, ID for edit
    name: "",
    departmentId: "",
    managerId: "",
    members: [],
  });

  // UI helpers
  const [deptSearch, setDeptSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All"); // 'All' | 'Employee' | 'Intern'
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deptError, setDeptError] = useState("");
  const [deptSuccess, setDeptSuccess] = useState("");

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedDepts, fetchedTeams] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getDepartments(),
        apiClient.getTeams(),
      ]);

      setUsers(fetchedUsers || []);
      setDepartments(fetchedDepts || []);
      setTeams(fetchedTeams || []);
    } catch (error) {
      console.error("Failed to load organization data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Managers list (role === Manager, or fallback Admin/HR if needed, let's keep it role === Manager)
  const availableManagers = users.filter((u) => u.role === "Manager");
  
  // Eligible team members (Employee or Intern)
  const eligibleMembers = users.filter(
    (u) => u.role === "Employee" || u.role === "Intern"
  );

  // Filtered members list based on search and role filter in Team editor
  const filteredEligibleMembers = eligibleMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase());
    const matchesRole = roleFilter === "All" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle Department Submit
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    setDeptError("");
    setDeptSuccess("");

    if (!deptForm.name.trim()) {
      setDeptError("Department name is required.");
      return;
    }

    const res = await apiClient.createDepartment(deptForm);
    if (res.success) {
      setDeptSuccess("Department created successfully!");
      setDeptForm({ name: "", description: "" });
      loadData();
    } else {
      setDeptError(res.message || "Failed to create department.");
    }
  };

  // Handle Department Delete
  const handleDeptDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this department? This will not delete teams, but their department references will be cleared.")) return;
    
    setDeptError("");
    setDeptSuccess("");
    
    const res = await apiClient.deleteDepartment(id);
    if (res.success) {
      setDeptSuccess("Department deleted successfully.");
      loadData();
    } else {
      setDeptError(res.message || "Failed to delete department.");
    }
  };

  // Handle Team Submit (Create/Edit)
  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const { id, name, departmentId, managerId, members } = teamForm;

    if (!name.trim()) {
      setFormError("Team name is required.");
      return;
    }
    if (!departmentId) {
      setFormError("Please select a department.");
      return;
    }
    if (!managerId) {
      setFormError("Please select a team manager.");
      return;
    }

    const teamPayload = {
      name: name.trim(),
      departmentId,
      managerId,
      members,
    };

    let res;
    if (id) {
      res = await apiClient.updateTeam(id, teamPayload);
    } else {
      res = await apiClient.createTeam(teamPayload);
    }

    if (res.success) {
      setFormSuccess(id ? "Team updated successfully!" : "Team created successfully!");
      handleResetTeamForm();
      loadData();
    } else {
      setFormError(res.message || "Failed to save team.");
    }
  };

  // Handle Team Edit Select
  const handleEditTeamSelect = (team) => {
    setFormError("");
    setFormSuccess("");
    
    // Extract IDs safely whether populated as object or raw ID string
    const deptId = team.departmentId?.id || team.departmentId?._id || team.departmentId;
    const mgrId = team.managerId?.id || team.managerId?._id || team.managerId;
    const memberIds = (team.members || []).map((m) => m.id || m._id || m);

    setTeamForm({
      id: team.id || team._id,
      name: team.name,
      departmentId: deptId || "",
      managerId: mgrId || "",
      members: memberIds,
    });
    setActiveTab("teams");
  };

  // Handle Team Delete
  const handleTeamDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this team? Team members will be reassigned back to 'Operations' department.")) return;
    
    setFormError("");
    setFormSuccess("");

    const res = await apiClient.deleteTeam(id);
    if (res.success) {
      setFormSuccess("Team deleted successfully.");
      loadData();
    } else {
      setFormError(res.message || "Failed to delete team.");
    }
  };

  // Toggle member check in Team Form
  const handleToggleMember = (memberId) => {
    setTeamForm((prev) => {
      const isSelected = prev.members.includes(memberId);
      const updatedMembers = isSelected
        ? prev.members.filter((id) => id !== memberId)
        : [...prev.members, memberId];
      return { ...prev, members: updatedMembers };
    });
  };

  const handleResetTeamForm = () => {
    setTeamForm({
      id: null,
      name: "",
      departmentId: "",
      managerId: "",
      members: [],
    });
    setMemberSearch("");
    setRoleFilter("All");
  };

  // Count employees associated with each department
  const getDepartmentMemberCount = (deptId, deptName) => {
    let count = 0;
    
    // Check users by department name matching
    const directUsers = users.filter(
      (u) => u.department?.toLowerCase() === deptName?.toLowerCase()
    );
    
    // Also grab all members from teams of this department
    const deptTeams = teams.filter((t) => {
      const tDeptId = t.departmentId?.id || t.departmentId?._id || t.departmentId;
      return tDeptId === deptId;
    });

    const teamMemberIds = new Set();
    deptTeams.forEach((t) => {
      (t.members || []).forEach((m) => {
        const mId = m.id || m._id || m;
        if (mId) teamMemberIds.add(mId.toString());
      });
      const mgrId = t.managerId?.id || t.managerId?._id || t.managerId;
      if (mgrId) teamMemberIds.add(mgrId.toString());
    });

    // Merge both counts uniquely
    const uniqueEmails = new Set();
    directUsers.forEach((u) => uniqueEmails.add(u.email));
    
    users.forEach((u) => {
      const uId = u.id || u._id;
      if (uId && teamMemberIds.has(uId.toString())) {
        uniqueEmails.add(u.email);
      }
    });

    return uniqueEmails.size;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        <span className="text-xs font-bold uppercase tracking-wider">Syncing Org Charts...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-left max-w-7xl mx-auto animate-fade-in">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden border border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
        <div className="flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              Management Suite
            </span>
            <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-bold">
              Double-Layer Sync
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Organization Structure</h1>
          <p className="text-xs text-indigo-200/70 max-w-xl">
            Configure enterprise departments, customize teams, assign certified managers, and delegate workspace directories for employee and intern cohorts.
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 px-6 py-4.5 z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Total Departments</span>
            <span className="text-2xl font-black text-white">{departments.length}</span>
          </div>
          <div className="h-8 border-l border-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Active Teams</span>
            <span className="text-2xl font-black text-white">{teams.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Controller */}
      <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl max-w-md">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === "overview"
              ? "bg-white text-indigo-900 shadow-md shadow-slate-200/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Org Chart</span>
        </button>
        <button
          onClick={() => setActiveTab("departments")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === "departments"
              ? "bg-white text-indigo-900 shadow-md shadow-slate-200/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          <span>Departments</span>
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
            activeTab === "teams"
              ? "bg-white text-indigo-900 shadow-md shadow-slate-200/80"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Teams & Squads</span>
        </button>
      </div>

      {/* TAB 1: ORG CHART TREE HIERARCHY */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-6">
          {departments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No Departments Defined</h3>
              <p className="text-xs mt-1">Navigate to the "Departments" tab to construct your first business unit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {departments.map((dept) => {
                const deptTeams = teams.filter((t) => {
                  const tDeptId = t.departmentId?.id || t.departmentId?._id || t.departmentId;
                  return tDeptId === dept.id || tDeptId === dept._id;
                });

                return (
                  <div
                    key={dept.id || dept._id}
                    className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-all duration-300"
                  >
                    {/* Department Header block */}
                    <div className="bg-slate-50/70 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-650">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-extrabold text-slate-900 text-base">{dept.name}</h3>
                          <span className="text-[10px] text-slate-400 font-semibold">{dept.description || "No description set"}</span>
                        </div>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                        {getDepartmentMemberCount(dept.id || dept._id, dept.name)} Members
                      </span>
                    </div>

                    {/* Department Teams Grid */}
                    <div className="p-8">
                      {deptTeams.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                          No teams assigned to this department.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {deptTeams.map((team) => {
                            // Find manager details
                            const mgrId = team.managerId?.id || team.managerId?._id || team.managerId;
                            const manager = typeof team.managerId === "object" && team.managerId !== null 
                              ? team.managerId 
                              : users.find((u) => u.id === mgrId || u._id === mgrId);

                            // Resolve team members details
                            const teamMembers = (team.members || []).map((m) => {
                              const mId = m.id || m._id || m;
                              return typeof m === "object" && m !== null
                                ? m
                                : users.find((u) => u.id === mId || u._id === mId);
                            }).filter(Boolean);

                            return (
                              <div
                                key={team.id || team._id}
                                className="bg-slate-50/30 border border-slate-150/75 rounded-2xl p-6 flex flex-col justify-between hover:bg-white hover:border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                              >
                                <div className="flex flex-col gap-4">
                                  {/* Team Name badge */}
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-slate-900 text-sm tracking-tight">{team.name}</span>
                                    <span className="text-[9px] font-extrabold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full uppercase">
                                      {teamMembers.length} Members
                                    </span>
                                  </div>

                                  {/* Team Manager */}
                                  <div className="bg-white border border-slate-150 rounded-xl p-3.5 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${manager?.badgeColor || 'bg-slate-150 text-slate-700'}`}>
                                      {manager?.initials || manager?.name?.split(" ").map(n=>n[0]).join("") || "M"}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] text-slate-400 font-extrabold uppercase leading-none mb-1">Squad Lead</span>
                                      <span className="text-xs font-bold text-slate-900 leading-none">{manager?.name || "Unassigned Lead"}</span>
                                      <span className="text-[9px] text-slate-400 font-semibold">{manager?.email || "No email available"}</span>
                                    </div>
                                  </div>

                                  {/* Team Members List */}
                                  <div className="flex flex-col gap-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned Members</span>
                                    {teamMembers.length === 0 ? (
                                      <span className="text-[10px] text-slate-400 font-semibold italic">No squad members assigned</span>
                                    ) : (
                                      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                                        {teamMembers.map((m) => (
                                          <div key={m.id || m._id} className="flex items-center justify-between text-xs bg-white border border-slate-100/60 p-2 rounded-lg">
                                            <div className="flex items-center gap-2">
                                              <div className={`w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center shrink-0 ${m.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                                                {m.initials || m.name?.split(" ").map(n=>n[0]).join("") || "E"}
                                              </div>
                                              <span className="font-bold text-slate-800 tracking-tight leading-none">{m.name}</span>
                                            </div>
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                              m.role === 'Intern' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-700 border border-slate-100'
                                            }`}>
                                              {m.role}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENTS PANEL */}
      {activeTab === "departments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Create Department Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm">
            <h3 className="font-black text-slate-900 text-base mb-1.5">Add Business Department</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-6">Create organization categories</p>
            
            {deptError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{deptError}</span>
              </div>
            )}
            
            {deptSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{deptSuccess}</span>
              </div>
            )}

            <form onSubmit={handleDeptSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Name</label>
                <input
                  type="text"
                  placeholder="e.g. IT Security, Human Resources, Engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Briefly describe the operational scope or responsibilities of this department..."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  rows={4}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Provision Department</span>
              </button>
            </form>
          </div>

          {/* Departments Directory */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Provisioned Departments</h3>
              <div className="relative w-48 shrink-0">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Filter departments..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-slate-350 transition-colors"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto">
              {departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold bg-slate-55/10">
                  No matching departments discovered.
                </div>
              ) : (
                departments
                  .filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase()))
                  .map((dept) => (
                    <div key={dept.id || dept._id} className="p-6 flex items-center justify-between hover:bg-slate-50/30 transition-all text-left">
                      <div className="flex flex-col gap-1 max-w-[70%]">
                        <span className="font-extrabold text-slate-950 text-sm tracking-tight">{dept.name}</span>
                        <span className="text-xs text-slate-400 font-semibold leading-relaxed line-clamp-2">
                          {dept.description || "No description provided for this business category."}
                        </span>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded font-extrabold uppercase">
                            {getDepartmentMemberCount(dept.id || dept._id, dept.name)} Members
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeptDelete(dept.id || dept._id)}
                        className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Delete Department"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: TEAMS & SQUADS CONSOLE */}
      {activeTab === "teams" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Create/Edit Team workspace console */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl p-6.5 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-black text-slate-900 text-base">
                {teamForm.id ? "Modify Corporate Team" : "Provision Corporate Team"}
              </h3>
              {teamForm.id && (
                <button
                  type="button"
                  onClick={handleResetTeamForm}
                  className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 uppercase tracking-wider cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-6">
              Configure properties, managers and members
            </p>

            {formError && (
              <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleTeamSubmit} className="flex flex-col gap-5">
              {/* Team Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Security Squad, Alpha Devs, Sales Leads"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              {/* Department Dropdown */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated Department</label>
                  {departments.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("departments")}
                      className="text-[10px] font-extrabold text-indigo-650 hover:underline cursor-pointer"
                    >
                      + Create One First
                    </button>
                  )}
                </div>
                {departments.length === 0 ? (
                  <div className="text-xs text-amber-705 bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 flex flex-col gap-2">
                    <span className="leading-relaxed">No departments exist in the system yet. You must define a department before you can configure a squad.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("departments")}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer text-center"
                    >
                      Go to Departments Tab
                    </button>
                  </div>
                ) : (
                  <select
                    value={teamForm.departmentId}
                    onChange={(e) => setTeamForm({ ...teamForm, departmentId: e.target.value })}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors font-bold text-slate-700"
                  >
                    <option value="">Select a department...</option>
                    {departments.map((dept) => (
                      <option key={dept.id || dept._id} value={dept.id || dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Manager Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Squad Manager</label>
                <select
                  value={teamForm.managerId}
                  onChange={(e) => setTeamForm({ ...teamForm, managerId: e.target.value })}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors font-bold text-slate-700"
                >
                  <option value="">Select a manager...</option>
                  {availableManagers.map((mgr) => (
                    <option key={mgr.id || mgr._id} value={mgr.id || mgr._id}>
                      {mgr.name} ({mgr.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Member Selection Workspace */}
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assemble Squad Members</label>
                
                {/* Search & Filter tools */}
                <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                  <div className="relative flex-1 w-full">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search employees or interns..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                  
                  {/* Role filter buttons */}
                  <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-lg shrink-0 w-full sm:w-auto">
                    {["All", "Employee", "Intern"].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setRoleFilter(role)}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-200 ${
                          roleFilter === role
                            ? "bg-white text-indigo-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Members list grid */}
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto p-1 bg-slate-50/20">
                  {filteredEligibleMembers.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                      No matching cohort members discovered.
                    </div>
                  ) : (
                    filteredEligibleMembers.map((member) => {
                      const mId = member.id || member._id;
                      const isSelected = teamForm.members.includes(mId);
                      return (
                        <div
                          key={mId}
                          onClick={() => handleToggleMember(mId)}
                          className={`p-3 flex items-center justify-between rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                            isSelected ? "bg-indigo-50/40 border border-indigo-100/50" : "border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                              {member.initials || member.name.split(" ").map(n=>n[0]).join("")}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-xs font-bold text-slate-900 leading-tight">{member.name}</span>
                              <span className="text-[10px] text-slate-400 font-semibold leading-none mt-1">{member.email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded ${
                              member.role === 'Intern' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-100 text-slate-700 border border-slate-150'
                            }`}>
                              {member.role}
                            </span>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase text-right mt-1">
                  Selected Members: {teamForm.members.length}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 text-xs">
                {teamForm.id && (
                  <button
                    type="button"
                    onClick={handleResetTeamForm}
                    className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Discard Changes
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{teamForm.id ? "Save Team Updates" : "Provision Team"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Teams list directory */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Corporate Teams Directory</h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-[640px] overflow-y-auto">
              {teams.length === 0 ? (
                <div className="py-24 text-center text-slate-400 text-xs font-semibold bg-slate-50/10">
                  No active teams constructed. Use the panel on the left to set up a team.
                </div>
              ) : (
                teams.map((team) => {
                  const deptId = team.departmentId?.id || team.departmentId?._id || team.departmentId;
                  const dept = typeof team.departmentId === "object" && team.departmentId !== null
                    ? team.departmentId
                    : departments.find((d) => d.id === deptId || d._id === deptId);

                  const mgrId = team.managerId?.id || team.managerId?._id || team.managerId;
                  const manager = typeof team.managerId === "object" && team.managerId !== null
                    ? team.managerId
                    : users.find((u) => u.id === mgrId || u._id === mgrId);

                  const memberCount = (team.members || []).length;

                  return (
                    <div key={team.id || team._id} className="p-6 flex flex-col gap-4 hover:bg-slate-50/30 transition-all text-left">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="font-extrabold text-slate-950 text-sm tracking-tight">{team.name}</span>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded font-extrabold uppercase">
                              {dept?.name || "No department"}
                            </span>
                            <span className="text-[9px] text-slate-600 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded font-extrabold uppercase">
                              Manager: {manager?.name || "None Assigned"}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditTeamSelect(team)}
                            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-650 transition-colors cursor-pointer"
                            title="Edit Team Properties"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTeamDelete(team.id || team._id)}
                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Members row list summary */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-2">Assigned:</span>
                        {memberCount === 0 ? (
                          <span className="text-[10px] text-slate-400 font-semibold italic">No squad members assigned</span>
                        ) : (
                          <div className="flex items-center -space-x-2 overflow-hidden">
                            {(team.members || []).slice(0, 8).map((m, idx) => {
                              const mId = m.id || m._id || m;
                              const mDetails = typeof m === "object" && m !== null
                                ? m
                                : users.find((u) => u.id === mId || u._id === mId);
                              return (
                                <div
                                  key={mId || idx}
                                  className={`w-6 h-6 rounded-full border border-white flex items-center justify-center text-[8px] font-black shrink-0 shadow-sm ${mDetails?.badgeColor || 'bg-slate-100 text-slate-700'}`}
                                  title={mDetails?.name || "Squad member"}
                                >
                                  {mDetails?.initials || mDetails?.name?.split(" ").map(n=>n[0]).join("") || "E"}
                                </div>
                              );
                            })}
                            {memberCount > 8 && (
                              <div className="w-6 h-6 rounded-full border border-white bg-slate-200 text-slate-800 text-[8px] font-black shrink-0 flex items-center justify-center shadow-sm">
                                +{memberCount - 8}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
