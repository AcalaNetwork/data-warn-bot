import { Wallet } from "@acala-network/sdk/wallet";
import { aUSDBalanceCheck } from "./servers/aUSDBalance";
import { acalaHomaCheck } from "./servers/acalaHoma";
import { auctionsCheck } from "./servers/auction";
import { config } from "./config";
import { connectNodes, getAcaApi, getKarApi } from "./utils";
import { homaCheck } from "./servers/homa";
import { incenticesCheck } from "./servers/incenticesCheck";
import { loanLevel } from "./servers/loanLevel";
import { pushTelemetryLog, startTelemetry } from "./servers/telemetry";
import { referendumCheck } from "./servers/referendumCheck";
import { relayChainTokenCheck } from "./servers";
import Koa from "koa";
// import { dexPoolCheck } from "./servers/dexPoolCheck";

const app = new Koa();

app.listen(config.port, async () => {
  console.log("Server [data-warn-bot] start at: ", config.port);
  await connectNodes();

  const KarWallet = new Wallet(getKarApi());
  const AcaWallet = new Wallet(getAcaApi());

  runloop(KarWallet, AcaWallet);
  setupLogAgent();
});

const runloop = async (KarWallet: Wallet, AcaWallet: Wallet) => {
  setInterval(() => {
    const hour = new Date().getHours();
    // every 1 hour
    auctionsCheck();
    auctionsCheck("ACALA");

    referendumCheck();
    referendumCheck("ACALA");

    if (hour === 4 || hour === 12 || hour === 20) {
      // 4:00 12:00 20:00
      loanLevel(KarWallet);
      // 4:00 12:00 20:00
      // redeemRequests();
    }
    if (hour === 10) {
      // info in 10 mins
      // relayChainTokenCheck(true);
      // check incentives
      incenticesCheck(KarWallet, AcaWallet);
    }

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

const logAgentTick = (isFirstTick = false) => {
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

  // TODO: this dex pool check is temp
  // dexPoolCheck("ACALA");
};
