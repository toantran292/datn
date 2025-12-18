import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/**
 * AI Estimate Points API Route (Non-streaming)
 *
 * Proxies requests to the backend NestJS service
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward request to backend non-streaming endpoint
    const response = await fetch(`${BACKEND_URL}/api/ai/estimate-points`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("AI estimate points error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error instanceof Error ? error.message : "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
