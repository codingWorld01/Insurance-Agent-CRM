import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Enhanced error handling for policy template search API
 */
function handleSearchError(error: any) {
  console.error('Policy template search error:', error);
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Unable to connect to server. Please try again.',
        code: 'NETWORK_ERROR',
        retryable: true
      },
      { status: 503 }
    );
  }
  
  // Timeout errors
  if (error.name === 'AbortError') {
    return NextResponse.json(
      { 
        success: false, 
        message: 'Search timeout. Please try again.',
        code: 'TIMEOUT_ERROR',
        retryable: true
      },
      { status: 408 }
    );
  }
  
  // Generic server error
  return NextResponse.json(
    { 
      success: false, 
      message: 'Search failed. Please try again later.',
      code: 'SEARCH_ERROR',
      retryable: true
    },
    { status: 500 }
  );
}

/**
 * Validate search parameters
 */
function validateSearchParams(searchParams: URLSearchParams): { isValid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  
  const query = searchParams.get('q');
  if (!query) {
    errors.push({ field: 'q', message: 'Search query is required' });
  } else if (query.length < 2) {
    errors.push({ field: 'q', message: 'Search query must be at least 2 characters long' });
  } else if (query.length > 100) {
    errors.push({ field: 'q', message: 'Search query cannot exceed 100 characters' });
  } else if (!/^[a-zA-Z0-9\s\-_.]+$/.test(query)) {
    errors.push({ field: 'q', message: 'Search query contains invalid characters' });
  }
  
  const excludeClientId = searchParams.get('excludeClientId');
  if (excludeClientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(excludeClientId)) {
    errors.push({ field: 'excludeClientId', message: 'Invalid client ID format' });
  }
  
  const limit = searchParams.get('limit');
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 50)) {
    errors.push({ field: 'limit', message: 'Limit must be between 1 and 50' });
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Authorization header required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Validate search parameters
    const validation = validateSearchParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid search parameters',
          code: 'VALIDATION_ERROR',
          errors: validation.errors
        },
        { status: 400 }
      );
    }
    
    const params = new URLSearchParams();
    if (searchParams.get('q')) params.set('q', searchParams.get('q')!);
    if (searchParams.get('excludeClientId')) params.set('excludeClientId', searchParams.get('excludeClientId')!);
    if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);

    const backendUrl = `${BACKEND_URL}/api/policy-templates/search?${params.toString()}`;

    // Add timeout for search operations (shorter than regular requests)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    return handleSearchError(error);
  }
}