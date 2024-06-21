import { FixedPointNumber } from "@acala-network/sdk-core";
import { Logger, getAcaApi, getKarApi } from "../utils";

const account_hydraDX = "23UvQ3ZWXwinF3JfBcxFBFadwDAAw9wwjAGbUVb1Ttf88vWw";
const account_manta = "23UvQ3YsGN9m9waJAWhZW3yxQ25h3XTvVJ7rio8zPWTPYSh3";
const account_basilisk = "qubt4U1h5dma9n4reFL3gW7kCXGv79AjTv6ewYXBgnqowye";

const min_balance = 2;

export const xcmFeeTokenCheck = async (env = "Karura", toSlack = false) => {
  let msg = "";
  let isError = false;
  const token = env === "Karura" ? "KAR" : "ACA";
  if (token === "KAR") {
    const account = await getKarApi().query.system.account(account_basilisk);
    const balance = FixedPointNumber.fromInner(account.data.free.add(account.data.reserved).toString(), 12).toNumber(4);
    msg = `${balance < min_balance ? "🚨" : "✅"} ${token} Balacne in Basilisk Account: ${balance}`;
    isError = balance < min_balance;
  } else {
    const hydraAccount = await getAcaApi().query.system.account(account_hydraDX);
    const mantaAccount = await getAcaApi().query.system.account(account_manta);
    const hydraBalance = FixedPointNumber.fromInner(
      hydraAccount.data.free.add(hydraAccount.data.reserved).toString(),
      12
    ).toNumber(4);
    const mantaBalance = FixedPointNumber.fromInner(
      mantaAccount.data.free.add(mantaAccount.data.reserved).toString(),
      12
    ).toNumber(4);

    msg = `${hydraBalance < min_balance ? "🚨" : "✅"} ${token} Balacne in HydraDX Account: ${hydraBalance}
${mantaBalance < min_balance ? "🚨" : "✅"} ${token} Balacne in Manta Account: ${mantaBalance}`;
    isError = hydraBalance < min_balance || mantaBalance < min_balance;
  }

  if (toSlack) {
    const title = `[${env} Mainnet] XCM Fee Balance Check`;
    Logger.pushEvent(
      `${title}`,
      `%%% \n${msg} \n %%% @slack-watchdog <@UPZRWB4UD>`,
      "normal",
      isError ? "error" : "info"
    );
    return;
  }
};
