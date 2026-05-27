import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-150 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-zinc-900 text-white shadow-card hover:bg-zinc-800",
        secondary:
          "bg-surface-strong text-foreground shadow-card hover:bg-surface",
        ghost: "bg-transparent hover:bg-black/5",
        accent:
          "border-[1.5px] border-[#ff6136] bg-zinc-900 text-white shadow-[0_4px_20px_rgba(255,97,54,0.15)] hover:bg-black",
        outline: "border border-border bg-transparent text-foreground hover:bg-black/5",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-9 px-4",
        md: "h-12 px-6",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }), loading && "opacity-70 pointer-events-none")}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!loading && rightIcon ? rightIcon : null}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
