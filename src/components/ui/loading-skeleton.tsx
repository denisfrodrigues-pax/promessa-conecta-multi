import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "table" | "profile" | "stats" | "form" | "hero";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({ variant = "card", count = 1, className }: LoadingSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);

  switch (variant) {
    case "hero":
      return (
        <div className={cn("space-y-8", className)}>
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      );

    case "stats":
      return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
          {items.map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border/50 bg-card">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      );

    case "profile":
      return (
        <div className={cn("space-y-6", className)}>
          <div className="flex items-center gap-4 p-6 rounded-2xl border border-border/50 bg-card">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-border/50 bg-card space-y-4">
            <Skeleton className="h-5 w-48 mb-6" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      );

    case "form":
      return (
        <div className={cn("p-6 rounded-2xl border border-border/50 bg-card space-y-4", className)}>
          <Skeleton className="h-6 w-48 mb-4" />
          {items.map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <Skeleton className="h-11 w-full rounded-xl mt-6" />
        </div>
      );

    case "table":
      return (
        <div className={cn("rounded-2xl border border-border/50 bg-card overflow-hidden", className)}>
          <div className="p-4 border-b border-border/50">
            <Skeleton className="h-11 w-full max-w-sm rounded-xl" />
          </div>
          <div className="p-4 space-y-3">
            {items.map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      );

    case "list":
      return (
        <div className={cn("space-y-3", className)}>
          {items.map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border/50 bg-card">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case "card":
    default:
      return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
          {items.map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card">
              <div className="flex items-start gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
  }
}

// Page-specific loading skeletons
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <LoadingSkeleton variant="table" count={6} />
    </div>
  );
}

export function FormPageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <LoadingSkeleton variant="form" count={5} />
    </div>
  );
}

export function MemberHomeSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[420px] w-full rounded-xl" />
      <div className="container mx-auto px-4 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-border/50 bg-card">
              <div className="flex flex-col items-center">
                <Skeleton className="w-12 h-12 rounded-xl mb-3" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
          <LoadingSkeleton variant="list" count={3} />
        </div>
      </div>
    </div>
  );
}