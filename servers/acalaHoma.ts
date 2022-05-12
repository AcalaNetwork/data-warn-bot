import { RecurrenceRule, scheduleJob } from "node-schedule";
import { AcaApi, PolkaApi, Logger, ACALA_HOMA } from "../utils"

const ledger0 = '15sr8Dvq3AT3Z2Z1y8FnQ4VipekAHhmQnrkgzegUr1tNgbcn';

export const acalaHomaCheckWithKsm = async () => {
  let strings = '';
  const acaEra = await AcaApi.query.homa.relayChainCurrentEra();
  const polkaEra = await PolkaApi.query.staking.currentEra();
  const eraCheckOk = Number(acaEra.toString()) <= Number(polkaEra.toString());
  let ksmUnlockingLenCheckOk = false;
  let percentCheckOk = false;

  const karLedgerss = await AcaApi.query.homa.stakingLedgers.entries();
  const ksmLedgers0 = await PolkaApi.query.staking.ledger(ledger0);

  const _MinNominatorBond = await PolkaApi.query.staking.minNominatorBond();
  const MinNominatorBond = Number(_MinNominatorBond.toString())

  strings += '## Era Check \n'
  strings += `- Acala: ${acaEra.toString()} \n`
  strings += `- Polkadot: ${polkaEra.toString()} \n \n`

  karLedgerss.forEach(ledger => {
    const [no, data] = ledger;
    const ledgerNo = Number(no.args[0].toString());
    const bonded = Number((data.toJSON() as any).bonded);
    const unlockingLen = (data.toJSON() as any).unlocking.length;

    const ksmLedger = ksmLedgers0;

    const _ksmBonded = Number((ksmLedger?.toJSON() as any)?.active) || 0;
    const ksmBonded = _ksmBonded - MinNominatorBond;
    const ksmUnlockingLen = (ksmLedger?.toJSON() as any)?.unlocking.length || 0;

    ksmUnlockingLenCheckOk = ksmUnlockingLenCheckOk && (unlockingLen === ksmUnlockingLen || unlockingLen + 1 === ksmUnlockingLen);

    percentCheckOk = percentCheckOk && bonded <= ksmBonded && (ksmBonded - bonded) / bonded <= 0.003;

    strings += `- ## subaccount #${ledgerNo}: \n`
    strings += '\n ### bonded \n';
    strings += `- homa ledger ${ledgerNo}: ${bonded} \n`
    strings += `- subaccount #${ledgerNo}: ${ksmBonded} \n`
    strings += '\n ### unlocking \n'
    strings += `- homa ledger ${ledgerNo}: \n ${JSON.stringify((data.toJSON() as any).unlocking).replace(RegExp('\"', 'g'), '')} \n`
    strings += `- subaccount #${ledgerNo}: \n ${JSON.stringify((ksmLedger.toJSON() as any).unlocking).replace(RegExp('\"', 'g'), '')} \n`

  })
  Logger.pushEvent(
    ACALA_HOMA,
    `%%% \n ${strings} \n %%%`,
    'normal',
    'warning');
  if(!eraCheckOk || !ksmUnlockingLenCheckOk || !percentCheckOk) {
    Logger.pushEvent(
      ACALA_HOMA,
      `%%% \n ${strings} \n %%%`,
      'normal',
      'warning');
  }

}