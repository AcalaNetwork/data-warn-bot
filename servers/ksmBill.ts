import { config } from "../config";
import { KarApi, KsmApi, KSM_BILL, Logger } from "../utils";
import { FixedPointNumber, forceToCurrencyId } from '@acala-network/sdk-core';

export const ksmBill = async () => {
  await KarApi.isReady;
  await KsmApi.isReady;
  const ksmAccount = await KsmApi.query.system.account(config.ksm.account);
  const ksmBalace = FixedPointNumber.fromInner(ksmAccount.data.free.toString(), config.ksm.decimal);

  const _karBalace = await KarApi.query.tokens.totalIssuance(forceToCurrencyId(KarApi, 'KSM'));
  const karBalace = FixedPointNumber.fromInner(_karBalace.toString(), config.ksm.decimal);

  if (ksmBalace.lte(karBalace) || (ksmBalace.sub(karBalace)).div(karBalace).toNumber() > 0.001) {
    Logger.pushEvent(
      KSM_BILL,
      `%%% \n - ksm balacne in Parachain account: __${ksmBalace.toNumber()}__ \n - total insurance in karura: __${karBalace.toString()}__ `,
      'normal',
      'warning');
  }
}