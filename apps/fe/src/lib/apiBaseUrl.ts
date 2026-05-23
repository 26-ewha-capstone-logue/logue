export const DEV_API_BASE_URL = 'https://api-stg.asklogue.co';

export function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (apiUrl) return apiUrl;

  return DEV_API_BASE_URL;
}
