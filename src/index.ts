import { Wallet } from "@acala-network/sdk/wallet";
import { aUSDBalanceCheck } from "./monitors/aUSDBalance";
import { auctionsCheck } from "./monitors/auction";
import { config } from "./config";
import { connectNodes, getAcaApi, getKarApi } from "./utils";
import { homaCheck } from "./monitors/homaCheck";
import { incenticesCheck } from "./monitors/incenticesCheck";
import { pushTelemetryLog, startTelemetry } from "./monitors/telemetry";
import { referendumCheck } from "./monitors/referendumCheck";
import { relayChainTokenCheck } from "./monitors/relayChainToken";
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
    auctionsCheck("Acala");

    referendumCheck();
    referendumCheck("Acala");

    // if (hour === 4 || hour === 12 || hour === 20) {
    //   // 4:00 12:00 20:00
    //   loanLevel(KarWallet);
    //   // 4:00 12:00 20:00
    //   // redeemRequests();
    // }
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
      homaCheck("Acala");
    }
  }, 1000 * 60 * 60);
};

const setupLogAgent = () => {
  startTelemetry();
  startTelemetry("Acala");

  logAgentTick(true);
  // send log to datadog every 10 mins
  setInterval(logAgentTick, 1000 * 60 * 10);
};

const logAgentTick = (isFirstTick = false) => {
  // relaychain balance check & send log
  relayChainTokenCheck();
  relayChainTokenCheck("Acala");

  // aUSD balance check & send log
  aUSDBalanceCheck();
  aUSDBalanceCheck("Acala");

  if (!isFirstTick) {
    // telemetry check & send log
    pushTelemetryLog();
    pushTelemetryLog("Acala");
  }

  // TODO: this dex pool check is temp
  // dexPoolCheck("ACALA");
};
