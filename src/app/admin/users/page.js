"use client";

import { Suspense } from "react";
import UserManagementConsole from "@/components/Admin/UserManagementConsole";

export default function UserManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
      </div>
    }>
      <UserManagementConsole />
    </Suspense>
  );
}
