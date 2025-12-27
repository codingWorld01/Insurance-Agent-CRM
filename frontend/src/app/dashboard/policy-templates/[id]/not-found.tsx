import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileX, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb, breadcrumbItems } from '@/components/common/Breadcrumb';

export default function PolicyTemplateNotFound() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={[
        breadcrumbItems.dashboard,
        { 
          label: "Policy Templates", 
          href: "/dashboard/policy-templates" 
        },
        { label: "Policy Not Found", current: true }
      ]} />

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileX className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            Policy Template Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            The policy template you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="flex items-center gap-2">
              <Link href="/dashboard/policy-templates">
                <Search className="h-4 w-4" />
                Browse Policy Templates
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex items-center gap-2">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            The policy template may have been removed or the link may be incorrect.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}