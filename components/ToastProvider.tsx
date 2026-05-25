"use client";

import { Toaster } from "sonner";

/**
 * Toast notifications globales pour NutriPlanner.
 * Usage : import { toast } from "sonner"; toast.success("Plan régénéré");
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      expand={false}
      duration={3500}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-gray-500 text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-xs",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:rounded-full group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:text-xs",
          success: "group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-900 group-[.toaster]:!border-emerald-200",
          error: "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-200",
          info: "group-[.toaster]:!bg-blue-50 group-[.toaster]:!text-blue-900 group-[.toaster]:!border-blue-200",
          warning: "group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-900 group-[.toaster]:!border-amber-200",
        },
      }}
    />
  );
}
