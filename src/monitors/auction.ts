import { AUCTIONS, Logger, getAcaApi, getKarApi } from "../utils";
import { ChainName } from "../types";

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
export const auctionsCheck = async (env: ChainName = "Karura") => {
  let strings = "";

  const api = env === "Karura" ? getKarApi() : getAcaApi();
  const data = await api.query.auction.auctions.entries();
  data.forEach((item) => {
    const [auctionId, auctionInfo] = item;
    const info = auctionInfo.toJSON() as any;

    strings += `- start: ${info.start}, end: ${info.end}, id: ${auctionId.args.toString()} \n`;
  });

  if (strings != "") {
    Logger.pushEvent(`${AUCTIONS} ${env}`, `%%% \n - list: \n ${strings} \n %%% @slack-watchdog`, "normal", "info");
  }
};
