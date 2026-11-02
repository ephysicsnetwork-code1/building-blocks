import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/admin/delivery-question")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleDeliveryQuestion } = await import("@/lib/delivery-ai.server");
    return handleDeliveryQuestion(request);
  } } },
});