import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// Enhanced error response helper
function createErrorResponse(message: string, statusCode: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    { 
      success: false, 
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    },
    { status: statusCode }
  );
}

// Input validation helper
function validateQueryParams(searchParams: URLSearchParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate pagination
  const page = searchParams.get('page');
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    errors.push('Page must be a positive integer');
  }
  
  const limit = searchParams.get('limit');
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push('Limit must be between 1 and 100');
  }
  
  // Validate date ranges
  const expiryStart = searchParams.get('expiryStart');
  const expiryEnd = searchParams.get('expiryEnd');
  
  if (expiryStart && isNaN(Date.parse(expiryStart))) {
    errors.push('Invalid expiry start date format');
  }
  
  if (expiryEnd && isNaN(Date.parse(expiryEnd))) {
    errors.push('Invalid expiry end date format');
  }
  
  if (expiryStart && expiryEnd && new Date(expiryStart) > new Date(expiryEnd)) {
    errors.push('Expiry start date must be before end date');
  }
  
  // Validate premium ranges
  const premiumMin = searchParams.get('premiumMin');
  const premiumMax = searchParams.get('premiumMax');
  
  if (premiumMin && (isNaN(Number(premiumMin)) || Number(premiumMin) < 0)) {
    errors.push('Premium minimum must be a non-negative number');
  }
  
  if (premiumMax && (isNaN(Number(premiumMax)) || Number(premiumMax) < 0)) {
    errors.push('Premium maximum must be a non-negative number');
  }
  
  if (premiumMin && premiumMax && Number(premiumMin) > Number(premiumMax)) {
    errors.push('Premium minimum cannot be greater than maximum');
  }
  
  // Validate search query
  const search = searchParams.get('search');
  if (search && search.length > 100) {
    errors.push('Search query cannot exceed 100 characters');
  }
  
  return { isValid: errors.length === 0, errors };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return createErrorResponse('Authorization header required', 401);
    }

    const url = new URL(request.url);
    const urlSearchParams = url.searchParams;
    
    // Validate query parameters
    const validation = validateQueryParams(urlSearchParams);
    if (!validation.isValid) {
      return createErrorResponse('Invalid query parameters', 400, {
        validationErrors: validation.errors
      });
    }

    // Enhanced query parameter handling for policy page
    const params = new URLSearchParams();
    
    // Basic pagination
    if (urlSearchParams.get('page')) params.set('page', urlSearchParams.get('page')!);
    if (urlSearchParams.get('limit')) params.set('limit', urlSearchParams.get('limit')!);
    
    // Legacy client-specific queries
    if (urlSearchParams.get('clientId')) params.set('clientId', urlSearchParams.get('clientId')!);
    if (urlSearchParams.get('status')) params.set('status', urlSearchParams.get('status')!);
    
    // Enhanced filtering for policy page
    if (urlSearchParams.get('search')) params.set('search', urlSearchParams.get('search')!);
    if (urlSearchParams.get('types')) params.set('types', urlSearchParams.get('types')!);
    if (urlSearchParams.get('providers')) params.set('providers', urlSearchParams.get('providers')!);
    if (urlSearchParams.get('expiryStart')) params.set('expiryStart', urlSearchParams.get('expiryStart')!);
    if (urlSearchParams.get('expiryEnd')) params.set('expiryEnd', urlSearchParams.get('expiryEnd')!);
    if (urlSearchParams.get('premiumMin')) params.set('premiumMin', urlSearchParams.get('premiumMin')!);
    if (urlSearchParams.get('premiumMax')) params.set('premiumMax', urlSearchParams.get('premiumMax')!);
    if (urlSearchParams.get('commissionMin')) params.set('commissionMin', urlSearchParams.get('commissionMin')!);
    if (urlSearchParams.get('commissionMax')) params.set('commissionMax', urlSearchParams.get('commissionMax')!);
    
    // Sorting
    if (urlSearchParams.get('sortField')) params.set('sortField', urlSearchParams.get('sortField')!);
    if (urlSearchParams.get('sortDirection')) params.set('sortDirection', urlSearchParams.get('sortDirection')!);
    
    // Include options
    if (urlSearchParams.get('includeClient')) params.set('includeClient', urlSearchParams.get('includeClient')!);
    if (urlSearchParams.get('includeStats')) params.set('includeStats', urlSearchParams.get('includeStats')!);

    const queryString = params.toString();
    const backendUrl = `${BACKEND_URL}/api/policies${queryString ? `?${queryString}` : ''}`;

    // Enhanced fetch with timeout and retry logic
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'X-Request-ID': crypto.randomUUID(),
          'X-Client-IP': request.headers.get('x-forwarded-for') || 'unknown'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle different response statuses
      if (!response.ok) {
        let errorMessage = 'Failed to fetch policies';
        let errorDetails: Record<string, unknown> | undefined = undefined;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          errorDetails = (errorData.details || errorData.errors) as Record<string, unknown> | undefined;
        } catch {
          // If JSON parsing fails, use status-based message
          switch (response.status) {
            case 400:
              errorMessage = 'Invalid request parameters';
              break;
            case 401:
              errorMessage = 'Authentication failed';
              break;
            case 403:
              errorMessage = 'Access forbidden';
              break;
            case 404:
              errorMessage = 'Policies not found';
              break;
            case 429:
              errorMessage = 'Too many requests. Please try again later.';
              break;
            case 500:
              errorMessage = 'Internal server error';
              break;
            case 502:
            case 503:
            case 504:
              errorMessage = 'Service temporarily unavailable';
              break;
            default:
              errorMessage = 'An unexpected error occurred';
          }
        }

        return createErrorResponse(errorMessage, response.status, errorDetails);
      }

      const data = await response.json();
      
      // Add performance metrics to response
      const duration = Date.now() - startTime;
      if (data.success && data.data) {
        data.meta = {
          ...data.meta,
          requestDuration: duration,
          timestamp: new Date().toISOString()
        };
      }
      
      return NextResponse.json(data, { 
        status: response.status,
        headers: {
          'X-Response-Time': duration.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return createErrorResponse('Request timeout', 408, {
          timeout: true,
          duration: Date.now() - startTime
        });
      }
      
      throw fetchError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('Policies GET proxy error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration,
      url: request.url,
      timestamp: new Date().toISOString()
    });

    // Determine error type and appropriate response
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return createErrorResponse('Network error - unable to connect to backend service', 503, {
        networkError: true,
        retryable: true
      });
    }

    return createErrorResponse('Internal server error', 500, {
      duration,
      retryable: true
    });
  }
}