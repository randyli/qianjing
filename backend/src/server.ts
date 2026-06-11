import { app } from './app';
import { config } from './config';

app.listen(config.port, config.host, () => {
  console.log(`Qianjing API listening on http://${config.host}:${config.port}`);
});
