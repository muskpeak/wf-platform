import { HttpError } from '../api/httpClient';

export type ApiErrorKind = 'unauthorized' | 'not_found' | 'server_error' | 'timeout' | 'network' | 'unknown';

export interface ParsedApiError {
  kind: ApiErrorKind;
  /**
   * The parsed message suitable for UI rendering
   */
  message: string;
  /**
   * Raw error data or status code
   */
  raw: any;
}

/**
 * Parses generic API/HTTP errors into a clean, structured object for UI rendering.
 */
export function parseApiError(error: any): ParsedApiError {
  if (error instanceof HttpError) {
    let kind: ApiErrorKind = 'unknown';
    
    switch (error.status) {
      case 401:
      case 403:
        kind = 'unauthorized';
        break;
      case 404:
        kind = 'not_found';
        break;
      case 408:
      case 504:
        kind = 'timeout';
        break;
      default:
        if (error.status && error.status >= 500) {
          kind = 'server_error';
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
          kind = 'network';
        }
    }

    return {
      kind,
      message: error.message || 'An unexpected server error occurred.',
      raw: error.data || error.status
    };
  }

  // Fallback for non-HttpError exceptions (e.g., SyntaxError in JSON parse)
  const rawMessage = error instanceof Error ? error.message : String(error);
  if (rawMessage.toLowerCase().includes('network') || rawMessage.toLowerCase().includes('fetch')) {
    return {
      kind: 'network',
      message: 'Network error. Please check your connection.',
      raw: rawMessage
    };
  }

  return {
    kind: 'unknown',
    message: 'An unexpected error occurred.',
    raw: rawMessage
  };
}
