import { AppShell } from "@/components/layout/AppShell"
import { ComingSoonPage } from "@/components/placeholders/ComingSoonPage"
import { Users } from "lucide-react"

export default function GroupsPage() {
  return (
    <AppShell 
      breadcrumb="My Groups" 
      headerIcon={<Users className="mb-[2px] h-[18px] w-[18px] text-[#858585]" strokeWidth={2.5} />}
    >
      <ComingSoonPage 
        subtitle="We are building group spaces for co-teachers and shared classes."
        iconText="G"
      />
    </AppShell>
  )
}
