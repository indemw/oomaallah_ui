import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import ChatWidget from "@/components/chat/ChatWidget";

export default function StaffLayout({ children }: { children?: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="fixed top-0 left-0 right-0 z-40">
          <Header />
        </div>
        <div className="flex w-full pt-16">
          <AppSidebar />
          <main className="flex-1 p-6">
            {children ?? <Outlet />}
          </main>
          {/* Floating staff chat */}
          <ChatWidget />
        </div>
      </div>
    </SidebarProvider>
  );
}
