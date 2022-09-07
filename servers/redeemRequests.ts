import { request, gql } from "graphql-request";
import moment from "moment";
import { config } from "../config";
import { KarApi, Logger, OVER_8_DAYS_REDEEMREQUESTS } from "../utils";

/// check all homa redeem requests waiting duration on Karura,
/// send [warn] message if any request wait more than 7 days.
/// script not available any more for query data from homaLite.
export const redeemRequests = async () => {
  const _redeems = await KarApi.query.homaLite.redeemRequests.entries();
  const accounts: string[] = [];
  let strings: string = "";
  _redeems.forEach((redeem) => {
    const [account, args] = redeem;
    const _account = (account.toHuman() as string[])[0];
    accounts.push(_account);
  });
  const nodes = await Promise.all(Array.from(new Set(accounts)).map((account) => gqlRequest(account)));

  nodes.forEach((node) => {
    const { timestamp, accountId } = node.homaActions.nodes[0];
    console.log(timestamp, accountId);
    const timePlus = moment().diff(timestamp, "hours");
    if (timePlus > 24 * 7) {
      strings += `- account: ${accountId}, time: ${timestamp} \n`;
    }
  });

  if (strings != "") {
    Logger.pushEvent(
      OVER_8_DAYS_REDEEMREQUESTS,
      `%%% \n - checkTime: ${new Date().getTime()} \n - accounts: ${strings} \n %%% @slack-Acala-data-warn-bot`,
      "normal",
      "warning"
    );
  }
};

const gqlRequest = async (accont: string) =>
  request(
    config.subql,
    gql`
  {
    homaActions(filter:{accountId:{equalTo:"${accont}"}},orderBy:TIMESTAMP_DESC, first: 1) {
      nodes {
        timestamp
        accountId
      }
    }
  }
`
  );
