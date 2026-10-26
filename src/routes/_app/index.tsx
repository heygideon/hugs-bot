import { createFileRoute } from "@tanstack/react-router";
import neocatHeart from "~/assets/images/neocat_heart.png";

export const Route = createFileRoute("/_app/")({ component: Home });

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
      <p className="mt-4 text-2xl text-neutral-600">
        send hugs in the Hack Club Slack!
      </p>
    </>
  );
}
