import { HOMA, KarApi, KsmApi, Logger } from "../utils"
// send wrong message to datadog time;
const timing = 1000 * 60 * 60 * 6;

const ledger0 = 'HTAeD1dokCVs9MwnC1q9s2a7d2kQ52TAjrxE1y5mj5MFLLA';
const ledger1 = 'FDVu3RdH5WsE2yTdXN3QMq6v1XVDK8GKjhq5oFjXe8wZYpL';
const ledger2 = 'EMrKvFy7xLgzzdgruXT9oXERt553igEScqgSjoDm3GewPSA';

export const _homaCheckWithKsm = async () => {
  const karEra = await KarApi.query.homa.relayChainCurrentEra();
  const ksmEra = await KsmApi.query.staking.currentEra();
  const eraCheckOk = Number(karEra.toString()) <= Number(ksmEra.toString());
  let ksmUnlockingLenCheckOk = false;
  let percentCheckOk = false;

  const karLedgerss = await KarApi.query.homa.stakingLedgers.entries();
  const ksmLedgers0 = await KsmApi.query.staking.ledger(ledger0);
  const ksmLedgers1 = await KsmApi.query.staking.ledger(ledger1);
  const ksmLedgers2 = await KsmApi.query.staking.ledger(ledger2);

  const _MinNominatorBond = await KsmApi.query.staking.minNominatorBond();
  const MinNominatorBond = Number(_MinNominatorBond.toString())

  karLedgerss.forEach(ledger => {
    const [no, data] = ledger;
    const ledgerNo = Number(no.args[0].toString());
    const bonded = Number((data.toJSON() as any).bonded);
    const unlockingLen = (data.toJSON() as any).unlocking.length;

    const ksmLedger = ledgerNo === 0 ? ksmLedgers0 : (ledgerNo === 1 ? ksmLedgers1 : ksmLedgers2)

    const _ksmBonded = Number((ksmLedger.toJSON() as any).active) || 0;
    const ksmBonded = _ksmBonded - MinNominatorBond;
    const ksmUnlockingLen = (ksmLedger.toJSON() as any).unlocking.length || 0;

    ksmUnlockingLenCheckOk = unlockingLen === ksmUnlockingLen || unlockingLen + 1 === ksmUnlockingLen;

    percentCheckOk = bonded <= ksmBonded && (ksmBonded - bonded) / bonded <= 0.003;

  })
  if(!(eraCheckOk || ksmUnlockingLenCheckOk || percentCheckOk)) {
    Logger.pushEvent(
      HOMA,
      `%%% \n errors: ${!eraCheckOk ? 'current era error! \n' : ''} ${!percentCheckOk ? 'ledger bonded error! \n' : ''} ${!ksmUnlockingLenCheckOk ? 'unlocking length error! \n' : ''} \n %%%`,
      'normal',
      'warning');
  }

}

export const homaCheckWithKsm = () => {
  setInterval(() => {
    _homaCheckWithKsm();
  }, timing)
}

