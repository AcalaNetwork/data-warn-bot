import { ChainName } from "../types";
import { Logger, getAcaApi, getKarApi } from "../utils";

const referendumMap: Record<ChainName, Record<string, boolean>> = {
  Acala: {},
  Karura: {},
};

export const referendumCheck = async (env: ChainName = "Karura") => {
  const api = env === "Karura" ? getKarApi() : getAcaApi();
  const referendums: any[] = await api.derive.democracy.referendums();

  if (referendums.length === 0) return;

  let message = "";
  let shouldReport = false;
  const records: Record<string, boolean> = {};
  referendums.forEach((e) => {
    const index = e.index.toHuman();
    records[index] = true;
    const subscanLink = `https://${env.toLowerCase()}.subscan.io/referenda/${index}`;
    message += `【#${index}】[${subscanLink}](${subscanLink})\n`;

    const status = e.status.toHuman();
    message += `    - Status: ${status.threshold} end-${status.end}/delay-${status.delay}\n`;

    if (!referendumMap[env][index]) {
      shouldReport = true;
    }
  });

  if (message.length > 0 && shouldReport) {
    Logger.pushEvent(
      `[${env} Mainnet] Democracy Referendums Check`,
      `%%% \n ${message} \n %%% @slack-watchdog <@UPQ86FAKB> <@UPXM963KN> <@UPKDQJL3U> <@UPKBVBC74> <@UPZRWB4UD> <@UQ04MSNQ7>`,
      "normal",
      "warning"
    );

    referendumMap[env] = records;
  }
};
