import express from 'express';
import nocache from 'nocache';
import bodyParser from 'body-parser';
import { addRoutes } from './routes';
import config from './config';

const app = express();
app.set('etag', false);
app.use(nocache());
app.use(bodyParser.json({ limit: '50mb' }));
addRoutes(app);

// eslint-disable-next-line no-console
app.listen(config.app.port, () => console.log(`Listening on ${config.app.url}`));
