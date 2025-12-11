import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Default - promessa primary
        default: "border-promessa-200 bg-promessa-100 text-promessa-800",
        // Secondary - neutro
        secondary: "border-neutral-200 bg-neutral-100 text-neutral-700",
        // Destructive - crítico (admin, erro)
        destructive: "border-red-200 bg-red-100 text-red-800",
        // Outline
        outline: "border-neutral-300 bg-transparent text-neutral-700",
        // Success - verde promessa (ativo, confirmado, membro, voluntario)
        success: "border-promessa-300 bg-promessa-100 text-promessa-800",
        // Warning - atenção (pendente)
        warning: "border-amber-300 bg-amber-100 text-amber-800",
        // Info - azul suave (neutro/info)
        info: "border-blue-300 bg-blue-100 text-blue-800",
        // Promessa branded
        promessa: "border-promessa-300 bg-promessa-50 text-promessa-700",
        // Lider - laranja
        lider: "border-orange-300 bg-orange-100 text-orange-800",
        // Admin - vermelho
        admin: "border-red-300 bg-red-100 text-red-800",
        // Voluntario - verde
        voluntario: "border-promessa-300 bg-promessa-100 text-promessa-800",
        // Membro - azul
        membro: "border-blue-300 bg-blue-100 text-blue-800",
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
