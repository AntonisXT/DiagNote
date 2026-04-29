const FASTAPI = (process.env.NEXT_PUBLIC_FASTAPI_URL ?? '').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${FASTAPI}${path}`;
}
