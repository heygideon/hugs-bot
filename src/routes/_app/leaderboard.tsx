import {
  keepPreviousData,
  noop,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import type z from "zod";
import { getLeaderboard } from "~/actions/leaderboard";
import { leaderboardSchema } from "~/actions/leaderboard/schemas";

const leaderboardQuery = (data: z.infer<typeof leaderboardSchema>) =>
  queryOptions({
    queryKey: ["leaderboard", data],
    queryFn: ({ signal }) => getLeaderboard({ data, signal }),
  });

export const Route = createFileRoute("/_app/leaderboard")({
  validateSearch: leaderboardSchema,
  loaderDeps: ({ search }) => ({ search }),
  loader: ({ deps: { search }, context: { queryClient } }) => {
    void queryClient.query(leaderboardQuery(search)).catch(noop);
  },
  component: Home,
});

function Home() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data, isPlaceholderData } = useQuery({
    ...leaderboardQuery(search),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <h1 className="font-heading text-4xl font-semibold">leaderboard</h1>
      <div className="mt-6 flex gap-2">
        <select
          value={search.type}
          onChange={(ev) =>
            navigate({
              search: (prev) => ({ ...prev, type: ev.target.value as any }),
            })
          }
          className="flex h-10 w-32 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg shadow-xs"
        >
          <option value="hug">hugs</option>
        </select>
        <select
          value={search.view}
          onChange={(ev) =>
            navigate({
              search: (prev) => ({ ...prev, view: ev.target.value as any }),
            })
          }
          className="flex h-10 w-32 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg shadow-xs"
        >
          <option value="send">senders</option>
          <option value="receive">receivers</option>
          <option value="return">returners</option>
        </select>
        <input
          type="text"
          placeholder="to..."
          className="flex h-10 w-64 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg shadow-xs"
        />
      </div>
      {!data ? (
        <div className="mt-6 border-t border-neutral-200 mask-b-from-0">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex h-14 items-center gap-2.5 border-b border-neutral-200"
            >
              <div className="h-3.5 w-7 animate-pulse rounded-sm bg-neutral-200" />
              <div className="size-8 animate-pulse rounded-full bg-neutral-200" />
              <div className="h-5 w-32 animate-pulse rounded-sm bg-neutral-200" />
              <div className="min-w-0 flex-1" />
              <div className="h-5 w-8 animate-pulse rounded-sm bg-neutral-200" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={clsx(
            "mt-6 border-t border-neutral-200 transition-opacity",
            isPlaceholderData && "opacity-50",
          )}
        >
          {data.map((row, idx) => (
            <div
              key={row.userId}
              className="flex h-14 items-center gap-2.5 border-b border-neutral-200"
            >
              <p className="w-7 text-neutral-500">#{idx + 1}</p>
              <img
                src={row.user.imageUrl}
                width="32"
                height="32"
                className="rounded-full border border-neutral-200"
              />
              <p className="min-w-0 flex-1 truncate text-xl">
                {row.user.displayName}
              </p>
              <p className="text-xl font-semibold">{row.count}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
