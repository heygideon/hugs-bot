import {
  createFileRoute,
  Link,
  Outlet,
  useMatch,
} from "@tanstack/react-router";
import clsx from "clsx";
import SiGithub from "~/components/icons/SiGithub";

function NavLinks() {
  return (
    <>
      <Link
        to="/"
        className="ease-in-out-expo block flex-none text-3xl tracking-tight text-neutral-500 transition-[color,font-weight] duration-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        activeProps={{
          className: "font-semibold !text-rose-600 dark:!text-rose-400",
        }}
      >
        Home
      </Link>
      <Link
        to="/leaderboard"
        className="ease-in-out-expo block flex-none text-3xl tracking-tight text-neutral-500 transition-[color,font-weight] duration-300 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        activeProps={{
          className: "font-semibold !text-rose-600 dark:!text-rose-400",
        }}
      >
        Leaderboard
      </Link>
    </>
  );
}
function FooterLinks() {
  return (
    <>
      <a
        href="https://hackclub.enterprise.slack.com/team/U09D42Q0ARJ"
        className="flex items-center gap-2 text-xl text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <img
          src="https://avatars.githubusercontent.com/u/47083178"
          alt=""
          width="24"
          height="24"
          className="rounded-full border border-neutral-200 dark:border-neutral-700"
        />
        made by gideon
      </a>
      <a
        href="https://github.com/heygideon/hugs-bot"
        className="flex items-center gap-2 text-xl text-neutral-500 underline-offset-2 hover:text-neutral-700 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <SiGithub className="size-6" />
        heygideon/hugs-bot
      </a>
    </>
  );
}

export const Route = createFileRoute("/_app")({
  component: RouteComponent,
});

function RouteComponent() {
  const leaderboardMatch = useMatch({
    from: "/_app/leaderboard",
    shouldThrow: false,
  });

  return (
    <div className="@container flex h-full">
      <div className="min-w-0 flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mb-8 flex gap-6 border-b border-neutral-200 pb-4 lg:hidden dark:border-neutral-700">
          <NavLinks />
        </div>
        <Outlet />
        <div className="mt-8 flex flex-wrap gap-6 gap-y-3 lg:hidden">
          <FooterLinks />
        </div>
      </div>
      <div className="p-12 pl-0 max-lg:hidden">
        <div className="relative flex h-full w-64 flex-col border-l border-neutral-200 pl-6 dark:border-neutral-700">
          <div
            className={clsx(
              "ease-in-out-expo absolute top-1.75 -left-0.5 h-6 w-0.75 bg-rose-600 transition-transform duration-300 dark:bg-rose-400",
              leaderboardMatch ? "translate-y-12" : "translate-y-0",
            )}
          ></div>
          <div className="grow space-y-3">
            <NavLinks />
          </div>
          <div className="space-y-2">
            <FooterLinks />
          </div>
        </div>
      </div>
    </div>
  );
}
