import { createFileRoute } from "@tanstack/react-router";
import { handleSlackEvent } from "~/slack";

export const Route = createFileRoute("/api/events")({
  server: {
    handlers: {
      POST: ({ request }) => handleSlackEvent(request),
    },
  },
});
