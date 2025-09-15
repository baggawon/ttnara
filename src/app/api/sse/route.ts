import { userUpdateEmitter } from "@/lib/eventEmitter";

// Track active connections globally
const activeConnections = new Map<string, ReadableStreamDefaultController>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("User ID is required", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Register this connection
      activeConnections.set(userId, controller);

      // Send initial ping
      controller.enqueue(encoder.encode(": ping\n\n"));

      // Handle user updates
      const handleUserUpdate = (data: { userId: string; data: any }) => {
        if (data.userId === userId || data.userId === "관리자") {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          } catch (error) {
            console.error("Error in SSE:", error);
            cleanup();
          }
        }
      };

      const cleanup = () => {
        // Remove from active connections
        activeConnections.delete(userId);

        // Remove event listener
        userUpdateEmitter.off("userUpdate", handleUserUpdate);
      };

      // Listen for user updates
      userUpdateEmitter.on("userUpdate", handleUserUpdate);

      // Clean up on abort
      request.signal.addEventListener("abort", cleanup);

      return cleanup;
    },

    cancel() {
      // Just remove from active connections
      activeConnections.delete(userId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
