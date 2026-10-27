import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import {
  keepPreviousData,
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import clsx from "clsx";
import { getUser, searchUsers } from "~/actions/users";

const userQuery = (id: string | null) =>
  queryOptions({
    queryKey: ["flaron", "user", id],
    queryFn: () => getUser({ data: id! }),
    enabled: !!id,
  });
const userSearchQuery = (q: string) =>
  queryOptions({
    queryKey: ["flaron", "search", q],
    queryFn: async ({ client }) => {
      // TODO: only show users in db
      const users = await searchUsers({ data: q });
      for (const user of users) {
        client.setQueryData(userQuery(user.id).queryKey, user);
      }
      return users;
    },
    enabled: !!q,
    placeholderData: keepPreviousData,
  });

export default function UserCombobox({
  value,
  onChange,
  placeholder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const { data, isPlaceholderData: _isPlaceholderData } = useQuery(
    userSearchQuery(debouncedQuery),
  );
  const isPlaceholderData = useMemo(
    () => _isPlaceholderData || query !== debouncedQuery,
    [_isPlaceholderData, query, debouncedQuery],
  );

  const { data: current } = useQuery(userQuery(value));

  return (
    <Combobox
      as="div"
      value={value}
      onChange={(v) => {
        setQuery("");
        onChange(v);
      }}
    >
      <div className="relative">
        <div
          className={clsx(
            "absolute top-2 left-2 size-6 overflow-clip rounded-full border border-neutral-300 transition-opacity",
            query && "opacity-50",
          )}
        >
          {current && (
            <img
              src={`https://cachet.hackclub.com/users/${current.id}/r`}
              alt=""
              height="24"
              width="24"
              className="size-full"
            />
          )}
        </div>
        <ComboboxInput
          onChange={(ev) => setQuery(ev.target.value)}
          displayValue={() => current?.display_name || ""}
          placeholder={placeholder}
          className="flex h-10 w-64 items-center rounded-md border border-neutral-200 bg-white px-3 pl-9.5 text-lg shadow-xs"
        />
      </div>
      <ComboboxOptions
        anchor={{
          to: "bottom start",
          gap: 4,
        }}
        transition
        className="w-(--input-width) origin-top rounded-md border border-neutral-200 bg-white p-1 text-lg shadow-xs transition outline-none data-closed:scale-y-95 data-closed:opacity-0"
      >
        {!query ? (
          <p className="px-2 py-1 text-neutral-500">
            start typing to search...
          </p>
        ) : !data ? (
          <p className="px-2 py-1 text-neutral-500">loading...</p>
        ) : data.length === 0 ? (
          <p className="px-2 py-1 text-neutral-500">no hugged users found</p>
        ) : (
          data.map((user) => (
            <ComboboxOption
              value={user.id}
              className={clsx(
                "group flex h-9 items-center gap-1.5 rounded-xs px-2 transition-opacity outline-none data-focus:bg-rose-200 data-selected:font-semibold",
                isPlaceholderData && "opacity-50",
              )}
            >
              <img
                src={`https://cachet.hackclub.com/users/${user.id}/r`}
                alt=""
                height="24"
                width="24"
                className="rounded-full border border-neutral-300"
              />
              <span className="min-w-0 flex-1 truncate">
                {user.display_name || user.name}
              </span>
            </ComboboxOption>
          ))
        )}
      </ComboboxOptions>
    </Combobox>
  );
}
