import { RecurrenceRule, scheduleJob } from "node-schedule";
import { AUCTIONS, KarApi, Logger } from "../utils";

export interface IAuction {
  id: string;
  lastBider?: string;
  lastBidAmount?: string;
  start: string;
  end: string;
  minIncr: string;
  durationSoftCap: string;
}

/// push [info] message if auction list is not empty
export const auctionsCheck = async () => {
  let strings = "";

  const data = await KarApi.query.auction.auctions.entries();
  data.forEach((item) => {
    const [auctionId, auctionInfo] = item;
    const info = auctionInfo.toJSON() as any;

    strings += `- start: ${info.start}, end: ${info.end}, id: ${auctionId.args.toString()} \n`;
  });

  if (strings != "") {
    Logger.pushEvent(AUCTIONS, `%%% \n - list: \n ${strings} \n %%% @slack-Acala-data-warn-bot`, "normal", "info");
  }
};
