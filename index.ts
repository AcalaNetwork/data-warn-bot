import { Wallet } from '@acala-network/sdk/wallet';
import { SubscribeBlock } from '@open-web3/scanner/types';
import Koa from 'koa';
import { config } from './config';
import { ksmBill, subLeastestHeader } from './servers'
import { currenciesTransfers } from './servers/currenciesTransfers';
import { largecrossChainTransfers } from './servers/largecrossChainTransfers';
import { polkadotXcms } from './servers/polkadotXcms';
import { AcaApi, KarApi, KarProvider, KarScanner, KsmApi, Logger, PolkaApi, SCANNER_ERROR } from './utils';
import { removeLQ } from './servers/removeLQ';
import { redeemRequests } from './servers/redeemRequests';
import { loanLevel } from './servers/loanLevel';
import { dexStatus } from './servers/dexStatus';
import { auction } from './servers/auction';
import { checkIncentives } from './servers/checkIncentives';
import { homaCheckWithKsm } from './servers/homa';
import { acalaHomaCheckWithKsm } from './servers/acalaHoma';
import { incenticesCheck } from './servers/incenticesCheck';
import { priceServer } from './servers/priceServer';

const app = new Koa();

app.listen(config.port, async () => {
  console.log('Server [data-warn-bot] start at: ', config.port);
  await KarProvider.isReady;
  await KarApi.isReady;
  await KsmApi.isReady;
  await AcaApi.isReady;
  await PolkaApi.isReady;
  const KarWallet = new Wallet(KarApi);
  const AcaWallet = new Wallet(AcaApi);
  initIntervalEvents(KarWallet, AcaWallet);
  subChainEvents(KarWallet);
});

const initIntervalEvents = async (KarWallet: Wallet, AcaWallet: Wallet) => {
  setInterval(() => {
    priceServer();
  }, 1000 * 60)

  setInterval(() => {
    // every 5 mins
    ksmBill(false);
    // every 5 mins
    // dexStatus(KarWallet);
  }, 1000 * 60 * 10);

  setInterval(() => {
    const hour = new Date().getHours();
    // every 1 hour
    auction();

    if(hour === 4 || hour === 12 || hour === 20) {
      // 4:00 12:00 20:00
      loanLevel(KarWallet);
      // 4:00 12:00 20:00
      redeemRequests();
    }
    if(hour === 10) {
      // info in 10 mins
      ksmBill(true);
      // check incentives
      incenticesCheck(KarWallet, AcaWallet);
    }

    if(hour === 2 || hour === 10 || hour === 18) {
      // 2:00 10:00 18:00
      homaCheckWithKsm();
      acalaHomaCheckWithKsm();
    }

  }, 1000 * 60 * 60)
}

const subChainEvents = async (KarWallet: Wallet) => {
  KarScanner.subscribe().subscribe(header => {
    if(header.error != null && header.result === null) {
      // Logger.pushEvent(SCANNER_ERROR, 'Subscribe Block Error', 'normal', 'warning');
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