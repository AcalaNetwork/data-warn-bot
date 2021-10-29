import { Logger } from "../utils/logger";
import { KarApi } from '../utils'

// lastest block
let header = 0;
// warning timer
let warnintTimer: NodeJS.Timeout | null = null;
// send wrong message to datadog time;
const timing = 1000 * 60 * 10;

export const subLeastestHeader = async () => {
  const api = KarApi;
  await api.isReady;
  const news = await api.rpc.chain.getHeader();
  header = news.number.toNumber();
  api.rpc.chain.subscribeNewHeads((lastestHeader) => {
    header = lastestHeader.number.toNumber();
    Logger.log('Get new block: ' + header);
    warnintTimer && clearInterval(warnintTimer)
    warnintTimer = setInterval(() => {
      console.log('wrong')
    }, timing)
  })
}