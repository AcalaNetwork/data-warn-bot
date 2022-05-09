import { config } from "../config";
import { AcaApi, KarApi, KsmApi, KSM_BILL, Logger, PolkaApi } from "../utils";
import { FixedPointNumber } from '@acala-network/sdk-core';
import { RecurrenceRule, scheduleJob } from "node-schedule";

export const _ksmBill = async () => {
  const ksmAccount = await KsmApi.query.system.account(config.ksm.account);
  const ksmBalance = FixedPointNumber.fromInner((ksmAccount as any).data.free.toString(), config.ksm.decimal);

  const _karBalance = await KarApi.query.tokens.totalIssuance({Token: 'KSM'});
  const karBalance = FixedPointNumber.fromInner(_karBalance.toString(), config.ksm.decimal);

  const polkaAccount = await PolkaApi.query.system.account(config.ksm.account);
  const polkaBalance = FixedPointNumber.fromInner((polkaAccount as any).data.free.toString(), 10);

  const _acaBalance = await AcaApi.query.tokens.totalIssuance({Token: 'DOT'});
  const acaBalance = FixedPointNumber.fromInner(_acaBalance.toString(), 10);

  let strings = '';

  if ((ksmBalance.sub(karBalance)).div(karBalance).toNumber() > 0.01) {
    strings += `\n - KSM Balacne In Parachain Account: __${ksmBalance.toNumber()}__ \n - Total Issuance In KARURA: __${karBalance.toString()}__ \n `
  }

  if ((polkaBalance.sub(acaBalance)).div(acaBalance).toNumber() > 0.01) {
    strings += `- DOT Balacne In Parachain Account: __${polkaBalance.toNumber()}__ \n - Total Issuance In ACALA: __${acaBalance.toString()}__ \n `
  }

  if(strings != '') {
    Logger.pushEvent(
      KSM_BILL,
      `%%% \n ${strings} \n %%%`,
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