import { AppShell } from "@/components/layout/AppShell"
import { ComingSoonPage } from "@/components/placeholders/ComingSoonPage"
import { Library } from "lucide-react"

export default function LibraryPage() {
  return (
    <AppShell 
      breadcrumb="My Library" 
      headerIcon={<Library className="mb-[2px] h-[18px] w-[18px] text-[#858585]" strokeWidth={2.5} />}
    >
      <ComingSoonPage 
        subtitle="Save and reuse question papers, prompts, and templates here."
        iconText="L"
      />
    </AppShell>
  )
}
