"use client";

import Image from "next/image";
import neocatHeart from "@/assets/neocat_heart.png";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";

const end = dayjs("2026-10-29T22:00:00.000Z");

export default function Home() {
  const [date, setDate] = useState(() => dayjs());
  useEffect(() => {
    const interval = setInterval(() => {
      setDate(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const seconds = end.diff(dayjs(), "second");
      if (seconds > 60) return;

      const req = await fetch("/leaderboard", { redirect: "manual" });
      if (req.ok || (!req.ok && req.type === "opaqueredirect")) {
        window.location.reload();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    const hours = Math.max(0, end.diff(date, "hour"));
    const minutes = Math.max(0, end.diff(date, "minute") % 60);
    const seconds = Math.max(0, end.diff(date, "second") % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  }, [date]);

  return (
    <div className="h-full p-8 flex flex-col items-center justify-center">
      <div>
        <Image
          src={neocatHeart}
          alt=""
          className="size-16 animate-bounce rotate-3"
        />
        <p className="mt-2 text-xl text-neutral-500 dark:text-neutral-400">
          something new is <em>within reach...</em>
        </p>
        <p className="font-heading tabular-nums mt-1 text-5xl font-semibold">
          {countdown}
        </p>
      </div>
    </div>
  );
}
