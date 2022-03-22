import { WalletPromise } from '@acala-network/sdk-wallet';
import { SubscribeBlock } from '@open-web3/scanner/types';
import Koa from 'koa';
import { config } from './config';
import { ksmBill, subLeastestHeader } from './servers'
import { currenciesTransfers } from './servers/currenciesTransfers';
import { largecrossChainTransfers } from './servers/largecrossChainTransfers';
import { polkadotXcms } from './servers/polkadotXcms';
import { AcaApi, KarApi, KarProvider, KarScanner, KsmApi, Logger, SCANNER_ERROR } from './utils';
import { removeLQ } from './servers/removeLQ';
import { redeemRequests } from './servers/redeemRequests';
import { loanLevel } from './servers/loanLevel';
import { dexStatus } from './servers/dexStatus';
import { auction } from './servers/auction';
import { checkIncentives } from './servers/checkIncentives';

const app = new Koa();

app.listen(config.port, async () => {
  console.log('Server [data-warn-bot] start at: ', config.port);
  await KarProvider.isReady;
  await KarApi.isReady;
  await KsmApi.isReady;
  await AcaApi.isReady;
  const KarWallet = new WalletPromise(KarApi);
  const AcaWallet = new WalletPromise(AcaApi);
  checkIncentives(AcaWallet, KarWallet);
  initIntervalEvents(KarWallet);
  subChainEvents(KarWallet);
});

const initIntervalEvents = async (KarWallet: WalletPromise) => {
  ksmBill();
  redeemRequests();
  auction();
  loanLevel(KarWallet);
  dexStatus(KarWallet);
}

const subChainEvents = async (KarWallet: WalletPromise) => {
  KarScanner.subscribe().subscribe(header => {
    if(header.error != null && header.result === null) {
      Logger.pushEvent(SCANNER_ERROR, 'Subscribe Block Error', 'normal', 'warning');
      return Logger.error('Subscribe Block Error')
    }
    const block = header as SubscribeBlock;

    subLeastestHeader(block);

    block.result.extrinsics.forEach(ex => {
      if(ex.section == 'xTokens' && ex.method == 'transfer' && ex.result === 'ExtrinsicSuccess') {
        largecrossChainTransfers(block.blockNumber, ex.args, ex.index);
      } else if(ex.section == 'polkadotXcm' && ex.result === 'ExtrinsicSuccess') {
        polkadotXcms(block.blockNumber, ex.method, ex.args, ex.index);
      } else if(ex.section == 'dex' && ex.method == 'removeLiquidity' && ex.result === 'ExtrinsicSuccess') {
        removeLQ(block.blockNumber, ex.args, ex.index)
      }
    })

    block.result.events.forEach(ev => {
      if(ev.section == 'currencies' && ev.method == 'Transferred') {
        currenciesTransfers(KarWallet, block.blockNumber, ev);
      }
    })
  })
}