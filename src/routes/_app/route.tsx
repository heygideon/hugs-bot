import {
  createFileRoute,
  Link,
  Outlet,
  useMatch,
} from "@tanstack/react-router";
import clsx from "clsx";
import SiGithub from "~/components/icons/SiGithub";

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  const leaderboardMatch = useMatch({
    from: "/_app/leaderboard",
    shouldThrow: false,
  });

  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-y-auto p-12">
        <Outlet />
      </div>
      <div className="p-12 pl-0">
        <div className="relative flex h-full w-64 flex-col border-l border-l-neutral-200 pl-6">
          <div
            className={clsx(
              "ease-in-out-expo absolute top-1.75 -left-0.5 h-6 w-0.75 bg-rose-600 transition-transform duration-300",
              leaderboardMatch ? "translate-y-12" : "translate-y-0",
            )}
          ></div>
          <div className="grow space-y-3">
            <Link
              to="/"
              className="ease-in-out-expo block text-3xl tracking-tight text-neutral-500 transition-[color,font-weight] duration-300 hover:text-neutral-700"
              activeProps={{
                className: "font-semibold !text-rose-600",
              }}
            >
              Home
            </Link>
            <Link
              to="/leaderboard"
              className="ease-in-out-expo block text-3xl tracking-tight text-neutral-500 transition-[color,font-weight] duration-300 hover:text-neutral-700"
              activeProps={{
                className: "font-semibold !text-rose-600",
              }}
            >
              Leaderboard
            </Link>
          </div>
          <div className="space-y-2">
            <a
              href="https://hackclub.enterprise.slack.com/team/U09D42Q0ARJ"
              className="flex items-center gap-2 text-xl text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline"
            >
              <img
                src="https://avatars.githubusercontent.com/u/47083178"
                alt=""
                width="24"
                height="24"
                className="rounded-full border border-neutral-200"
              />
              made by gideon
            </a>
            <a
              href="https://github.com/heygideon/hugs-bot"
              className="flex items-center gap-2 text-xl text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline"
            >
              <SiGithub className="size-6" />
              heygideon/hugs-bot
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
