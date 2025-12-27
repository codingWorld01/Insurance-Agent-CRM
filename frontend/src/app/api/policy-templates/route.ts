import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Enhanced error handling for policy template API routes
 */
function handleApiError(error: unknown, operation: string) {
  console.error(`Policy templates ${operation} error:`, error);
  
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
        message: 'Request timeout. Please try again.',
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
      message: 'Internal server error. Please try again later.',
      code: 'SERVER_ERROR',
      retryable: true
    },
    { status: 500 }
  );
}

/**
 * Validate query parameters for GET request
 */
function validateQueryParams(searchParams: URLSearchParams): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  const page = searchParams.get('page');
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    errors.push('Page must be a positive number');
  }
  
  const limit = searchParams.get('limit');
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    errors.push('Limit must be between 1 and 100');
  }
  
  const search = searchParams.get('search');
  if (search && search.length > 100) {
    errors.push('Search query cannot exceed 100 characters');
  }
  
  if (search && /[<>'"&]/.test(search)) {
    errors.push('Search query contains invalid characters');
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
    
    // Validate query parameters
    const validation = validateQueryParams(searchParams);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          errors: validation.errors?.map(error => ({ field: 'query', message: error }))
        },
        { status: 400 }
      );
    }
    
    const params = new URLSearchParams();
    if (searchParams.get('page')) params.set('page', searchParams.get('page')!);
    if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
    if (searchParams.get('search')) params.set('search', searchParams.get('search')!);
    if (searchParams.get('policyTypes')) params.set('policyTypes', searchParams.get('policyTypes')!);
    if (searchParams.get('providers')) params.set('providers', searchParams.get('providers')!);
    if (searchParams.get('hasInstances')) params.set('hasInstances', searchParams.get('hasInstances')!);
    if (searchParams.get('sortField')) params.set('sortField', searchParams.get('sortField')!);
    if (searchParams.get('sortDirection')) params.set('sortDirection', searchParams.get('sortDirection')!);
    if (searchParams.get('includeStats')) params.set('includeStats', searchParams.get('includeStats')!);

    const backendUrl = `${BACKEND_URL}/api/policy-templates?${params.toString()}`;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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
    return handleApiError(error, 'GET');
  }
}

/**
 * Validate policy template creation data
 */
function validatePolicyTemplateData(data: unknown): { isValid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  
  // Type guard to ensure data is an object
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Invalid data format' });
    return { isValid: false, errors };
  }
  
  const templateData = data as Record<string, unknown>;
  
  if (!templateData.policyNumber || typeof templateData.policyNumber !== 'string' || !templateData.policyNumber.trim()) {
    errors.push({ field: 'policyNumber', message: 'Policy number is required' });
  } else if (templateData.policyNumber.length > 50) {
    errors.push({ field: 'policyNumber', message: 'Policy number must be less than 50 characters' });
  } else if (!/^[A-Za-z0-9\-_]+$/.test(templateData.policyNumber)) {
    errors.push({ field: 'policyNumber', message: 'Policy number can only contain letters, numbers, hyphens, and underscores' });
  }
  
  if (!templateData.policyType) {
    errors.push({ field: 'policyType', message: 'Policy type is required' });
  } else if (!['Life', 'Health', 'Auto', 'Home', 'Business'].includes(templateData.policyType as string)) {
    errors.push({ field: 'policyType', message: 'Invalid policy type' });
  }
  
  if (!templateData.provider || typeof templateData.provider !== 'string' || !templateData.provider.trim()) {
    errors.push({ field: 'provider', message: 'Provider is required' });
  } else if (templateData.provider.length > 100) {
    errors.push({ field: 'provider', message: 'Provider name must be less than 100 characters' });
  }
  
  if (templateData.description && typeof templateData.description === 'string' && templateData.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' });
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export async function POST(request: NextRequest) {
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

    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON'
        },
        { status: 400 }
      );
    }

    // Validate request data
    const validation = validatePolicyTemplateData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/policy-templates`;

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    return handleApiError(error, 'POST');
  }
}