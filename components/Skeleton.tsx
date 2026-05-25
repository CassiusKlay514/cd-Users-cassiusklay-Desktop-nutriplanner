"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

/**
 * Skeleton primitive : bloc gris animé.
 * Pas de variantes spécifiques pour rester composable.
 */
export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-gray-100 rounded-lg",
        shimmer && "skeleton-shimmer",
        className
      )}
    />
  );
}

/**
 * Card recette en mode loading
 */
export function RecipeCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <Skeleton className="aspect-square rounded-none rounded-t-2xl" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-2.5 w-14" />
        </div>
      </div>
    </div>
  );
}

/**
 * Ligne de repas / item liste en mode loading
 */
export function MealRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-200">
      <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Card produit catalogue en mode loading
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-2.5 w-1/2" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded-md" />
        ))}
      </div>
    </div>
  );
}

/**
 * Ligne shopping-list item en mode loading
 */
export function ShoppingItemSkeleton() {
  return (
    <div className="p-3 flex items-center gap-3 border-b border-gray-100 last:border-0">
      <Skeleton className="w-6 h-6 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-2.5 w-1/3" />
      </div>
    </div>
  );
}
