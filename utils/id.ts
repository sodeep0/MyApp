export function generateUUID(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}-${Math.random().toString(36).substring(2, 5)}`;
}
