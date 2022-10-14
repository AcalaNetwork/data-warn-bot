import { BN, BN_ZERO } from "@polkadot/util";
import { ChainName } from "../types";
import { getAcaApi, getKarApi, watchDogLog } from "../utils";

export const aUSDBalanceCheck = async (env: ChainName = "Karura") => {
  const divider = new BN(1_000_000_000_000);
  const token = env === "Karura" ? "KUSD" : "AUSD";
  const api = env === "Karura" ? getKarApi() : getAcaApi();
  const issuance: any = ((await api.query.tokens.totalIssuance({ Token: token })) as any).div(divider);
  const totalPos: any[] = await api.query.loans.totalPositions.entries();
  const exchangeRates: any[] = await Promise.all(
    totalPos.map(([key]) => api.query.cdpEngine.debitExchangeRate(key.toHuman()[0]))
  );
  const totalMint = totalPos
    .map(([, { debit }], i) => {
      const exchangeRate = exchangeRates[i].unwrapOrDefault();
      return debit
        .mul(exchangeRate.gt(BN_ZERO) ? exchangeRate : api.consts.cdpEngine.defaultDebitExchangeRate)
        .div(new BN("1000000000000000000"));
    })
    .reduce((a, b) => a.add(b), BN_ZERO)
    .div(divider);
  const badDebt = ((await api.query.cdpTreasury.debitPool()) as any).div(divider);
  const balanceDiff = issuance.sub(totalMint).sub(badDebt).toNumber();
  const constDiff = env === "Karura" ? 550_000 : 1_100_000;
  const diff = balanceDiff - constDiff;
  const diffRatio = diff / constDiff;

  const issuanceMsg = `${token} issuance check:
  - Issuance: ${issuance}
  - Minted: ${totalMint}
  - BadDebt: ${badDebt}
  - Specified: ${constDiff}
  - Diff: ${diff}`;

  watchDogLog(
    {
      level: "info",
      title: `${token}-issuance-check`,
      message: issuanceMsg,
      value: parseFloat(diffRatio.toFixed(6)),
      timestamp: new Date().toUTCString(),
    },
    `env:${env.toLowerCase()},env:mainnet`
  );

  const issuanceWithoutSpecified = issuance.toNumber() - constDiff;
  const badDebtRatio = badDebt.toNumber() / issuanceWithoutSpecified;
  const badDebtMsg = `${token} bad debt check:
- Issuance without Specified: ${issuanceWithoutSpecified}
- BadDebt: ${badDebt}`;

  watchDogLog(
    {
      level: "info",
      title: `${token}-bad-debt`,
      message: badDebtMsg,
      value: parseFloat(badDebtRatio.toFixed(6)),
      timestamp: new Date().toUTCString(),
    },
    `env:${env.toLowerCase()},env:mainnet`
  );
};
