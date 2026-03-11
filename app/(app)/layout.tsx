import { Sidebar } from "@/components/Sidebar";
import { ToastContainer } from "@/components/Toast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

