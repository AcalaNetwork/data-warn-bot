import { Wallet } from "@acala-network/sdk/wallet";
import { SubscribeBlock } from "@open-web3/scanner/types";
import Koa from "koa";
import { config } from "./config";
import { relayChainTokenCheck } from "./servers";
import { currenciesTransfers } from "./servers/currenciesTransfers";
import { largecrossChainTransfers } from "./servers/largecrossChainTransfers";
import { AcaApi, KarApi, KarProvider, KarScanner, KsmApi, Logger, PolkaApi } from "./utils";
import { removeLQ } from "./servers/removeLQ";
import { loanLevel } from "./servers/loanLevel";
import { auctionsCheck } from "./servers/auction";
import { homaCheck } from "./servers/homa";
import { acalaHomaCheck } from "./servers/acalaHoma";
import { aUSDBalanceCheck } from "./servers/aUSDBalance";
import { pushTelemetryLog, startTelemetry } from "./servers/telemetry";

const app = new Koa();

app.listen(config.port, async () => {
  console.log("Server [data-warn-bot] start at: ", config.port);
  await KarProvider.isReady;
  await KarApi.isReady;
  await KsmApi.isReady;
  await AcaApi.isReady;
  await PolkaApi.isReady;
  const KarWallet = new Wallet(KarApi);
  const AcaWallet = new Wallet(AcaApi);

  runloop(KarWallet, AcaWallet);
  setupLogAgent();
  // subChainEvents(KarWallet);
});

const runloop = async (KarWallet: Wallet, AcaWallet: Wallet) => {
  setInterval(() => {
    const hour = new Date().getHours();
    // every 1 hour
    auctionsCheck();
    auctionsCheck("ACALA");

    if (hour === 4 || hour === 12 || hour === 20) {
      // 4:00 12:00 20:00
      loanLevel(KarWallet);
      // 4:00 12:00 20:00
      // redeemRequests();
    }
    // if (hour === 10) {
    //   // info in 10 mins
    //   relayChainTokenCheck(true);
    //   // check incentives
    //   incenticesCheck(KarWallet, AcaWallet);
    // }

    if (hour === 2 || hour === 10 || hour === 18) {
      // 2:00 10:00 18:00
      // homa check & send event
      homaCheck();
      acalaHomaCheck();
    }
  }, 1000 * 60 * 60);
};

const setupLogAgent = () => {
  startTelemetry();
  startTelemetry("ACALA");

  logAgentTick(true);
  // send log to datadog every 10 mins
  setInterval(logAgentTick, 1000 * 60 * 10);
};

const logAgentTick = (isFirstTick: boolean = false) => {
  // relaychain balance check & send log
  relayChainTokenCheck();
  relayChainTokenCheck("DOT");

  // aUSD balance check & send log
  aUSDBalanceCheck();
  aUSDBalanceCheck("ACALA");

  if (!isFirstTick) {
    // telemetry check & send log
    pushTelemetryLog();
    pushTelemetryLog("ACALA");
  }
};

const subChainEvents = async (KarWallet: Wallet) => {
  KarScanner.subscribe().subscribe((header) => {
    if (header.error != null && header.result === null) {
      // Logger.pushEvent(SCANNER_ERROR, 'Subscribe Block Error', 'normal', 'warning');
      return Logger.error("Subscribe Block Error");
    }
    const block = header as SubscribeBlock;

    block.result.extrinsics.forEach((ex) => {
      if (ex.section == "xTokens" && ex.method == "transfer" && ex.result === "ExtrinsicSuccess") {
        largecrossChainTransfers(block.blockNumber, ex.args, ex.index);
      } else if (ex.section == "dex" && ex.method == "removeLiquidity" && ex.result === "ExtrinsicSuccess") {
        removeLQ(block.blockNumber, ex.args, ex.index);
      }
    });

    block.result.events.forEach((ev) => {
      if (ev.section == "currencies" && ev.method == "Transferred") {
        currenciesTransfers(KarWallet, block.blockNumber, ev);
      }
    });
  });
};
