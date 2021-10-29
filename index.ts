import Koa from 'koa';
import { config } from './config';
import { ksmBill, subLeastestHeader } from './servers'

const app = new Koa();

app.listen(config.port, async () => {
  console.log('Server [data-warn-bot] start at: ', config.port);
  initEvents();
});

const initEvents = async () => {
  // subLeastestHeader();
  ksmBill();
}