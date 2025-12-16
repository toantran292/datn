import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:41003";

/**
 * Create presigned URL for document upload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/ai/documents/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to create upload URL" }));
      return NextResponse.json(
        { message: error.message || "Failed to create upload URL" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Upload URL creation error:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
