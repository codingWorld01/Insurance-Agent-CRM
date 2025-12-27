import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Enhanced error handling for policy instance API routes
 */
function handleApiError(error: unknown, operation: string) {
  console.error(`Policy instance ${operation} error:`, error);
  
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
  if (error instanceof Error && error.name === 'AbortError') {
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
 * Validate client ID parameter
 */
function validateClientId(clientId: string): { isValid: boolean; error?: string } {
  if (!clientId) {
    return { isValid: false, error: 'Client ID is required' };
  }
  
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clientId)) {
    return { isValid: false, error: 'Invalid client ID format' };
  }
  
  return { isValid: true };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    // Validate client ID
    const clientIdValidation = validateClientId(id);
    if (!clientIdValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: clientIdValidation.error,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/api/clients/${id}/policy-instances`;

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
 * Validate policy instance creation data
 */
function validatePolicyInstanceData(data: unknown): { isValid: boolean; errors?: Array<{ field: string; message: string }> } {
  const errors: Array<{ field: string; message: string }> = [];
  
  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Invalid data format' });
    return { isValid: false, errors };
  }
  
  const policyData = data as Record<string, unknown>;
  
  if (!policyData.policyTemplateId) {
    errors.push({ field: 'policyTemplateId', message: 'Policy template ID is required' });
  } else if (typeof policyData.policyTemplateId === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(policyData.policyTemplateId)) {
    errors.push({ field: 'policyTemplateId', message: 'Invalid policy template ID format' });
  }
  
  if (policyData.premiumAmount === undefined || policyData.premiumAmount === null) {
    errors.push({ field: 'premiumAmount', message: 'Premium amount is required' });
  } else if (typeof policyData.premiumAmount === 'number' && (isNaN(policyData.premiumAmount) || policyData.premiumAmount <= 0)) {
    errors.push({ field: 'premiumAmount', message: 'Premium amount must be a positive number' });
  } else if (typeof policyData.premiumAmount === 'number' && policyData.premiumAmount > 10000000) {
    errors.push({ field: 'premiumAmount', message: 'Premium amount cannot exceed $10,000,000' });
  }
  
  if (!policyData.startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required' });
  } else if (typeof policyData.startDate === 'string' && isNaN(new Date(policyData.startDate).getTime())) {
    errors.push({ field: 'startDate', message: 'Start date must be a valid date' });
  }
  
  if (policyData.durationMonths === undefined || policyData.durationMonths === null) {
    errors.push({ field: 'durationMonths', message: 'Duration is required' });
  } else if (typeof policyData.durationMonths === 'number' && (isNaN(policyData.durationMonths) || policyData.durationMonths < 1 || policyData.durationMonths > 120)) {
    errors.push({ field: 'durationMonths', message: 'Duration must be between 1 and 120 months' });
  }
  
  if (policyData.commissionAmount === undefined || policyData.commissionAmount === null) {
    errors.push({ field: 'commissionAmount', message: 'Commission amount is required' });
  } else if (typeof policyData.commissionAmount === 'number' && (isNaN(policyData.commissionAmount) || policyData.commissionAmount < 0)) {
    errors.push({ field: 'commissionAmount', message: 'Commission amount cannot be negative' });
  } else if (typeof policyData.commissionAmount === 'number' && typeof policyData.premiumAmount === 'number' && policyData.commissionAmount > policyData.premiumAmount) {
    errors.push({ field: 'commissionAmount', message: 'Commission amount cannot exceed premium amount' });
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    
    // Validate client ID
    const clientIdValidation = validateClientId(id);
    if (!clientIdValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: clientIdValidation.error,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
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
    const validation = validatePolicyInstanceData(body);
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

    const backendUrl = `${BACKEND_URL}/api/clients/${id}/policy-instances`;

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