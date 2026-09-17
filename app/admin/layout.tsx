import type { ReactNode } from "react";
import AdminShell from "@/components/AdminShell";
import AdminPushButton from "@/components/AdminPushButton";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell><div className="fixed bottom-4 right-4 z-[70]"><AdminPushButton /></div>{children}</AdminShell>;
}
