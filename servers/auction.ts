import { RecurrenceRule, scheduleJob } from "node-schedule";
import { AUCTIONS, KarApi, Logger } from "../utils";

const timing = 1000 * 60 * 30;

export interface IAuction {
  id: string;
  lastBider?: string;
  lastBidAmount?: string;
  start: string;
  end: string;
  minIncr: string;
  durationSoftCap: string;
}

export const _auction = async () => {
  let strings = '';

  const data = await KarApi.query.auction.auctions.entries();
  data.forEach(item => {
    const [auctionId, auctionInfo] = item;
    const info = auctionInfo.toJSON() as any;

    strings += `- start: ${info.start}, end: ${info.end}, id: ${auctionId.args.toString()} \n`
  });

  if (strings != '') {
    Logger.pushEvent(
      AUCTIONS,
      `%%% \n - list: \n ${strings} \n %%%`,
      'normal',
      'info'
    )
  }
}

export const auction = () => {
  const rule = new RecurrenceRule();
  rule.minute = [0, 30]
  rule.second = 0

  const job = scheduleJob(rule, _auction);
}