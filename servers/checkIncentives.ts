import { forceToCurrencyIdName } from "@acala-network/sdk-core";
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

  let strings = '';

  strings += `- Balance in KARURA in qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a\n `
  strings += `- token: KAR,  balance(free): ${(karNativeData as any).data.free.toString()} \n`
  karNonNativeData.forEach(item => {
    const token = forceToCurrencyIdName(item[0].args[1]);
    const free = (item[1] as any).free.toString();
    strings += `- token: ${token},  balance(free): ${free.toString()} \n`
  })
  
  strings += `- Balance in ACALA in 23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit\n `
  strings += `- token: ACA,  balance(free): ${(AcaNativeData as any).data.free.toString()} \n`
  AcaNonNativeData.forEach(item => {
    const token = AcaWallet.getToken(forceToCurrencyIdName(item[0].args[1]));
    const free = (item[1] as any).free.toString();
    strings += `- token: ${token},  balance(free): ${free.toString()} \n`
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
