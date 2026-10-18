// Fake request state for Server Actions under test: cookie jar + client IP.
export const jar = new Map<string, string>()
export const request = { ip: "10.0.0.1" }
