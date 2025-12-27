import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "../../../../../../backend/src/services/auditService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const result = await AuditService.getClientAuditLogs(params.id, {
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        auditLogs: result.logs,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
          limit,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch audit logs",
      },
      { status: 500 }
    );
  }
}
