import { Wallet } from "@acala-network/sdk";
import { FixedPointNumber, forceToCurrencyName } from "@acala-network/sdk-core";
import { ApiPromise } from "@polkadot/api";
import { getAcaApi, INCENTIVES_BALANCE, getKarApi, Logger } from "../utils";

// karura qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a
// acala  23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit

/// check incentive account balances on Acala/Karura and calculate
/// how many days the payout will go.
/// send [info] message every day at 9:00 am.
export const incenticesCheck = async (KarWallet: Wallet, AcaWallet: Wallet) => {
  const karura = await _incenticesCheck(getKarApi(), KarWallet, "qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a");
  const acala = await _incenticesCheck(getAcaApi(), AcaWallet, "23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit");

  let strings = "";

  strings += "karura: \n";
  Object.keys(karura).forEach((item) => {
    const data = karura[item];
    strings += `token: ${item}, balance: ${data.balance}, periodPay: ${data.periodPay}, paidableDays: ${data.paidableDays} \n`;
  });

  strings += "acala: \n";
  Object.keys(acala).forEach((item) => {
    const data = acala[item];
    strings += `token: ${item}, balance: ${data.balance}, periodPay: ${data.periodPay}, paidableDays: ${data.paidableDays} \n`;
  });

  Logger.pushEvent(INCENTIVES_BALANCE, `%%% \n ${strings} \n %%% @slack-watchdog <@UPZRWB4UD>`, "normal", "info");
};

export const _incenticesCheck = async (api: ApiPromise, wallet: Wallet, address: string) => {
  const balanceObj: { [k: string]: number } = {};
  const unnativeBalance = await api.query.tokens.accounts.entries(address);
  const nativeBalance = await api.query.system.account(address);

  const _nativeToken = api.consts.currencies.getNativeCurrencyId;
  const nativeToken = wallet.__getToken(_nativeToken);
  balanceObj[nativeToken.display] = FixedPointNumber.fromInner((nativeBalance.toJSON() as any).data.free, nativeToken.decimals).toNumber();
  unnativeBalance.forEach((i) => {
    const token = wallet.__getToken(forceToCurrencyName(i[0].args[1]));
    balanceObj[token.display] = FixedPointNumber.fromInner((i[1].toJSON() as any).free.toString(), token.decimals).toNumber();
  });

  const pools = await api.query.incentives.incentiveRewardAmounts.keys();
  const data = await Promise.all(pools.map(async (poolId) => await api.query.incentives.incentiveRewardAmounts.entries(poolId.args[0])));
  const needPayObj: {
    [k: string]: {
      balance?: number;
      periodPay: number | string;
      paidableDays: number | string;
    };
  } = {};
  data.forEach((rewardAmounts, i) => {
    const rewardAmountsConfig = rewardAmounts.map((item) => {
      const token = wallet.__getToken(item[0].args[1]);
      const payAmount = FixedPointNumber.fromInner(item[1].toString(), token.decimals);
      if (needPayObj[token.display] && needPayObj[token.display].periodPay) {
        needPayObj[token.display].periodPay = Number(needPayObj[token.display].periodPay) + payAmount.toNumber();
      } else {
        needPayObj[token.display] = {
          periodPay: payAmount.toNumber(),
          paidableDays: 0,
        };
      }
    });
  });

  Object.keys(needPayObj).forEach((key) => {
    needPayObj[key].balance = balanceObj[key];
    needPayObj[key].paidableDays = Math.floor(balanceObj[key] / (Number(needPayObj[key].periodPay) * 60 * 24));
  });

  Object.keys(balanceObj).forEach((key) => {
    if (!needPayObj[key]) {
      needPayObj[key] = {
        balance: balanceObj[key],
        periodPay: "-",
        paidableDays: "-",
      };
    }
  });

  return needPayObj;
};
