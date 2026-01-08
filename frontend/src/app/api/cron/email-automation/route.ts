import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    // Get client IP for logging
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log(`🕘 Cron request from IP: ${clientIP}`);

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Security: Verify cron secret if configured
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.log(`❌ Unauthorized cron request from IP: ${clientIP}`);
        return NextResponse.json(
          { success: false, message: 'Unauthorized - Invalid cron secret' },
          { status: 401 }
        );
      }
    }

    // Additional security: Check user agent (optional)
    const userAgent = request.headers.get('user-agent') || '';
    console.log(`🤖 Cron User-Agent: ${userAgent}`);

    console.log('🕘 Vercel Cron: Running email automation...');

    // Call your backend automation service
    const response = await fetch(`${BACKEND_URL}/api/email-automation/run-automation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_API_KEY || 'internal-cron-key'}`,
        'User-Agent': 'Vercel-Cron-Service/1.0'
      },
      // Add timeout
      signal: AbortSignal.timeout(25000) // 25 seconds timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend automation failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Vercel Cron: Email automation completed', {
      birthdayWishes: result.data?.birthdayWishes,
      policyRenewals: result.data?.policyRenewals,
      timestamp: new Date().toISOString(),
      clientIP
    });

    return NextResponse.json({
      success: true,
      message: 'Email automation completed successfully',
      data: result.data,
      timestamp: new Date().toISOString(),
      executedBy: 'external-cron'
    });

  } catch (error) {
    console.error('❌ Vercel Cron: Email automation failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Email automation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        executedBy: 'external-cron'
      },
      { status: 500 }
    );
  }
}

// Also support POST method for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}