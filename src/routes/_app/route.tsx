import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-y-auto p-12">
        <Outlet />
      </div>
      <div className="p-12 pl-0">
        <div className="h-full w-64 border-l border-l-neutral-200 pl-6">
          <div className="space-y-3">
            <Link
              to="/"
              className="block text-3xl tracking-tight text-neutral-500"
              activeProps={{
                className: "font-semibold !text-rose-600",
              }}
            >
              Home
            </Link>
            <Link
              to="/leaderboard"
              className="block text-3xl tracking-tight text-neutral-500"
              activeProps={{
                className: "font-semibold !text-rose-600",
              }}
            >
              Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
