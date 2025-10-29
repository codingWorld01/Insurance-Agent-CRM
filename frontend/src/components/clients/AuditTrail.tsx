"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  FileText,
  Edit,
  Trash2,
  Plus,
  Eye,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface AuditLog {
  id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "VIEW";
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedAt: string;
}

interface AuditStats {
  totalChanges: number;
  recentChanges: number;
  changesByAction: Record<string, number>;
  changesByField: Record<string, number>;
  lastModified: string | null;
}

interface AuditTrailProps {
  clientId: string;
  className?: string;
}

const actionIcons = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  VIEW: Eye,
};

const actionColors = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
  VIEW: "bg-gray-100 text-gray-800 border-gray-200",
};

const formatFieldName = (fieldName: string): string => {
  if (!fieldName) return "";

  // Handle nested field names like 'personal.firstName'
  const parts = fieldName.split(".");
  const field = parts[parts.length - 1];

  // Convert camelCase to readable format
  const readable = field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  // Add section prefix for nested fields
  if (parts.length > 1) {
    const section = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    return `${section} - ${readable}`;
  }

  return readable;
};

const formatValue = (value: string | null): string => {
  if (!value) return "Empty";

  // Try to parse JSON for complex values
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object") {
      return Object.entries(parsed)
        .map(([key, val]) => `${key}: ${val}`)
        .join(", ");
    }
  } catch {
    // Not JSON, return as is
  }

  // Truncate long values
  if (value.length > 50) {
    return value.substring(0, 50) + "...";
  }

  return value;
};

export function AuditTrail({ clientId, className }: AuditTrailProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditStats, setAuditStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const fetchAuditLogs = async (
    pageNum: number = 1,
    append: boolean = false
  ) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/enhanced-clients/${clientId}/audit-logs?page=${pageNum}&limit=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();

      if (append) {
        setAuditLogs((prev) => [...prev, ...data.data.auditLogs]);
      } else {
        setAuditLogs(data.data.auditLogs);
      }

      setHasMore(data.data.pagination.page < data.data.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditStats = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `/api/enhanced-clients/${clientId}/audit-stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch audit stats");
      }

      const data = await response.json();
      setAuditStats(data.data);
    } catch (err) {
      console.error("Failed to load audit stats:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAuditLogs();
      await fetchAuditStats();
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchAuditLogs(page + 1, true);
    }
  };

  const renderAuditLogItem = (log: AuditLog) => {
    const ActionIcon = actionIcons[log.action];
    const actionColor = actionColors[log.action];

    return (
      <div key={log.id} className="flex items-start space-x-3 py-3">
        <div className={`p-2 rounded-full ${actionColor}`}>
          <ActionIcon className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={actionColor}>
                {log.action}
              </Badge>
              {log.fieldName && (
                <span className="text-sm font-medium text-gray-900">
                  {formatFieldName(log.fieldName)}
                </span>
              )}
            </div>
            <time
              className="text-xs text-gray-500"
              title={format(new Date(log.changedAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(log.changedAt), {
                addSuffix: true,
              })}
            </time>
          </div>

          {(log.oldValue || log.newValue) && (
            <div className="mt-2 text-sm text-gray-600">
              {log.action === "UPDATE" && log.oldValue && log.newValue && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600 font-medium">From:</span>
                    <span className="bg-red-50 px-2 py-1 rounded text-red-800">
                      {formatValue(log.oldValue)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-600 font-medium">To:</span>
                    <span className="bg-green-50 px-2 py-1 rounded text-green-800">
                      {formatValue(log.newValue)}
                    </span>
                  </div>
                </div>
              )}

              {log.action === "CREATE" && log.newValue && (
                <div className="flex items-center space-x-2">
                  <span className="text-green-600 font-medium">Added:</span>
                  <span className="bg-green-50 px-2 py-1 rounded text-green-800">
                    {formatValue(log.newValue)}
                  </span>
                </div>
              )}

              {log.action === "DELETE" && log.oldValue && (
                <div className="flex items-center space-x-2">
                  <span className="text-red-600 font-medium">Removed:</span>
                  <span className="bg-red-50 px-2 py-1 rounded text-red-800">
                    {formatValue(log.oldValue)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!auditStats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {auditStats.totalChanges}
          </div>
          <div className="text-sm text-blue-800">Total Changes</div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {auditStats.recentChanges}
          </div>
          <div className="text-sm text-green-800">Recent (30 days)</div>
        </div>

        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(auditStats.changesByField).length}
          </div>
          <div className="text-sm text-purple-800">Fields Modified</div>
        </div>

        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-orange-800">
            Last Modified
          </div>
          <div className="text-xs text-orange-600">
            {auditStats.lastModified
              ? formatDistanceToNow(new Date(auditStats.lastModified), {
                  addSuffix: true,
                })
              : "Never"}
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load audit trail</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                fetchAuditLogs();
                fetchAuditStats();
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg">Audit Trail</CardTitle>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="text-xs"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Stats
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {showStats && renderStats()}
      </CardHeader>

      <CardContent className="pt-0">
        {expanded ? (
          <ScrollArea className="h-96">
            <div className="space-y-0">
              {auditLogs.length === 0 && !loading ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No audit logs found</p>
                  <p className="text-sm mt-1">
                    Changes will appear here when the client is modified
                  </p>
                </div>
              ) : (
                <>
                  {auditLogs.map((log, index) => (
                    <React.Fragment key={log.id}>
                      {renderAuditLogItem(log)}
                      {index < auditLogs.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </React.Fragment>
                  ))}

                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMore}
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="space-y-0">
            {auditLogs.slice(0, 3).map((log, index) => (
              <React.Fragment key={log.id}>
                {renderAuditLogItem(log)}
                {index < Math.min(2, auditLogs.length - 1) && (
                  <Separator className="my-2" />
                )}
              </React.Fragment>
            ))}

            {auditLogs.length > 3 && (
              <div className="text-center pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(true)}
                  className="text-xs"
                >
                  View {auditLogs.length - 3} more changes
                </Button>
              </div>
            )}

            {auditLogs.length === 0 && !loading && (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm">No recent changes</p>
              </div>
            )}
          </div>
        )}

        {loading && auditLogs.length === 0 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading audit trail...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AuditTrail;
