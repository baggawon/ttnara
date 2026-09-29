import { userUpdateEmitter } from "@/lib/eventEmitter";

// A write to a dead socket is what makes the stream notice the client left, so
// ping regularly; otherwise an idle connection's listener would live forever.
const HEARTBEAT_MS = 25_000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return new Response("User ID is required", { status: 400 });
  }

  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      // Handle user updates
      const handleUserUpdate = (data: { userId: string; data: any }) => {
        if (data.userId === userId || data.userId === "관리자") {
          send(`data: ${JSON.stringify(data)}\n\n`);
        }
      };

      const heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS);

      // Runs from whichever fires first: cancel, abort, or a failed write.
      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        userUpdateEmitter.off("userUpdate", handleUserUpdate);
        request.signal.removeEventListener("abort", cleanup);
      };

      userUpdateEmitter.on("userUpdate", handleUserUpdate);
      request.signal.addEventListener("abort", cleanup);

      // Send initial ping
      send(": ping\n\n");
    },

    cancel() {
      cleanup();
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
