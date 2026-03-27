import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function ReceiptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 border-b px-6 py-3">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Receipts</h1>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
