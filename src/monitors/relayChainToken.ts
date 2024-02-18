import { ChainName } from "../types";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { Logger, getAcaApi, getKarApi, getKsmApi, getPolkaApi, watchDogLog } from "../utils";
import { config } from "../config";

/// check DOT/KSM balance between parachain-account and total-issuance,
/// send [diff-ratio] message.
export const relayChainTokenCheck = async (env: ChainName = "Karura", toSlack = false) => {
  let diff = FixedPointNumber.ZERO;
  let diffRatio = 0;
  let msg = "";
  const token = env === "Karura" ? "KSM" : "DOT";
  const relayChain = token === "KSM" ? "kusama" : "polkadot";
  if (token === "KSM") {
    const ksmAccount = await getKsmApi().query.system.account(config.ksm.account);
    const ksmBalance = FixedPointNumber.fromInner((ksmAccount as any).data.free.toString(), config.ksm.decimal);

    const _karBalance = await getKarApi().query.tokens.totalIssuance({
      Token: "KSM",
    });
    const karBalance = FixedPointNumber.fromInner(_karBalance.toString(), config.ksm.decimal);

    diff = karBalance.sub(ksmBalance);
    diffRatio = diff.div(ksmBalance).toNumber(6);
    msg = `- ${token} Balacne in Parachain Account: ${ksmBalance.toNumber(4)}
- Total Issuance in ${env}: ${karBalance.toNumber(4)}
- Difference (${env} - ${relayChain}): ${diff.toNumber(4)}
- Difference Ratio: ${diffRatio}`;
  } else {
    const polkaAccount = await getPolkaApi().query.system.account(config.ksm.account);
    const polkaBalance = FixedPointNumber.fromInner((polkaAccount as any).data.free.toString(), 10);

    const _acaBalance = await getAcaApi().query.tokens.totalIssuance({
      Token: "DOT",
    });
    const acaBalance = FixedPointNumber.fromInner(_acaBalance.toString(), 10);

    diff = acaBalance.sub(polkaBalance);
    diffRatio = diff.div(polkaBalance).toNumber(6);
    msg = `- ${token} Balacne in Parachain Account: ${polkaBalance.toNumber(4)}
- Total Issuance in ${env}: ${acaBalance.toNumber(4)}
- Difference (${env} - ${relayChain}): ${diff.toNumber(4)}
- Difference Ratio: ${diffRatio}`;
  }

  if (toSlack) {
    const title = `[${env} Mainnet] ${token} Balance Check`;
    Logger.pushEvent(
      `${title}`,
      `%%% \n ${Math.abs(diffRatio) > 0.01 ? "🚨" : "✅"} \n ${msg} \n %%% @slack-watchdog <@UPZRWB4UD>`,
      "normal",
      "info"
    );
    return;
  }

  watchDogLog(
    {
      level: "info",
      title: `${token}-balance-diff`,
      message: msg,
      value: diffRatio,
      timestamp: new Date().toUTCString(),
    },
    `env:${env.toLowerCase()},env:mainnet`
  );
};
