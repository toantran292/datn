import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * AI Breakdown API Route with HTTP Streaming (Server-Sent Events)
 *
 * Proxies streaming requests to the backend NestJS service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to backend streaming endpoint
    const response = await fetch(`${BACKEND_URL}/api/ai/breakdown-issue-stream`, {
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
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
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
