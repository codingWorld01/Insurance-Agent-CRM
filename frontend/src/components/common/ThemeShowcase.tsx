"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sun, 
  Moon, 
  Star, 
  Heart, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Zap
} from "lucide-react";

export function ThemeShowcase() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Theme Showcase</h1>
        <p className="text-muted-foreground text-lg">
          Demonstrating the Insurance CRM theme system
        </p>
        <ThemeToggle />
      </div>

      {/* Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Color Palette</CardTitle>
          <CardDescription>
            Semantic color tokens used throughout the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-medium">Primary</span>
              </div>
              <p className="text-sm text-muted-foreground">Primary actions</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-16 bg-secondary rounded-lg flex items-center justify-center">
                <span className="text-secondary-foreground font-medium">Secondary</span>
              </div>
              <p className="text-sm text-muted-foreground">Secondary actions</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-16 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground font-medium">Muted</span>
              </div>
              <p className="text-sm text-muted-foreground">Subtle elements</p>
            </div>
            
            <div className="space-y-2">
              <div className="h-16 bg-destructive rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">Destructive</span>
              </div>
              <p className="text-sm text-muted-foreground">Error states</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
          <CardDescription>
            All button styles adapt to the current theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">
              <Star className="mr-2 h-4 w-4" />
              Default
            </Button>
            <Button variant="secondary">
              <Heart className="mr-2 h-4 w-4" />
              Secondary
            </Button>
            <Button variant="outline">
              <Sun className="mr-2 h-4 w-4" />
              Outline
            </Button>
            <Button variant="ghost">
              <Moon className="mr-2 h-4 w-4" />
              Ghost
            </Button>
            <Button variant="destructive">
              <Zap className="mr-2 h-4 w-4" />
              Destructive
            </Button>
            <Button variant="link">Link</Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Form Elements</CardTitle>
          <CardDescription>
            Input fields and form controls with theme support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password"
                className="bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card>
        <CardHeader>
          <CardTitle>Badges</CardTitle>
          <CardDescription>
            Status indicators and labels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Messages</CardTitle>
          <CardDescription>
            Different alert types with proper theming
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This is an informational alert message.
            </AlertDescription>
          </Alert>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This is a success alert message.
            </AlertDescription>
          </Alert>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is an error alert message.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Card Example 1</CardTitle>
            <CardDescription>
              A sample card with theme-aware styling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This card demonstrates how content adapts to different themes.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Example 2</CardTitle>
            <CardDescription>
              Another card showing consistent theming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium">Premium</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card Example 3</CardTitle>
            <CardDescription>
              Final card in the showcase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Star className="mr-2 h-4 w-4" />
              Action Button
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border">
        <p className="text-muted-foreground">
          Insurance CRM Theme System - Supporting Light & Dark modes
        </p>
      </div>
    </div>
  );
}