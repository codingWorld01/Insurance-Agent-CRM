import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if backend is reachable
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    let backendStatus = 'unknown';
    try {
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        backendStatus = 'connected';
      } else {
        backendStatus = 'error';
      }
    } catch (error) {
      backendStatus = 'disconnected';
    }
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      backend: backendStatus,
      build: {
        time: process.env.BUILD_TIME || 'unknown',
        commit: process.env.BUILD_COMMIT || 'unknown'
      }
    };
    
    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    const healthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(healthCheck, { status: 503 });
  }
}