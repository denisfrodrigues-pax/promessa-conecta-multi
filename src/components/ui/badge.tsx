import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "border-transparent bg-secondary/80 text-secondary-foreground hover:bg-secondary",
        destructive: "border-transparent bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive",
        outline: "text-foreground border-border/60 bg-background hover:bg-muted/50",
        success: "border-promessa/20 bg-promessa/10 text-promessa-dark hover:bg-promessa/15",
        warning: "border-amber-500/20 bg-amber-100 text-amber-800 hover:bg-amber-200/80 dark:bg-amber-900/30 dark:text-amber-400",
        info: "border-blue-500/20 bg-blue-100 text-blue-800 hover:bg-blue-200/80 dark:bg-blue-900/30 dark:text-blue-400",
        promessa: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
