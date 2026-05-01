// Holds the current access token so auth.service.ts can read it without
// importing auth.store (which would create a circular dependency).
// auth.store writes here whenever tokens change; auth.service reads here.
let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  _accessToken = token;
};

export const getAccessToken = () => _accessToken;
