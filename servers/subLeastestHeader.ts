import { Logger } from "../utils/logger";
import { SubscribeBlock } from "@open-web3/scanner/types";

// lastest block
let header = 0;
// warning timer
let warnintTimer: NodeJS.Timeout | null = null;
// send wrong message to datadog time;
const timing = 1000 * 60 * 10;

export const subLeastestHeader = async (block: SubscribeBlock) => {
  header = block.blockNumber;
  Logger.log('Get new block: ' + header);
  warnintTimer && clearInterval(warnintTimer)
  warnintTimer = setInterval(() => {
    Logger.error('Get chain block height timeout');
  }, timing);
}