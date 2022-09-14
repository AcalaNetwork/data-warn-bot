import { Wallet } from "@acala-network/sdk";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { BN_ZERO } from "@polkadot/util";
import { config } from "../config";
import { DANGER_LOAN_POSITION, KarApi, Logger } from "../utils";
// send wrong message to datadog time;
const timing = 1000 * 60 * 60 * 8;

type Token = "KSM" | "LKSM";

interface CollateralParams {
  maximumTotalDebitValue: any;
  interestRatePerSec: any;
  liquidationRatio: any;
  liquidationPenalty: any;
  requiredCollateralRatio: any;
}

interface Position {
  ownerId: string;
  collateralId: Token;
  collateralAmount: string;
  debitAmount: string;
}

export const requestAllLoans = async (): Promise<Position[]> => {
  const loanTypes = ["KSM", "LKSM"];
  const allLoans: any[][] = await Promise.all(loanTypes.map((token) => KarApi.query.loans.positions.entries({ Token: token })));
  return allLoans.reduce((a, b, i) => {
    const loans = b
      .filter(([_, { debit }]) => debit.gt(BN_ZERO))
      .map(([key, { collateral, debit }]) => {
        return {
          ownerId: key.toHuman()[1],
          collateralId: loanTypes[i],
          collateralAmount: collateral.toString(),
          debitAmount: debit.toString(),
        };
      });
    return [...a, ...loans];
  }, []);
};

const requestParams = async () => {
  const [_debitExchangeRateKSM, _debitExchangeRateLKSM, _collateralParamsKSM, _collateralParamsLKSM] = (await KarApi.queryMulti([
    [KarApi.query.cdpEngine.debitExchangeRate, { Token: "KSM" }],
    [KarApi.query.cdpEngine.debitExchangeRate, { Token: "LKSM" }],
    [KarApi.query.cdpEngine.collateralParams, { Token: "KSM" }],
    [KarApi.query.cdpEngine.collateralParams, { Token: "LKSM" }],
  ])) as [any, any, CollateralParams, CollateralParams];

  return {
    KSM: {
      debitExchangeRate: FixedPointNumber.fromInner(_debitExchangeRateKSM.toString(), 18),
      requiredCollateralRatio: FixedPointNumber.fromInner(_collateralParamsKSM.requiredCollateralRatio.toString(), 18),
    },
    LKSM: {
      debitExchangeRate: FixedPointNumber.fromInner(_debitExchangeRateLKSM.toString(), 18),
      requiredCollateralRatio: FixedPointNumber.fromInner(_collateralParamsLKSM.requiredCollateralRatio.toString(), 18),
    },
  };
};

const requestPrice = async (KarWallet: Wallet) => {
  const price = await Promise.all([KarWallet.getPrice("KSM"), KarWallet.getPrice("LKSM")]);

  return {
    KSM: price[0],
    LKSM: price[1],
  };
};

/// query KSM/LKSM loan positions on Karura,
/// send [warn] message if any position below required collateral ratio.
/// query data from subql(may not be available).
export const loanLevel = async (KarWallet: Wallet) => {
  const totalLoans = await requestAllLoans();
  const price = await requestPrice(KarWallet);
  const params = await requestParams();
  let strings = "";

  totalLoans.forEach((loan) => {
    const token = loan.collateralId;
    const collateralAmount = FixedPointNumber.fromInner(loan.collateralAmount, config.ksm.decimal);
    const collateralValue = collateralAmount.times(price[token]);
    const debitAmount = FixedPointNumber.fromInner(loan.debitAmount, config.ksm.decimal);
    const debitValue = debitAmount.times(params[token].debitExchangeRate);
    const ratio = collateralValue.div(debitValue);
    const requiredCollateralRatio = params[token].requiredCollateralRatio;

    if (requiredCollateralRatio >= ratio) {
      strings += `- account: ${
        loan.ownerId
      }, collateralId: ${token}, collateralAmount: ${collateralAmount.toNumber()}, debitAmount: ${debitAmount.toNumber()}, ratio: ${ratio.toNumber()} \n`;
    }
  });

  if (strings != "") {
    Logger.pushEvent(DANGER_LOAN_POSITION, `%%% \n ${strings} \n %%% @slack-watchdog`, "normal", "warning");
  }
};
