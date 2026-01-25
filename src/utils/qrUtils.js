export function generateQRPayload() {
  const expiresAt = Date.now() + 30 * 1000; // 30 seconds

  return {
    sessionId: crypto.randomUUID(),
    expiresAt
  };
}

export function validateQR(payload) {
  return Date.now() <= payload.expiresAt;
}
