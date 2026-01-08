"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MessageCircle,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
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

interface WhatsAppLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  messageType: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  client?: {
    firstName: string;
    lastName: string;
    whatsappNumber: string;
  };
  lead?: {
    name: string;
    whatsappNumber: string;
  };
  whatsappTemplate: {
    name: string;
    templateName: string;
  };
}

interface EmailStats {
  totalSent: number;
  totalFailed: number;
  birthdayWishes: number;
  policyRenewals: number;
  successRate: number;
}

interface WhatsAppStats {
  totalSent: number;
  totalFailed: number;
  birthdayWishes: number;
  policyRenewals: number;
  successRate: number;
}

interface UpcomingBirthday {
  id: string;
  name: string;
  email?: string;
  whatsappNumber?: string;
  dateOfBirth: string;
  nextBirthday: string;
  daysUntil: number;
  type: "client" | "lead";
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

interface UpcomingRenewal {
  id: string;
  expiryDate: string;
  daysUntilExpiry: number;
  client: {
    firstName: string;
    lastName: string;
    email?: string;
    whatsappNumber?: string;
  };
  policyTemplate: {
    policyNumber: string;
    policyType: string;
    provider: string;
  };
  hasEmail: boolean;
  hasWhatsApp: boolean;
}

export default function AutomationPage() {
  const { showError } = useToastNotifications();
  const [loading, setLoading] = useState(true);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [whatsappLogs, setWhatsAppLogs] = useState<WhatsAppLog[]>([]);
  const [emailStats, setEmailStats] = useState<EmailStats>({
    totalSent: 0,
    totalFailed: 0,
    birthdayWishes: 0,
    policyRenewals: 0,
    successRate: 0,
  });
  const [whatsappStats, setWhatsAppStats] = useState<WhatsAppStats>({
    totalSent: 0,
    totalFailed: 0,
    birthdayWishes: 0,
    policyRenewals: 0,
    successRate: 0,
  });
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<UpcomingBirthday[]>([]);
  const [upcomingRenewals, setUpcomingRenewals] = useState<UpcomingRenewal[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      
      // Fetch both email and WhatsApp data
      const [emailResponse, whatsappResponse] = await Promise.all([
        fetch("/api/email-automation/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch("/api/whatsapp-automation/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      ]);

      if (!emailResponse.ok || !whatsappResponse.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [emailResult, whatsappResult] = await Promise.all([
        emailResponse.json(),
        whatsappResponse.json()
      ]);

      if (emailResult.success) {
        setEmailLogs(emailResult.data.emailLogs);
        setEmailStats(emailResult.data.stats);
      }

      if (whatsappResult.success) {
        setWhatsAppLogs(whatsappResult.data.whatsappLogs);
        setWhatsAppStats(whatsappResult.data.stats);
      }

      // Combine upcoming events from both sources
      const combinedBirthdays = [
        ...(emailResult.data?.upcomingBirthdays || []),
        ...(whatsappResult.data?.upcomingBirthdays || [])
      ];
      
      const combinedRenewals = [
        ...(emailResult.data?.upcomingRenewals || []),
        ...(whatsappResult.data?.upcomingRenewals || [])
      ];

      // Remove duplicates based on ID
      const uniqueBirthdays = combinedBirthdays.filter((birthday, index, self) => 
        index === self.findIndex(b => b.id === birthday.id)
      );
      
      const uniqueRenewals = combinedRenewals.filter((renewal, index, self) => 
        index === self.findIndex(r => r.id === renewal.id)
      );

      setUpcomingBirthdays(uniqueBirthdays);
      setUpcomingRenewals(uniqueRenewals);

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

  const getMessageTypeBadge = (type: string) => {
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

  const getDaysUntilBadge = (days: number) => {
    if (days === 0) {
      return <Badge className="bg-red-100 text-red-800">Today</Badge>;
    } else if (days === 1) {
      return <Badge className="bg-orange-100 text-orange-800">Tomorrow</Badge>;
    } else if (days <= 7) {
      return <Badge className="bg-yellow-100 text-yellow-800">{days} days</Badge>;
    } else {
      return <Badge variant="outline">{days} days</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading automation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Communication Automation
          </h1>
          <p className="text-gray-600 mt-2">
            Manage automated emails and WhatsApp messages for birthdays and policy renewals
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Messages</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailStats.totalSent}</div>
            <p className="text-xs text-muted-foreground">
              {emailStats.totalFailed} failed • {emailStats.successRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whatsappStats.totalSent}</div>
            <p className="text-xs text-muted-foreground">
              {whatsappStats.totalFailed} failed • {whatsappStats.successRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Birthday Wishes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailStats.birthdayWishes + whatsappStats.birthdayWishes}
            </div>
            <p className="text-xs text-muted-foreground">
              {emailStats.birthdayWishes} email • {whatsappStats.birthdayWishes} WhatsApp
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Renewals</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {emailStats.policyRenewals + whatsappStats.policyRenewals}
            </div>
            <p className="text-xs text-muted-foreground">
              {emailStats.policyRenewals} email • {whatsappStats.policyRenewals} WhatsApp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Automation Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Automation Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium text-blue-900">Daily Automation</h3>
                <p className="text-sm text-blue-700">
                  Automated messages run daily at 9:00 AM IST via cron jobs
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-900">Status: ✅ Active</div>
                <div className="text-xs text-blue-600">Next run: Tomorrow at 9:00 AM</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-gray-900">🎂 Birthday Wishes</h4>
                <p className="text-sm text-gray-600">Sent automatically on client/lead birthdays</p>
              </div>
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-gray-900">📋 Policy Renewals</h4>
                <p className="text-sm text-gray-600">Sent 30 days before policy expiry</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="upcoming-birthdays" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming-birthdays">Upcoming Birthdays</TabsTrigger>
          <TabsTrigger value="upcoming-renewals">Upcoming Renewals</TabsTrigger>
          <TabsTrigger value="email-history">Email History</TabsTrigger>
          <TabsTrigger value="whatsapp-history">WhatsApp History</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming-birthdays">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Birthdays (Next 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBirthdays.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No upcoming birthdays in the next 30 days
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Birthday</TableHead>
                      <TableHead>Days Until</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBirthdays.map((birthday) => (
                      <TableRow key={birthday.id}>
                        <TableCell className="font-medium">
                          {birthday.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {birthday.type === "client" ? "Client" : "Lead"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {birthday.hasEmail && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </Badge>
                            )}
                            {birthday.hasWhatsApp && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(birthday.dateOfBirth).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getDaysUntilBadge(birthday.daysUntil)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming-renewals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Upcoming Policy Renewals (Next 60 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingRenewals.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No upcoming policy renewals in the next 60 days
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Policy</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Until Expiry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingRenewals.map((renewal) => (
                      <TableRow key={renewal.id}>
                        <TableCell className="font-medium">
                          {renewal.client.firstName} {renewal.client.lastName}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {renewal.policyTemplate.policyType}
                            </div>
                            <div className="text-sm text-gray-500">
                              {renewal.policyTemplate.policyNumber} • {renewal.policyTemplate.provider}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {renewal.hasEmail && (
                              <Badge variant="outline" className="text-xs">
                                <Mail className="w-3 h-3 mr-1" />
                                Email
                              </Badge>
                            )}
                            {renewal.hasWhatsApp && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(renewal.expiryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getDaysUntilBadge(renewal.daysUntilExpiry)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email History (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emailLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No email logs found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emailLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.recipientName}</div>
                            <div className="text-sm text-gray-500">
                              {log.recipientEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.subject}
                        </TableCell>
                        <TableCell>
                          {getMessageTypeBadge(log.emailType)}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp-history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp History (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {whatsappLogs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No WhatsApp logs found
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whatsappLogs.slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.recipientName}</div>
                            <div className="text-sm text-gray-500">
                              {log.recipientPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.whatsappTemplate.templateName}
                        </TableCell>
                        <TableCell>
                          {getMessageTypeBadge(log.messageType)}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}