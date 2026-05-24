export const DEV_API_BASE_URL = 'https://api-stg.asklogue.co';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function getDeploymentEnvironment() {
  return process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV;
}

function shouldRequireApiUrl() {
  const deploymentEnvironment = getDeploymentEnvironment();

  if (deploymentEnvironment) {
    return deploymentEnvironment === 'production';
  }

  return process.env.NODE_ENV === 'production';
}

function normalizeApiBaseUrl(apiUrl: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(apiUrl);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be a valid absolute URL');
  }

  const isHttps = parsedUrl.protocol === 'https:';
  const isLocalHttp =
    parsedUrl.protocol === 'http:' && LOCAL_HOSTS.has(parsedUrl.hostname);

  if (!isHttps && !isLocalHttp) {
    throw new Error('NEXT_PUBLIC_API_URL must use HTTPS outside localhost');
  }

  return parsedUrl.toString().replace(/\/$/, '');
}

export function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (apiUrl) return normalizeApiBaseUrl(apiUrl);

  if (shouldRequireApiUrl()) {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production');
  }

  return DEV_API_BASE_URL;
}
