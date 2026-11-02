/**
 * M.E.G. OS Error Message Formatter
 * Safely normalizes and extracts meaningful error text from any thrown runtime value
 * (Error objects, strings, custom rejection payloads, null, undefined).
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) return 'Error desconocido en tiempo de ejecución.';
  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : 'Error desconocido en tiempo de ejecución.';
  }
  if (error instanceof Error) {
    return error.name ? `${error.name}: ${error.message}` : error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg.trim();
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
