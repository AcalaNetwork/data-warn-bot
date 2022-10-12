import { getAcaApi, INCENTIVES, getKarApi, Logger } from "../utils";

// removed
export const checkIncentives = async () => {
  const acaAccount = "23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit";
  const karAccount = "qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a";
  const AcaNativeData = await getAcaApi().query.system.account(acaAccount);
  const karNativeData = await getKarApi().query.system.account(karAccount);
  const AcaNonNativeData = await getAcaApi().query.tokens.accounts.entries(acaAccount);
  const karNonNativeData = await getKarApi().query.tokens.accounts.entries(karAccount);

  let strings = "";

  strings += `- Balance in KARURA in qmmNufxeWaAVN8EJK58yYNW1HDcpSLpqGThui55eT3Dfr1a\n `;
  strings += `- token:KAR,  balance(free): ${(karNativeData as any).data.free.toString()} \n`;
  karNonNativeData.forEach((item) => {
    const token = JSON.stringify(item[0].args[1].toJSON());
    const free = (item[1] as any).free.toString();
    strings += `- ${token},  balance(free): ${free.toString()} \n`;
  });

  strings += `- Balance in ACALA in 23M5ttkmR6KcoUwA7NqBjLuMJFWCvobsD9Zy95MgaAECEhit\n `;
  strings += `- token:ACA,  balance(free): ${(AcaNativeData as any).data.free.toString()} \n`;
  AcaNonNativeData.forEach((item) => {
    const token = JSON.stringify(item[0].args[1].toJSON());
    const free = (item[1] as any).free.toString();
    strings += `- ${token},  balance(free): ${free.toString()} \n`;
  });

  const _strings = strings.replace(new RegExp('"', "g"), "").replace(new RegExp("{", "g"), "").replace(new RegExp("}", "g"), "");

  Logger.pushEvent(INCENTIVES, `%%% \n  ${_strings} \n %%%`, "normal", "info");
};
