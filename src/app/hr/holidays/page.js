"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, FileSpreadsheet, Sparkles, CheckCircle, Pencil, Trash2, X } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function HRHolidayPublisher() {
  const [holidays, setHolidays] = useState([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("National Holiday");
  const [scope, setScope] = useState("Global");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Load from MongoDB/localStorage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const list = await apiClient.getHolidays();
        setHolidays(list);
      } catch (err) {
        console.error("Failed to load holidays from database:", err);
      }
    }
    loadData();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!name || !date) return;

    try {
      if (editingId !== null) {
        // Editing Mode
        const result = await apiClient.updateHoliday(editingId, { name, date, type, scope });
        if (result.success) {
          const list = await apiClient.getHolidays();
          setHolidays(list);
          setEditingId(null);
          setSuccessMsg("Holiday updated successfully!");
        } else {
          setSuccessMsg("Failed to update holiday.");
        }
      } else {
        // Creating Mode
        const result = await apiClient.createHoliday({ name, date, type, scope });
        if (result.success) {
          const list = await apiClient.getHolidays();
          setHolidays(list);
          setSuccessMsg("Holiday published and broadcasted successfully!");
        } else {
          setSuccessMsg("Failed to publish holiday.");
        }
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg("Database connection error.");
    }

    setName("");
    setDate("");
    setType("National Holiday");
    setScope("Global");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleEdit = (h) => {
    setEditingId(h.id);
    setName(h.name);
    setDate(h.date);
    setType(h.type);
    setScope(h.scope);
  };

  const handleDelete = async (id) => {
    try {
      const result = await apiClient.deleteHoliday(id);
      if (result.success) {
        const list = await apiClient.getHolidays();
        setHolidays(list);
        
        if (editingId === id) {
          handleCancelEdit();
        }
        
        setSuccessMsg("Holiday removed successfully!");
      } else {
        setSuccessMsg("Failed to remove holiday.");
      }
    } catch (err) {
      console.error(err);
      setSuccessMsg("Database connection error.");
    }
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDate("");
    setType("National Holiday");
    setScope("Global");
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Corporate Holidays Planner</h1>
        <p className="text-xs text-slate-500">Publish mandatory corporate breaks, regional office closures, and team festivals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Create/Publish Form (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col gap-6 text-left h-fit">
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-slate-950 text-sm">
              {editingId !== null ? "Edit Corporate Break" : "Publish New Break"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {editingId !== null ? "Update selected break parameters." : "Broadcast calendar closures to employee portals."}
            </p>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePublish} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Holiday Title</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Eid-ul-Fitr / Diwali"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Closure Date</label>
              <input
                required
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none text-slate-800 focus:border-slate-950 focus:ring-1 focus:ring-slate-950/5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Holiday Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none cursor-pointer font-bold text-slate-750"
                >
                  <option value="National Holiday">National</option>
                  <option value="Public Holiday">Public</option>
                  <option value="Corporate Break">Corporate</option>
                  <option value="Festival Holiday">Festival</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Branch Scope</label>
                <select
                  value={scope}
                  onChange={e => setScope(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none cursor-pointer font-bold text-slate-750"
                >
                  <option value="Global">Global HQ</option>
                  <option value="India HQ">India Office</option>
                  <option value="USA Branch">USA Office</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-slate-950 hover:bg-slate-850 active:bg-black shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {editingId !== null ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingId !== null ? "Save Changes" : "Publish Holiday"}</span>
              </button>
              
              {editingId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side: Active Timeline (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-150/75 px-6 py-4.5 bg-slate-50/40 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Published Calendar closures</h3>
            <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">2026 Schedule</span>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {holidays.length > 0 ? (
              holidays.map(h => (
                <div key={h.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors text-left">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-950 text-xs">{h.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-1">
                      <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50">{h.type}</span>
                      <span>├─ Scope: {h.scope}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="font-extrabold text-xs text-slate-900">{new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{new Date(h.date).toLocaleDateString('en-US', { weekday: 'long' })}</span>
                    </div>
                    
                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 border-l border-slate-150 pl-3">
                      <button
                        onClick={() => handleEdit(h)}
                        title="Edit Holiday"
                        className={`p-1.5 rounded-lg border text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 cursor-pointer transition-all ${
                          editingId === h.id ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-200"
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id)}
                        title="Delete Holiday"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-semibold">
                No holidays published yet. Publish a new break on the left.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
