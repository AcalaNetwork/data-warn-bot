import { SubscribeBlock } from '@open-web3/scanner/types';
import Koa from 'koa';
import { config } from './config';
import { ksmBill, subLeastestHeader } from './servers'
import { largecrossChainTransfers } from './servers/largecrossChainTransfers';
import { KarProvider, KarScanner, Logger, SCANNER_ERROR } from './utils';

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
    if(header.error != null && header.result === null) {
      Logger.pushEvent(SCANNER_ERROR, 'Subscribe Block Error', 'normal', 'warning');
      return Logger.error('Subscribe Block Error')
    }
    const block = header as SubscribeBlock;

    subLeastestHeader(block);

    block.result.extrinsics.forEach(ex => {
      if(ex.section == 'xTokens' && ex.method == 'transfer' && ex.result === 'ExtrinsicSuccess') {
        largecrossChainTransfers(block.blockNumber, ex.args);
      }
    })
  })
}