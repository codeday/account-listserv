/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable node/no-process-env */
import { config } from 'dotenv';

config();

export default {
  app: {
    port: Number.parseInt(process.env.PORT || '3000', 10) || 3000,
    secret: process.env.APP_SECRET!,
    url: process.env.APP_URL || `https://localhost:${Number.parseInt(process.env.PORT || '3000', 10) || 3000}`,
  },
  postmark: {
    apiToken: process.env.POSTMARK_API_TOKEN!,
    domain: process.env.POSTMARK_DOMAIN!,
    messageStream: process.env.POSTMARK_MESSAGE_STREAM!,
    urlSecret: process.env.POSTMARK_URL_SECRET!,
  },
  account: {
    secret: process.env.ACCOUNT_SECRET!,
    allowedRoles: process.env.ACCOUNT_ALLOWED_ROLES!.split(','),
  },
};
