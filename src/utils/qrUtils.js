export function encodeQR(data) {
  return btoa(JSON.stringify(data));
}

export function decodeQR(text) {
  return JSON.parse(atob(text));
}
