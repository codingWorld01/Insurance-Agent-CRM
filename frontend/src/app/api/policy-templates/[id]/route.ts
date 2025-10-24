import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Invalid token" },
        { status: 401 }
      );
    }

    const token = request.headers.get("authorization");
    const { id: templateId } = await params;

    // Get policy template details
    const templateResponse = await fetch(
      `${process.env.BACKEND_URL}/api/policy-templates/${templateId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!templateResponse.ok) {
      const errorData = await templateResponse.json();
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to fetch policy template" },
        { status: templateResponse.status }
      );
    }

    const templateResult = await templateResponse.json();

    if (!templateResult.success) {
      return NextResponse.json(
        { success: false, message: templateResult.message || "Failed to fetch policy template" },
        { status: 400 }
      );
    }

    // Get associated clients/instances
    const instancesResponse = await fetch(
      `${process.env.BACKEND_URL}/api/policy-templates/${templateId}/clients`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    let instances = [];
    let stats = null;

    if (instancesResponse.ok) {
      const instancesResult = await instancesResponse.json();
      if (instancesResult.success) {
        instances = instancesResult.data.instances || [];
        stats = instancesResult.data.stats || null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        template: templateResult.data,
        instances,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching policy template details:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Invalid token" },
        { status: 401 }
      );
    }

    const token = request.headers.get("authorization");
    const { id: templateId } = await params;
    const body = await request.json();

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/policy-templates/${templateId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to update policy template" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating policy template:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: authResult.message || "Invalid token" },
        { status: 401 }
      );
    }

    const token = request.headers.get("authorization");
    const { id: templateId } = await params;

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/policy-templates/${templateId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || "Failed to delete policy template" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting policy template:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}