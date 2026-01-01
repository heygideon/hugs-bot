"use client";

import { IconCheck, IconCopy } from "@tabler/icons-react";
import Image from "next/image";
import neocatHeart from "@/assets/neocat_heart.png";
import { useCallback, useRef, useState } from "react";

const command = "/give-hug @user";

export default function Home() {
  const [copied, setCopied] = useState(false);
  const copiedTimeout = useRef<number | null>(null);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);

    if (copiedTimeout.current) {
      clearTimeout(copiedTimeout.current);
    }
    copiedTimeout.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimeout.current = null;
    }, 2000);
  }, []);

  return (
    <div className="h-full relative bg-linear-to-br from-rose-200 via-neutral-50 to-red-200 p-8 flex flex-col items-center justify-center">
      <div className="flex gap-x-6 gap-y-4 max-sm:flex-col items-center">
        <Image
          src={neocatHeart}
          alt=""
          className="size-32 animate-bounce rotate-3"
        />
        <div className="max-sm:text-center flex flex-col max-sm:items-center">
          <h1 className="text-4xl font-semibold">send a hug</h1>
          <div className="mt-2 w-fit h-12 gap-2 p-2 flex text-lg items-center bg-white/50 border border-neutral-300 rounded-lg">
            <div className="flex text-neutral-600 select-all items-center px-2">
              <span>{command}</span>
            </div>
            <button
              type="button"
              disabled={copied}
              onClick={copy}
              className="size-8 grid place-items-center not-disabled:hover:bg-neutral-200 transition rounded-sm"
            >
              {copied ? (
                <IconCheck className="size-4 text-rose-700" />
              ) : (
                <IconCopy className="size-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-4">
        <p className="text-neutral-600 text-center text-sm">
          made with affection by{" "}
          <a
            href="https://gideon.sh"
            target="_blank"
            rel="noopener"
            className="text-rose-700 hover:text-rose-900 hover:underline underline-offset-2"
          >
            gideon
          </a>{" "}
          for hack clubbers
        </p>
      </div>
    </div>
  );
}
