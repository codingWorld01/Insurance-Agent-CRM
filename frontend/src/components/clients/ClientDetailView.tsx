"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Users,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Heart,
  FileText,
  Edit,
  Trash2,
  Shield,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  Ruler,
  Weight,
  GraduationCap,
  CreditCard,
  Building,
} from "lucide-react";
import { formatDistanceToNow, differenceInYears, format } from "date-fns";
import { formatCurrency } from "@/utils/currencyUtils";

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  originalName: string;
  cloudinaryUrl: string;
  uploadedAt: string;
}

// Unified client interface matching the backend model
interface UnifiedClient {
  id: string;
  // Mandatory fields
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  whatsappNumber: string;

  // Optional personal fields
  middleName?: string;
  email?: string;
  state?: string;
  city?: string;
  address?: string;
  birthPlace?: string;
  age?: number;
  gender?: "MALE" | "FEMALE" | "OTHER";
  height?: number;
  weight?: number;
  education?: string;
  maritalStatus?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  businessJob?: string;
  nameOfBusiness?: string;
  typeOfDuty?: string;
  annualIncome?: number;
  panNumber?: string;
  gstNumber?: string;
  additionalInfo?: string;

  // Optional corporate fields
  companyName?: string;

  // Optional family/employee fields
  relationship?:
    | "SPOUSE"
    | "CHILD"
    | "PARENT"
    | "SIBLING"
    | "EMPLOYEE"
    | "DEPENDENT"
    | "OTHER";

  // System fields
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
  policies?: Array<{
    id: string;
    [key: string]: any;
  }>;
}

interface ClientDetailViewProps {
  client: UnifiedClient;
  onEdit: () => void;
  onDelete: () => void;
  onAddPolicy?: () => void;
  policyStats?: {
    totalPolicies: number;
    activePolicies: number;
    totalPremium: number;
    totalCommission: number;
  };
}

export function ClientDetailView({
  client,
  onEdit,
  onDelete,
  onAddPolicy,
  policyStats = {
    totalPolicies: 0,
    activePolicies: 0,
    totalPremium: 0,
    totalCommission: 0,
  },
}: ClientDetailViewProps) {
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  console.log("client ", client)

  // Helper function to determine client type based on filled fields
  const getClientType = (): {
    type: string;
    icon: any;
    variant: unknown;
    color: string;
  } => {
    if (client.companyName) {
      return {
        type: "Corporate Client",
        icon: Building2,
        variant: "outline" as const,
        color: "bg-purple-100 text-purple-800",
      };
    }
    if (client.relationship) {
      return {
        type: "Family/Employee Client",
        icon: Users,
        variant: "secondary" as const,
        color: "bg-green-100 text-green-800",
      };
    }
    return {
      type: "Personal Client",
      icon: User,
      variant: "default" as const,
      color: "bg-blue-100 text-blue-800",
    };
  };

  const getClientName = (): string => {
    if (client.companyName) {
      return client.companyName;
    }
    const fullName = `${client.firstName} ${client.lastName}`.trim();
    return fullName || "Unnamed Client";
  };

  const getInitials = (name: string): string => {
    if (!name || name.trim() === "") {
      return "CL"; // Default initials for Client
    }
    return name
      .split(" ")
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper function to check if a value is filled (not null, undefined, or empty string)
  const isFilled = (value: unknown): boolean => {
    return value !== null && value !== undefined && value !== "";
  };

  const typeInfo = getClientType();
  const TypeIcon = typeInfo.icon;
  const clientName = getClientName();
  const age =
    client.age ||
    (client.dateOfBirth
      ? differenceInYears(new Date(), new Date(client.dateOfBirth))
      : null);
  const visibleDocuments = showAllDocuments
    ? client.documents
    : client.documents.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={client.profileImage}
                  alt={`${clientName} profile`}
                />
                <AvatarFallback className={typeInfo.color}>
                  {getInitials(clientName)}
                </AvatarFallback>
              </Avatar>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{clientName}</h1>
                  <Badge
                    variant={typeInfo.variant}
                    className="flex items-center gap-1"
                  >
                    <TypeIcon className="h-3 w-3" />
                    {typeInfo.type}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <div>Client ID: {client.id.slice(0, 8)}...</div>
                  <div>
                    Member since{" "}
                    {formatDistanceToNow(new Date(client.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={onDelete}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            {isFilled(client.email) && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div className="text-sm">{client.email}</div>
                </div>
              </div>
            )}

            {/* Phone Number (mandatory) */}
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Phone Number
                </div>
                <div className="text-sm">{client.phoneNumber}</div>
              </div>
            </div>

            {/* WhatsApp Number (mandatory) */}
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  WhatsApp Number
                </div>
                <div className="text-sm">{client.whatsappNumber}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Information - Only show filled fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date of Birth (mandatory) */}
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Date of Birth
                </div>
                <div className="text-sm">
                  {format(new Date(client.dateOfBirth), "MMMM d, yyyy")}
                </div>
              </div>
            </div>

            {/* Age */}
            {age && (
              <div>
                <div className="text-sm font-medium text-gray-500">Age</div>
                <div className="text-sm">{age} years old</div>
              </div>
            )}

            {/* Middle Name */}
            {isFilled(client.middleName) && (
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Middle Name
                </div>
                <div className="text-sm">{client.middleName}</div>
              </div>
            )}

            {/* Gender */}
            {isFilled(client.gender) && (
              <div>
                <div className="text-sm font-medium text-gray-500">Gender</div>
                <div className="text-sm capitalize">
                  {client.gender!.toLowerCase()}
                </div>
              </div>
            )}

            {/* Birth Place */}
            {isFilled(client.birthPlace) && (
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Birth Place
                </div>
                <div className="text-sm">{client.birthPlace}</div>
              </div>
            )}

            {/* Marital Status */}
            {isFilled(client.maritalStatus) && (
              <div>
                <div className="text-sm font-medium text-gray-500">
                  Marital Status
                </div>
                <div className="text-sm capitalize">
                  {client.maritalStatus!.toLowerCase()}
                </div>
              </div>
            )}

            {/* Education */}
            {isFilled(client.education) && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Education
                  </div>
                  <div className="text-sm">{client.education}</div>
                </div>
              </div>
            )}
          </div>

          {/* Physical Details */}
          {(isFilled(client.height) || isFilled(client.weight)) && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isFilled(client.height) && (
                  <div className="flex items-center gap-3">
                    <Ruler className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Height
                      </div>
                      <div className="text-sm">{client.height} ft</div>
                    </div>
                  </div>
                )}
                {isFilled(client.weight) && (
                  <div className="flex items-center gap-3">
                    <Weight className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Weight
                      </div>
                      <div className="text-sm">{client.weight} kg</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Professional Details */}
          {(isFilled(client.businessJob) ||
            isFilled(client.nameOfBusiness) ||
            isFilled(client.typeOfDuty) ||
            isFilled(client.annualIncome)) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isFilled(client.businessJob) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Occupation
                      </div>
                      <div className="text-sm">{client.businessJob}</div>
                    </div>
                  )}
                  {isFilled(client.nameOfBusiness) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Business Name
                      </div>
                      <div className="text-sm">{client.nameOfBusiness}</div>
                    </div>
                  )}
                  {isFilled(client.typeOfDuty) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Type of Duty
                      </div>
                      <div className="text-sm">{client.typeOfDuty}</div>
                    </div>
                  )}
                  {isFilled(client.annualIncome) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        Annual Income
                      </div>
                      <div className="text-sm">
                        {formatCurrency(client.annualIncome!)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Corporate Information */}
          {isFilled(client.companyName) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Corporate Information
                </h4>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Company Name
                  </div>
                  <div className="text-sm font-semibold">
                    {client.companyName}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Family/Employee Information */}
          {isFilled(client.relationship) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Relationship Information
                </h4>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Relationship
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Heart className="h-3 w-3 mr-1" />
                    {client.relationship}
                  </Badge>
                </div>
              </div>
            </>
          )}

          {/* Location Information */}
          {(isFilled(client.state) ||
            isFilled(client.city) ||
            isFilled(client.address)) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isFilled(client.state) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        State
                      </div>
                      <div className="text-sm">{client.state}</div>
                    </div>
                  )}
                  {isFilled(client.city) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        City
                      </div>
                      <div className="text-sm">{client.city}</div>
                    </div>
                  )}
                </div>
                {isFilled(client.address) && (
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-2">
                      Address
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-sm">
                      {client.address}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tax Information */}
          {(isFilled(client.panNumber) || isFilled(client.gstNumber)) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Tax Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isFilled(client.panNumber) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        PAN Number
                      </div>
                      <div className="text-sm font-mono">
                        {client.panNumber}
                      </div>
                    </div>
                  )}
                  {isFilled(client.gstNumber) && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">
                        GST Number
                      </div>
                      <div className="text-sm font-mono">
                        {client.gstNumber}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Additional Information */}
          {isFilled(client.additionalInfo) && (
          <>
            <Separator />
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Information
              </h4>
              <div className="text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {client.additionalInfo}
              </div>
            </div>
          </>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      {client.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({client.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visibleDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {document.originalName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {document.documentType} • Uploaded{" "}
                        {formatDistanceToNow(new Date(document.uploadedAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open(document.cloudinaryUrl, "_blank")
                    }
                  >
                    View
                  </Button>
                </div>
              ))}

              {client.documents.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllDocuments(!showAllDocuments)}
                  className="w-full"
                >
                  {showAllDocuments
                    ? "Show Less"
                    : `Show ${client.documents.length - 3} More Documents`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ClientDetailView;
export type { UnifiedClient };
