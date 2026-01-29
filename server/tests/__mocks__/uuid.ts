// Mock for uuid module to avoid ES module issues in Jest
export const v4 = (): string => {
  return 'mock-uuid-' + Math.random().toString(36).substring(2, 15);
};

export const v1 = (): string => {
  return 'mock-uuid-v1-' + Math.random().toString(36).substring(2, 15);
};

export const v3 = (): string => {
  return 'mock-uuid-v3-' + Math.random().toString(36).substring(2, 15);
};

export const v5 = (): string => {
  return 'mock-uuid-v5-' + Math.random().toString(36).substring(2, 15);
};

// Export default as well for different import patterns
export default {
  v1,
  v3,
  v4,
  v5,
};
