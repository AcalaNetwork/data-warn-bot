import { config } from "../config";
import { KarApi, KsmApi, KSM_BILL, Logger } from "../utils";
import { FixedPointNumber, forceToCurrencyId } from '@acala-network/sdk-core';
// send wrong message to datadog time;
const timing = 1000 * 60 * 5;

export const ksmBill = () => {
  setInterval(() => {
    _ksmBill()
  }, timing);
}

export const _ksmBill = async () => {
  const ksmAccount = await KsmApi.query.system.account(config.ksm.account);
  const ksmBalance = FixedPointNumber.fromInner(ksmAccount.data.free.toString(), config.ksm.decimal);

  const _karBalance = await KarApi.query.tokens.totalIssuance(forceToCurrencyId(KarApi, 'KSM'));
  const karBalance = FixedPointNumber.fromInner(_karBalance.toString(), config.ksm.decimal);

  if ((ksmBalance.sub(karBalance)).div(karBalance).toNumber() > 0.01) {
    Logger.pushEvent(
      KSM_BILL,
      `%%% \n - KSM Balacne In Parachain Account: __${ksmBalance.toNumber()}__ \n - Total Issuance In KARURA: __${karBalance.toString()}__ \n %%%`,
      'normal',
      'warning');
  }
}