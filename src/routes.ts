import { Express } from 'express';
import { InboundMessageDetails } from 'postmark/dist/client/models/messages/InboundMessage';
import { forwardEmail } from './email';
import config from './config';

export function addRoutes(app: Express): void {
  app.post(`/${config.postmark.urlSecret}`, async (req, res): Promise<void> => {
    if (req.body?.MessageID) {
      try {
        await forwardEmail(<InboundMessageDetails>req.body);
        res.send(`Ok`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err);
        res.send(err.toString());
      }
    } else res.send(`Invalid format.`);
  });
}
