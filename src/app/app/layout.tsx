import AppTabs from "@/components/nav/AppTabs";

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto min-h-dvh max-w-xl md:max-w-2xl lg:max-w-5xl pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {children}
      <AppTabs />
    </div>
  );
}
