import { AppShell } from "@/components/layout/AppShell"
import { ComingSoonPage } from "@/components/placeholders/ComingSoonPage"
import { BookOpen } from "lucide-react"

export default function ToolkitPage() {
  return (
    <AppShell 
      breadcrumb="AI Teacher's Toolkit" 
      headerIcon={<BookOpen className="mb-[2px] h-[18px] w-[18px] text-[#858585]" strokeWidth={2.5} />}
    >
      <ComingSoonPage 
        subtitle="New AI tools for lesson plans, rubrics, and feedback are on the way."
        iconText="AI"
      />
    </AppShell>
  )
}
