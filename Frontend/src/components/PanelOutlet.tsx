import { Suspense } from "react";
import { Outlet } from "react-router-dom";

export default function PanelOutlet() {
  return (
    <Suspense fallback={
      <div role="status" aria-label="Loading page" className="space-y-4 py-2">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    }>
      <Outlet />
    </Suspense>
  );
}
