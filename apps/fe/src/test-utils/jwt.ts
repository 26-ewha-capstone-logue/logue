export function encodeBase64Url(value: unknown) {
  return Buffer.from(JSON.stringify(value))
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function createJwt(
  payloadOrExpiresAtMs: Record<string, unknown> | number,
) {
  const payload =
    typeof payloadOrExpiresAtMs === 'number'
      ? { exp: Math.floor(payloadOrExpiresAtMs / 1000) }
      : payloadOrExpiresAtMs;

  return `${encodeBase64Url({ alg: 'none' })}.${encodeBase64Url(
    payload,
  )}.signature`;
}
