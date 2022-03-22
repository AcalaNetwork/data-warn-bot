import { FixedPointNumber, forceToCurrencyIdName } from "@acala-network/sdk-core";
import { WalletPromise } from "@acala-network/sdk-wallet";
import moment from "moment";
import { AcaApi, INCENTIVES, KarApi, Logger } from "../utils"

export const _checkIncentives = async (AcaWallet: WalletPromise, karWallet: WalletPromise) => {
  const acaAccount = '23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit';
  const karAccount = 'qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a';
  const AcaNativeData = await AcaApi.query.system.account(acaAccount);
  const karNativeData = await KarApi.query.system.account(karAccount);
  const AcaNonNativeData = await AcaApi.query.tokens.accounts.entries(acaAccount)
  const karNonNativeData = await KarApi.query.tokens.accounts.entries(karAccount)

  const acaBalance = {
    free: FixedPointNumber.fromInner((AcaNativeData as any).data.free.toString(), 12).toString(),
    reserved: FixedPointNumber.fromInner((AcaNativeData as any).data.reserved.toString(), 12).toString(),
    miscFrozen: FixedPointNumber.fromInner((AcaNativeData as any).data.miscFrozen.toString(), 12).toString(),
    feeFrozen: FixedPointNumber.fromInner((AcaNativeData as any).data.feeFrozen.toString(), 12).toString()
  }
  const karBalance = {
    free: FixedPointNumber.fromInner((karNativeData as any).data.free.toString(), 12).toString(),
    reserved: FixedPointNumber.fromInner((karNativeData as any).data.reserved.toString(), 12).toString(),
    miscFrozen: FixedPointNumber.fromInner((karNativeData as any).data.miscFrozen.toString(), 12).toString(),
    feeFrozen: FixedPointNumber.fromInner((karNativeData as any).data.feeFrozen.toString(), 12).toString()
  }
  let strings = `
- KAR balance in qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1
- free: ${karBalance.free.toString()}
- reserved: ${karBalance.reserved.toString()}
- miscFrozen: ${karBalance.miscFrozen.toString()}
- feeFrozen: ${karBalance.feeFrozen.toString()}
- ACA balance in 23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhi
- free: ${acaBalance.free.toString()}
- reserved: ${acaBalance.reserved.toString()}
- miscFrozen: ${acaBalance.miscFrozen.toString()}
- feeFrozen: ${acaBalance.feeFrozen.toString()}\n`

  strings += `- nonNative balance in KARURA in qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a\n `
  karNonNativeData.forEach(item => {
    const token = karWallet.getToken(forceToCurrencyIdName(item[0].args[1]));
    const free = FixedPointNumber.fromInner((item[1] as any).free.toString(), token.decimal);
    const reserved = FixedPointNumber.fromInner((item[1] as any).reserved.toString(), token.decimal);
    const frozen = FixedPointNumber.fromInner((item[1] as any).frozen.toString(), token.decimal);
    strings += `- token: ${token} \n - balance(free/reserved/frozen): ${free.toString()}/${reserved.toString()}/${frozen.toString()} \n`
  })
  strings += `- nonNative balance in ACALA in 23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit\n `
  AcaNonNativeData.forEach(item => {
    const token = AcaWallet.getToken(forceToCurrencyIdName(item[0].args[1]));
    const free = FixedPointNumber.fromInner((item[1] as any).free.toString(), token.decimal);
    const reserved = FixedPointNumber.fromInner((item[1] as any).reserved.toString(), token.decimal);
    const frozen = FixedPointNumber.fromInner((item[1] as any).frozen.toString(), token.decimal);
    strings += `- token: ${token} \n - balance(free/reserved/frozen): ${free.toString()}/${reserved.toString()}/${frozen.toString()} \n`
  })

  Logger.pushEvent(
    INCENTIVES,
    `%%% \n  ${strings} \n %%%`, 'normal', 'info')
}

export const checkIncentives = (AcaWallet: WalletPromise, karWallet: WalletPromise) => {
  setInterval(() => {
    if(moment().diff(moment().format('YYYY-MM-DD 12:00:00')) <= 1000 * 60 * 10) {
      _checkIncentives(AcaWallet, karWallet);
    }
  }, 1000 * 60 * 10);
};
