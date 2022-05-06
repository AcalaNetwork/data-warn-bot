import { config } from "../config";
import { KarApi, KsmApi, KSM_BILL, Logger } from "../utils";
import { FixedPointNumber, forceToCurrencyId } from '@acala-network/sdk-core';
import { RecurrenceRule, scheduleJob } from "node-schedule";

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

export const ksmBill = () => {
  const rule = new RecurrenceRule();
  rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  rule.second = 0

  const job = scheduleJob(rule, _ksmBill);
}