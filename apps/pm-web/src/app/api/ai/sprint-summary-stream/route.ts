import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:41003";

/**
 * AI Sprint Summary Stream API Route
 *
 * Proxies streaming requests to the backend NestJS service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to backend streaming endpoint
    const response = await fetch(`${BACKEND_URL}/api/ai/sprint-summary-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    // Pass through the SSE stream from backend
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("Sprint summary stream proxy error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
