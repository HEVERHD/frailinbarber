import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#120505]">
      <Sidebar />
      <main className="flex-1 p-4 pt-20 md:p-8 pb-24 md:pb-8 md:pt-8">{children}</main>
    </div>
  )
}
