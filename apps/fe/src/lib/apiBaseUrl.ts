export const DEV_API_BASE_URL = 'https://api-stg.asklogue.co';

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

export function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (apiUrl) return apiUrl;

  if (shouldRequireApiUrl()) {
    throw new Error('NEXT_PUBLIC_API_URL must be set in production');
  }

  return DEV_API_BASE_URL;
}
