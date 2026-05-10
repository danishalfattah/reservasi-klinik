export function apiSuccess<T>(data: T, status: number = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): Response {
  return Response.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}
