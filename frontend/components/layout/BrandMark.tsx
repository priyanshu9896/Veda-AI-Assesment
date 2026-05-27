import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
  compact?: boolean
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-[0_12px_24px_rgba(0,0,0,0.18)]",
          compact
            ? "bg-[#222224]"
            : "bg-[linear-gradient(135deg,#e34e1c_0%,#1c1c1e_60%)]"
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.5 3L12 21L19.5 3"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-[24px] font-bold tracking-tight text-[#1c1c1e]">
        VedaAI
      </span>
    </div>
  )
}
