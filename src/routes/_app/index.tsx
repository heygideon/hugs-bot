import { useClipboard } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { ArrowRightIcon, CheckIcon, CopyIcon } from "lucide-react";
import neocatHeart from "~/assets/images/neocat_heart.png";

export const Route = createFileRoute("/_app/")({ component: Home });

function CopyButton({ text }: { text: string }) {
  const { copy, copied } = useClipboard();

  return (
    <button
      onClick={() => copy(text)}
      disabled={copied}
      className={clsx(
        "-mr-px grid size-7 place-items-center rounded-xs",
        copied
          ? "text-rose-600 dark:text-rose-400"
          : "text-neutral-500 transition hover:bg-neutral-200 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300",
      )}
    >
      {copied ? (
        <CheckIcon strokeWidth={2.5} className="size-4" />
      ) : (
        <CopyIcon strokeWidth={2.5} className="size-4" />
      )}
    </button>
  );
}

function Home() {
  return (
    <>
      <img
        src={neocatHeart}
        alt=""
        width="64"
        height="64"
        className="rotate-6 animate-bounce"
      />
      <h1 className="font-heading mt-2 text-5xl font-semibold">hugs-bot</h1>
      <p className="mt-4 text-2xl text-neutral-500 dark:text-neutral-400">
        send hugs in the Hack Club Slack!
      </p>

      <div className="mt-8 grid grid-cols-1 gap-x-4 @2xl:grid-cols-2">
        <div className="border-y border-neutral-200 pt-4 pb-5 dark:border-neutral-700">
          <p className="text-xl font-semibold">send a hug</p>
          <div className="mt-2 flex h-10 max-w-fit items-center gap-2 rounded-md border border-neutral-200 bg-white pr-1.5 pl-3 shadow-xs dark:border-neutral-700 dark:bg-neutral-800">
            <p className="font-mono">/give-hug</p>
            <CopyButton text="/give-hug" />
          </div>
        </div>
        <div className="border-b border-neutral-200 pt-4 pb-5 @2xl:border-t dark:border-neutral-700">
          <p className="text-xl font-semibold">send a hug, and pre-fill user</p>
          <div className="mt-2 flex h-10 max-w-fit items-center gap-3 rounded-md border border-neutral-200 bg-white pr-1.5 pl-3 shadow-xs dark:border-neutral-700 dark:bg-neutral-800">
            <p className="font-mono">
              /give-hug{" "}
              <span className="text-rose-600 dark:text-rose-400">@user</span>
            </p>
            <CopyButton text="/give-hug @user" />
          </div>
        </div>
      </div>

      <p className="mt-6 text-xl text-neutral-500 dark:text-neutral-400">
        see the hugs other people are sending in{" "}
        <a
          href="https://hackclub.enterprise.slack.com/archives/C09RR27E2HL" // -> #hugs
          className="group inline-flex items-center gap-1 font-semibold text-rose-600 underline-offset-2 transition hover:text-rose-800 hover:underline dark:text-rose-400 dark:hover:text-rose-200"
        >
          #hugs{" "}
          <ArrowRightIcon
            strokeWidth={2.5}
            className="mt-0.5 size-4 transition-transform group-hover:translate-x-px"
          />
        </a>
      </p>
    </>
  );
}
