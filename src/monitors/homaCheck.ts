import { ChainName } from "../types";
import { Logger, getAcaApi, getKarApi, getKsmApi, getPolkaApi } from "../utils";

const relayLedgerAddresses: Record<ChainName, string[]> = {
  Acala: ["15sr8Dvq3AT3Z2Z1y8FnQ4VipekAHhmQnrkgzegUr1tNgbcn"],
  Karura: [
    "HTAeD1dokCVs9MwnC1q9s2a7d2kQ52TAjrxE1y5mj5MFLLA",
    "EMrKvFy7xLgzzdgruXT9oXERt553igEScqgSjoDm3GewPSA",
    "FDVu3RdH5WsE2yTdXN3QMq6v1XVDK8GKjhq5oFjXe8wZYpL",
  ],
};

/**
 * check homa state:
 * 1. era check. (karura + 1 >= kusama)
 * 2. unlocking list length check. (karura + 1 >= kusama)
 * 3. staking ledger balance check. (balance diff <= 0.3%)
 *
 * send [error] message if check failed
 * send [info] message if check ok
 */
export const homaCheck = async (env: ChainName = "Karura") => {
  const api = env === "Karura" ? getKarApi() : getAcaApi();
  const relayApi = env === "Karura" ? getKsmApi() : getPolkaApi();
  const relayChainName = env === "Karura" ? "Kusama" : "Polkadot";

  let strings = "";
  const [era, relayEraData, minBond, ledgers, relayLergers] = await Promise.all([
    api.query.homa.relayChainCurrentEra(),
    relayApi.query.staking.activeEra(),
    relayApi.query.staking.minNominatorBond(),
    api.query.homa.stakingLedgers.entries(),
    Promise.all(relayLedgerAddresses[env].map((e) => relayApi.query.staking.ledger(e))),
  ]);
  const relayEra = Number((relayEraData as any).unwrapOrDefault().index.toString());
  const eraCheckOk = Number(era.toString()) + 1 >= relayEra;
  let ksmUnlockingLenCheckOk = true;
  let percentCheckOk = true;

  strings += "## Era Check \n";
  strings += `- ${env}: ${era.toString()} \n`;
  strings += `- ${relayChainName}: ${relayEra} \n \n`;

  ledgers.forEach((ledger, i) => {
    const [no, data] = ledger;
    const ledgerNo = Number(no.args[0].toString());
    const bonded = Number((data.toJSON() as any).bonded);
    const unlockingLen = (data.toJSON() as any).unlocking.length;

    const ksmLedger = relayLergers[i];

    const _ksmBonded = Number((ksmLedger.toJSON() as any).active) || 0;
    const ksmBonded = _ksmBonded - Number(minBond.toString());
    const ksmUnlockingLen = (ksmLedger.toJSON() as any).unlocking.length || 0;

    ksmUnlockingLenCheckOk = ksmUnlockingLenCheckOk && unlockingLen + 1 >= ksmUnlockingLen;

    percentCheckOk = percentCheckOk && Math.abs(ksmBonded - bonded) / bonded <= 0.003;

    strings += `- ${env} homa ledger #${ledgerNo}: bonded: ${bonded} \n`;
    strings += `- Subaccount on ${relayChainName} #${ledgerNo} bonded: ${ksmBonded} \n`;
  });

  strings += `- Era check ${eraCheckOk}, Unlocking length check ${ksmUnlockingLenCheckOk}, Balance diff check ${percentCheckOk}.\n`;

  const title = `[${env} Minnet] Check Homa Status With ${relayChainName} Subaccount`;
  if (!eraCheckOk || !ksmUnlockingLenCheckOk || !percentCheckOk) {
    Logger.pushEvent(title, `%%% \n ${strings} \n %%%  @slack-watchdog <@UPZRWB4UD>`, "normal", "error");
  } else {
    Logger.pushEvent(title, `%%% \n ${strings} \n %%% @slack-watchdog <@UPZRWB4UD>`, "normal", "info");
  }
};
