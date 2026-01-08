"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
} from "lucide-react";
import { useToastNotifications } from "@/hooks/useToastNotifications";
import { formatDistanceToNow } from "date-fns";

interface EmailLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  emailType: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  lead?: {
    name: string;
    email: string;
  };
  emailTemplate: {
    name: string;
    type: string;
  };
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  birthdayWishes: number;
  policyRenewals: number;
  successRate: number;
}

interface UpcomingBirthday {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  nextBirthday: string;
  daysUntil: number;
  type: "client" | "lead";
}

interface UpcomingRenewal {
  id: string;
  expiryDate: string;
  daysUntilExpiry: number;
  client: {
    firstName: string;
    lastName: string;
    email: string;
  };
  policyTemplate: {
    policyNumber: string;
    policyType: string;
    provider: string;
  };
}

interface CronStatus {
  initialized: boolean;
  nextRun: string;
}

export default function EmailAutomationPage() {
  const { showSuccess, showError } = useToastNotifications();
  const [loading, setLoading] = useState(true);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    birthdayWishes: 0,
    policyRenewals: 0,
    successRate: 0,
  });
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<
    UpcomingBirthday[]
  >([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>(
    []
  );
  const [cronStatus, setCronStatus] = useState<CronStatus>({
    initialized: false,
    nextRun: ''
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/email-automation/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const result = await response.json();
      if (result.success) {
        setEmailLogs(result.data.emailLogs);
        setEmailStats(result.data.stats);
        setUpcomingBirthdays(result.data.upcomingBirthdays);
        setUpcomingRenewals(result.data.upcomingRenewals);
        setCronStatus(result.data.cronStatus || { initialized: false, nextRun: '' });
      } else {
        throw new Error(result.message || "Failed to fetch dashboard data");
      }
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Failed to fetch dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SENT":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmailTypeBadge = (type: string) => {
    switch (type) {
      case "BIRTHDAY_WISH":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            🎂 Birthday
          </Badge>
        );
      case "POLICY_RENEWAL":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            📋 Renewal
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Automation</h1>
          <p className="text-muted-foreground">
            Automated emails run daily at 9:00 AM for birthday wishes and policy renewals
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Emails Sent
                </p>
                <p className="text-2xl font-bold">{emailStats.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Failed
                </p>
                <p className="text-2xl font-bold">{emailStats.totalFailed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </p>
                <p className="text-2xl font-bold">{emailStats.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Birthday Wishes
                </p>
                <p className="text-2xl font-bold">
                  {emailStats.birthdayWishes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cron Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automation Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Daily email automation runs automatically at 9:00 AM IST
              </p>
              <p className="text-sm font-medium mt-1">
                Status: {cronStatus.initialized ? (
                  <span className="text-green-600">✅ Active</span>
                ) : (
                  <span className="text-red-600">❌ Inactive</span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Next Run:</p>
              <p className="text-sm font-medium">
                {cronStatus.nextRun || 'Not scheduled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Email History</TabsTrigger>
          <TabsTrigger value="birthdays">Upcoming Birthdays</TabsTrigger>
          <TabsTrigger value="renewals">Upcoming Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {emailLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No email activity found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {log.recipientName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.recipientEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.subject}
                          </TableCell>
                          <TableCell>
                            {getEmailTypeBadge(log.emailType)}
                          </TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.sentAt
                              ? formatDistanceToNow(new Date(log.sentAt), {
                                  addSuffix: true,
                                })
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="birthdays" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Birthdays (Next 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBirthdays.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming birthdays</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBirthdays.map((birthday) => (
                    <div
                      key={birthday.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          🎂
                        </div>
                        <div>
                          <div className="font-medium">{birthday.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {birthday.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {birthday.daysUntil === 0
                            ? "Today!"
                            : `${birthday.daysUntil} days`}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(birthday.nextBirthday).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Policy Renewals (Next 60 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRenewals.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming renewals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingRenewals.map((renewal) => (
                    <div
                      key={renewal.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            renewal.daysUntilExpiry <= 7
                              ? "bg-red-100"
                              : renewal.daysUntilExpiry <= 30
                              ? "bg-yellow-100"
                              : "bg-blue-100"
                          }`}
                        >
                          {renewal.daysUntilExpiry <= 7
                            ? "🚨"
                            : renewal.daysUntilExpiry <= 30
                            ? "⚠️"
                            : "📋"}
                        </div>
                        <div>
                          <div className="font-medium">
                            {renewal.client.firstName} {renewal.client.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {renewal.policyTemplate.policyType} -{" "}
                            {renewal.policyTemplate.policyNumber}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {renewal.client.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            renewal.daysUntilExpiry <= 7
                              ? "text-red-600"
                              : renewal.daysUntilExpiry <= 30
                              ? "text-yellow-600"
                              : "text-blue-600"
                          }`}
                        >
                          {renewal.daysUntilExpiry} days
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(renewal.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
