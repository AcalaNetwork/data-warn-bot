import { Logger, SCANNER_ERROR } from "../utils/logger";
import { SubscribeBlock, SubscribeBlockError } from "@open-web3/scanner/types";

// lastest block
let header = 0;
// warning timer
let warnintTimer: NodeJS.Timeout | null = null;
// send wrong message to datadog time;
const timing = 1000 * 60 * 10;

export const subLeastestHeader = async (block: SubscribeBlock | SubscribeBlockError) => {
  if(block.error) {
    Logger.pushEvent(SCANNER_ERROR, 'Subscribe Block Error', 'normal', 'warning');
    return Logger.error('Subscribe Block Error')
  }
  header = block.blockNumber;
  Logger.log('Get new block: ' + header);
  warnintTimer && clearInterval(warnintTimer)
  warnintTimer = setInterval(() => {
    Logger.error('Get node height timeout');
  }, timing);
}