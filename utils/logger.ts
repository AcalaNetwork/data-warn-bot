import moment from "moment";
import { v1, v2 } from "@datadog/datadog-api-client";
import { EventPriority } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventPriority";
import { EventAlertType } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventAlertType";
import { config } from "../config";

const configuration = v1.createConfiguration();
const events = new v1.EventsApi(configuration);

const logger = new v1.LogsApi(configuration);
// const logger = new v2.LogsApi(v2.createConfiguration());

// socket error
export const API_ERROR = "[API_ERROR] Apipromise Create Error";
export const SCANNER_ERROR = "[API_ERROR] Scanner Subscribe Error";

// servers error
export const BLOCK_HEIGHT = "[BLOCK_HEIGHT] Submit Lastest Block Height";
export const RELAY_CHAIN_TOKEN = "[RELAY_CHAIN_TOKEN] Parachain Account Balance Is Wrong With Karura Total Insurance";
export const LARGE_XTOKENS_TRANSFER = "[LARGE_TRANSFER] More Than 1000 KSM Xtokens Transfer";
export const LARGE_CURRENCIES_TRANSFER = "[LARGE_TRANSFER] More Than $10000 Currencies Transfer";
// export const LARGE_TOKENS_TRANSFER = '[LARGE_TRANSFER] More Than $10000 Tokens Transfer';
export const POLKADOTXCMS = '[POLKADOTXCMS] Uncommon Transactions With "PokladotXcm.xx"';
export const REMOVE_LIQUID_STAKING = "[REMOVE_LIQUID_STAKING] More Than 5% Total Liquid Staking Withdrawed";
export const OVER_8_DAYS_REDEEMREQUESTS = "[OVER_8_DAYS_REDEEMREQUESTS] HomaLite RedeemRequest Had Over Eight Days";
export const DANGER_LOAN_POSITION = "[DANGER_LOAN_POSITION] CollateralRatio Less Than RequiredCollateralRatio";
export const DEX_PRICE_WARNING = "[DEX_PRICE_WARNING] Rate Is Gte 10%(15%) Or Lte -10%(-15%) Without(With) KUSD";
export const AUCTIONS = "[AUCTIONS] Auctions Currently Exists";
export const INCENTIVES = "[INCENTIVES_CHECK] Check Incentives Reward Vault Account";
export const HOMA = "[Karura Minnet] Check Homa Status With Kusama Subaccount";
export const ACALA_HOMA = "[Acala Minnet] Check Homa Status With Polkadot Subaccount";
export const INCENTIVES_BALANCE = "[INCENTIVES_BALANCE] Check the balance of the Incentives account is enough for a few days";
export const PRICE_SERVER = "[PRICE_SERVER] Check Status Of Price Server";

export class Logger {
  public static log(...args: any[]) {
    const { stack } = new Error();
    const arr = stack?.split("\n") as string[];
    const path = arr[2].trim();
    const _path = path.split("data-warn-bot");
    const time = moment().format("MM-DD HH:mm:ss");
    console.log(`[INFO] [${time}] [at ${_path[1]} ] \n${args.map((i, a) => `    ${i}${args.length == a + 1 ? "" : "\n"}`).join("")}`);
  }

  public static error(...args: any[]) {
    const { stack } = new Error();
    const arr = stack?.split("\n") as string[];
    const path = arr[2].trim();
    const _path = path.split("data-warn-bot");
    const time = moment().format("MM-DD HH:mm:ss");
    console.error(`[ERROR] [${time}] [at ${_path[1]} ] \n${args.map((i, a) => `    ${i}${args.length == a + 1 ? "" : "\n"}`).join("")}`);
  }

  public static pushEvent(title: string, text: string, priority?: EventPriority, alertType?: EventAlertType) {
    Logger.log(title, text);
    try {
      events.createEvent({ body: { title, text, priority, alertType, host: config.host } });
    } catch (error) {
      Logger.error("Datadog error");
    }
  }
}

declare interface WatchDogMessage {
  level: "info" | "warn" | "error";
  value: any;
  title: string;
  message: string;
  timestamp: string;
}

export const watchDogLog = (message: WatchDogMessage, tags: string) => {
  logger
    .submitLog({
      body: [
        {
          ddsource: "nodejs",
          ddtags: tags,
          message: JSON.stringify(message),
          service: "data-warn-bot",
          hostname: config.host,
        },
      ],
      contentEncoding: "deflate",
    })
    .then((_) => {
      console.log(`Send log ${message.title}.`);
    })
    .catch((error: any) => console.error(error));
};
