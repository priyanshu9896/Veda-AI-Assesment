import { Sidebar } from "./Sidebar"
import { PageHeader } from "./PageHeader"
import { MobileHeader } from "./MobileHeader"
import { MobileBottomNav } from "./MobileBottomNav"
import { ProtectedRoute } from "../auth/ProtectedRoute"

interface AppShellProps {
  children: React.ReactNode
  breadcrumb?: string
  subtitle?: string
  headerIcon?: React.ReactNode
  showBack?: boolean
  assignmentCount?: number
}

export function AppShell({ children, breadcrumb, subtitle, headerIcon, showBack, assignmentCount }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="h-screen w-full overflow-hidden px-2.5 py-3 sm:px-4 lg:p-4 bg-background text-foreground">
      <div className="mx-auto flex h-full max-w-[1536px] gap-4 flex-col lg:flex-row">
        
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex h-full flex-1 flex-col gap-4 min-w-0 overflow-hidden">
          {/* Headers */}
          <MobileHeader />
          <PageHeader title={breadcrumb} subtitle={subtitle} icon={headerIcon} showBack={showBack} assignmentCount={assignmentCount} />

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide pb-[110px] lg:pb-0">
            {children}
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
    </ProtectedRoute>
  )
}
