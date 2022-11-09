import { ChainName } from "../types";
import { Logger, watchDogLog } from "../utils";
import { config } from "../config";
import WebSocket from "ws";
import axios from "axios";

const blockHeightCache: Record<ChainName, number[]> = {
  Acala: [],
  Karura: [],
};

const subqlBlockHeightCache: Record<ChainName, number[]> = {
  Acala: [],
  Karura: [],
};

const nodeReportedCache: Record<ChainName, number> = {
  Acala: 0,
  Karura: 0,
};

const subqlReportedCache: Record<ChainName, number> = {
  Acala: 0,
  Karura: 0,
};

async function _getHeightWithWs(url: string): Promise<number> {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);

      ws.on("open", function open() {
        ws.send('{ "id": 1, "jsonrpc": "2.0", "method": "chain_getHeader", "params": [] }');
      });

      ws.on("message", function message(data) {
        const json = JSON.parse(data.toString());
        resolve(parseInt(json.result.number));
        ws.close();
      });

      ws.on("error", function message() {
        resolve(0);
        ws.close();
      });
    } catch (_) {
      resolve(0);
    }
  });
}

async function _getHeightWithSubql(url: string) {
  const res = await axios.post(
    `https://api.polkawallet.io/${url}`,
    { query: "{\n  query {\n _metadata {\n targetHeight\n }\n}\n}" },
    { headers: { "Content-Type": "application/json" } }
  );
  if (res.status == 200) {
    return res.data.data.query._metadata.targetHeight;
  }
  return 0;
}

export const blockHeightCheck = async (env: ChainName = "Karura", fromSubql = false) => {
  const allNodes = env == "Acala" ? config.allNodes.acala : config.allNodes.karura;
  const allSubql = ["history", "loan", "dex", "stats"].map((e) => `${env.toLowerCase()}-${e}-subql`);
  const urls = fromSubql ? allSubql : allNodes;
  const latestHeight = await Promise.all(urls.map((e) => (fromSubql ? _getHeightWithSubql(e) : _getHeightWithWs(e))));
  const cache = fromSubql ? subqlBlockHeightCache : blockHeightCache;
  const reportedCache = fromSubql ? subqlReportedCache : nodeReportedCache;

  if (cache[env].length == 0) {
    cache[env] = [...latestHeight];
    return;
  }

  const update = cache[env].map((height, i) => latestHeight[i] - height);
  const halted = update.filter((e, i) => e < 1 && latestHeight[i] > 0);

  const checkName = fromSubql ? "subql services" : "nodes";
  let shouldReport = false;
  let logMsg = `${env} ${checkName} check:
- Active/All ${checkName}: ${latestHeight.length - halted.length}/${latestHeight.length}\n`;
  if (halted.length > 0) {
    logMsg += `- Halted: [${update
      .map((e, i) => (e < 1 ? `${urls[i]}(${latestHeight[i]})` : ""))
      .filter((e) => !!e)
      .join(",")}]`;

    shouldReport = true;
  }

  watchDogLog(
    {
      level: "info",
      title: fromSubql ? `${env.toLowerCase()}-subql-check` : `${env.toLowerCase()}-block-height`,
      message: logMsg,
      value: halted.length,
      timestamp: new Date().toUTCString(),
    },
    `env:${env.toLowerCase()},env:mainnet`
  );

  cache[env] = [...latestHeight];

  if (!shouldReport) {
    if (reportedCache[env] > 0) {
      // recovered from reported
      Logger.pushEvent(
        fromSubql ? `[${env} Subql Check] Subql Service Recovered` : `[${env} Block Check] Block Height Halt Recovered`,
        `%%% \n ${logMsg} \n %%% @slack-watchdog`,
        "normal",
        "success"
      );

      reportedCache[env] = 0;
    }
    return;
  }

  // ignore repeated report
  if (reportedCache[env] === halted.length) return;

  const notify = fromSubql ? `<@U01A7DFD0CR> <@UPY6J8X5E>` : logMsg.match("polkawallet.io") ? "<@U01A7DFD0CR>" : "";

  Logger.pushEvent(
    fromSubql
      ? `[${env} Subql Block Height Check] Subql Service Alert`
      : `[${env} Block Check] Block Height Halt Alert`,
    `%%% \n ${logMsg} \n %%% @slack-watchdog ${notify}`,
    "normal",
    "error"
  );

  reportedCache[env] = halted.length;
};
