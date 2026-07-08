"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuClick={() => setCollapsed(!collapsed)} />

        <main
          className="flex-1 overflow-auto p-4 md:p-6 lg:p-8"
          style={{ backgroundColor: "var(--color-neutral-50)" }}
        >
          <div style={{ animation: "pageIn 0.2s ease-out" }}>
            {children}
          </div>
          <style>{`@keyframes pageIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </main>
      </div>
    </div>
  );
}