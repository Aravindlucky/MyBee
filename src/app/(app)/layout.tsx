import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { DoubleClickActivatorProvider } from "@/components/DoubleClickActivator"; // <-- NEW IMPORT

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      {/* Wrap sidebar and content in the new provider */}
      <DoubleClickActivatorProvider> 
        <AppSidebar />
        <div className="flex flex-col w-full min-h-screen overflow-hidden bg-[#f9fafb]"> {/* Added bg tint */}
          <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 sticky top-0 z-30 md:hidden">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-6 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <h1 className="font-headline text-lg font-semibold">MBA Hub</h1>
            </div>
          </header>
          <SidebarInset>
            {children}
          </SidebarInset>
        </div>
      </DoubleClickActivatorProvider> {/* <-- CLOSING TAG */}
    </SidebarProvider>
  );
}