import { AppShell } from "@/components/layout/AppShell"
import { EmptyAssignmentsState } from "@/components/feedback/EmptyAssignmentsState"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <AppShell>
      <main className="relative flex h-full min-h-[400px] w-full flex-col items-center justify-center">
        <EmptyAssignmentsState />

        {/* Mobile Action Button (FAB) */}
        <Link
          href="/assignments/new"
          className="fixed bottom-[105px] right-5 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white text-[#ff6136] shadow-[0_18px_36px_rgba(0,0,0,0.14)] lg:hidden"
        >
          <Plus className="h-8 w-8" strokeWidth={2.5} />
        </Link>
      </main>
    </AppShell>
  )
}
