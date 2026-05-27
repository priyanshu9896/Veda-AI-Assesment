import { cn } from '@/lib/utils'

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0",
          compact
            ? "bg-[#222224]"
            : "bg-[linear-gradient(135deg,#ff8b25_0%,#ff7d2a_28%,#5b171d_72%,#161618_100%)] shadow-[0_12px_24px_rgba(0,0,0,0.18)]"
        )}
      >
        <span className="text-white font-bold text-xl leading-none">V</span>
      </div>
      <span className="font-bold text-[30px] tracking-[-0.04em] text-[#242426] leading-none">
        VedaAI
      </span>
    </div>
  )
}
