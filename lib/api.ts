export function httpApiResponse<T>(payload: T, status: string, source = 'api', success = true) {
  return {
    success,
    data: payload,
    source,
    timestamp: new Date().toISOString(),
    status,
  };
}

export function unavailableFromSource(error = 'Source unavailable') {
  return {
    success: false,
    data: null,
    status: 'UNAVAILABLE_FROM_SOURCE',
    error,
  };
}
