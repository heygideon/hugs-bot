import {
  ListboxButton as ListboxButtonBase,
  ListboxOptions as ListboxOptionsBase,
  ListboxOption as ListboxOptionBase,
  type ListboxButtonProps,
  type ListboxOptionsProps,
  type ListboxOptionProps,
} from "@headlessui/react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import clsx from "clsx";
import type { ReactNode } from "react";

export { Listbox } from "@headlessui/react";

export function ListboxButton({
  className,
  children,
  ...props
}: ListboxButtonProps & { children: ReactNode }) {
  return (
    <ListboxButtonBase
      {...props}
      className={clsx(
        "flex h-10 w-40 items-center rounded-md border border-neutral-200 bg-white px-3 text-lg shadow-xs",
        className,
      )}
    >
      {children}
      <span className="min-w-0 flex-1"></span>
      <ChevronsUpDownIcon strokeWidth={2.5} className="size-3.5 flex-none" />
    </ListboxButtonBase>
  );
}
export function ListboxOptions({ className, ...props }: ListboxOptionsProps) {
  return (
    <ListboxOptionsBase
      {...props}
      anchor={{
        to: "bottom start",
        gap: 4,
      }}
      transition
      className={clsx(
        "w-(--button-width) origin-top rounded-md border border-neutral-200 bg-white p-1 text-lg shadow-xs transition outline-none data-closed:scale-y-95 data-closed:opacity-0",
        className,
      )}
    />
  );
}
export function ListboxOption({
  className,
  children,
  ...props
}: ListboxOptionProps) {
  return (
    <ListboxOptionBase
      {...props}
      className={clsx(
        "group flex h-9 items-center gap-1.5 rounded-xs px-2 outline-none data-focus:bg-rose-200 data-selected:font-semibold",
        className,
      )}
    >
      {({ selected }) => (
        <>
          {selected ? (
            <CheckIcon
              strokeWidth={2.5}
              className="mt-0.5 size-3.5 flex-none"
            />
          ) : (
            <span className="w-3.5 flex-none" />
          )}
          {children}
        </>
      )}
    </ListboxOptionBase>
  );
}
