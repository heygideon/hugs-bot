export const env = (key: string) => process.env[key];
export const requiredEnv = (key: string) => {
  const value = env(key);
  if (value) return value;

  throw new Error(`${key} is not defined in .env`);
};
