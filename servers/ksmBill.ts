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
  const ksmBalace = FixedPointNumber.fromInner(ksmAccount.data.free.toString(), config.ksm.decimal);

  const _karBalace = await KarApi.query.tokens.totalIssuance(forceToCurrencyId(KarApi, 'KSM'));
  const karBalace = FixedPointNumber.fromInner(_karBalace.toString(), config.ksm.decimal);

  if (ksmBalace.lte(karBalace) || (ksmBalace.sub(karBalace)).div(karBalace).toNumber() > 0.001) {
    Logger.pushEvent(
      KSM_BILL,
      `%%% \n - KSM Balacne In Parachain Account: __${ksmBalace.toNumber()}__ \n - Total Issuance In KARURA: __${karBalace.toString()}__ \n %%%`,
      'normal',
      'warning');
  }
}