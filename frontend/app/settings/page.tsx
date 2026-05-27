import { AppShell } from "@/components/layout/AppShell"
import { ComingSoonPage } from "@/components/placeholders/ComingSoonPage"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <AppShell 
      breadcrumb="Settings" 
      headerIcon={<Settings className="mb-[2px] h-[18px] w-[18px] text-[#858585]" strokeWidth={2.5} />}
    >
      <ComingSoonPage 
        subtitle="We are building profile management and preference settings."
        iconText="S"
      />
    </AppShell>
  )
}
