import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const searchParamsString = new URLSearchParams();
    
    // Forward all query parameters to the backend
    searchParams.forEach((value, key) => {
      searchParamsString.append(key, value);
    });

    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/clients/${params.id}/audit-logs?${searchParamsString}`;
    
    const response = await fetch(backendUrl, {
      headers: {
        'Content-Type': 'application/json',
        // If you have authentication, add the token here
        // 'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs. Please try again later.",
      },
      { status: 500 }
    );
  }
}
