import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, ArrowLeft } from 'lucide-react';

export default function ClientNotFound() {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <UserCheck className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Client Not Found
          </CardTitle>
          <CardDescription className="text-gray-600">
            The client you&apos;re looking for doesn&apos;t exist or may have been deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/clients">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Clients
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}