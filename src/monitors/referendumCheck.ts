import { DeriveReferendumExt } from "@polkadot/api-derive/types";
import { Logger, getAcaApi, getKarApi } from "../utils";

let referendumMap: Record<string, boolean> = {};

// set checkCount to 0 if new referendum detected.
// set checkCount to 0 if checkCount > 4.
// push event to datadog if checkCount == 0.
let checkCount = 0;

export const referendumCheck = async (env: "KARURA" | "ACALA" = "KARURA") => {
  const api = env === "KARURA" ? getKarApi() : getAcaApi();
  const referendums: DeriveReferendumExt[] = await api.derive.democracy.referendums();

  if (referendums.length === 0) return;

  let message = "";
  const records: Record<string, boolean> = {};
  referendums.forEach((e) => {
    const index = e.index.toHuman();
    records[index] = true;
    const subscanLink = `https://${env.toLowerCase()}.subscan.io/referenda/${index}`;
    message += `【#${index}】[${subscanLink}](${subscanLink})\n`;

    const status = e.status.toHuman();
    message += `    - Status: ${status.threshold} end-${status.end}/delay-${status.delay}\n`;
  });

  if (Object.keys(records).join("") !== Object.keys(referendumMap).join("")) {
    checkCount = 0;
  } else {
    checkCount += 1;
    if (checkCount > 4) {
      checkCount = 0;
    }
  }

  if (checkCount === 0 && message.length > 0) {
    Logger.pushEvent(
      `[${env} REFERENDUMS] Democracy Referendums Check`,
      `%%% \n ${message} \n %%% @slack-watchdog <@UPQ86FAKB> <@UPXM963KN> <@UPKDQJL3U> <@UPKBVBC74> <@UPZRWB4UD> <@UQ04MSNQ7>`,
      "normal",
      "warning"
    );

    referendumMap = records;
  }
};
