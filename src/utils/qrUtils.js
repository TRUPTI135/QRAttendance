export const encodeQR = (payload) =>
  btoa(JSON.stringify(payload));

export const decodeQR = (text) =>
  JSON.parse(atob(text));