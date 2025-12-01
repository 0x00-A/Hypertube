import * as dotenv from 'dotenv';
dotenv.config();
import { cleanEnv, str, port, bool } from 'envalid';

export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 3000 }),
  MONGODB_URI: str(),
  ENABLE_REQUEST_LOGGING: bool({ default: true }),
});
