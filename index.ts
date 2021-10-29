import Koa from 'koa';
import { config } from './config';
import { ksmBill, subLeastestHeader } from './servers'
import { KarProvider, KarScanner } from './utils';

const app = new Koa();

app.listen(config.port, async () => {
  console.log('Server [data-warn-bot] start at: ', config.port);
  initIntervalEvents();
  subChainEvents();
});

const initIntervalEvents = async () => {
  ksmBill();
}

const subChainEvents = async () => {
  await KarProvider.isReady;
  KarScanner.subscribe().subscribe(header => {
    subLeastestHeader(header);
  })
}