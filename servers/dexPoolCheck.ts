import { AcaApi, KarApi, Logger } from "../utils";
import { FixedPointNumber as FN } from "@acala-network/sdk-core";

function getTokenName(raw: string) {
  switch (raw) {
    case '{"DexShare":{"col0":{"Token":"ACA"},"col1":{"Token":"AUSD"}}}':
      return "lp-ACA-AUSD";
    case '{"DexShare":{"col0":{"Token":"AUSD"},"col1":{"Token":"LDOT"}}}':
      return "lp-AUSD-LDOT";
    case '{"DexShare":{"col0":{"Token":"AUSD"},"col1":{"LiquidCrowdloan":13}}}':
      return "lp-AUSD-lcDOT";
    case '{"DexShare":{"col0":{"Token":"DOT"},"col1":{"LiquidCrowdloan":13}}}':
      return "lp-DOT-lcDOT";
    case '{"DexShare":{"col0":{"Token":"AUSD"},"col1":{"ForeignAsset":3}}}':
      return "lp-AUSD-IBTC";
    case '{"DexShare":{"col0":{"Token":"AUSD"},"col1":{"ForeignAsset":4}}}':
      return "lp-AUSD-INTR";
    case '{"Token":"AUSD"}':
      return "AUSD";
    case '{"Token":"ACA"}':
      return "ACA";
    case '{"ForeignAsset":"3"}':
      return "IBTC";
    case '{"ForeignAsset":"4"}':
      return "INTR";
    case '{"Token":"LDOT"}':
      return "LDOT";
    case '{"Token":"DOT"}':
      return "DOT";
    case '{"LiquidCrowdloan":"13"}':
      return "LCDOT";
  }

  return "unconfig";
}

function getTokenDecimals(token: string) {
  const t = token.match("lp-") ? token.split("-")[1] : token;
  switch (t.toUpperCase()) {
    case "DOT":
      return 10;
    case "LDOT":
      return 10;
    case "AUSD":
      return 12;
    case "IBTC":
      return 8;
    case "INTR":
      return 10;
    case "LCDOT":
      return 10;
  }

  return 12;
}

export const dexPoolCheck = async (env: "KARURA" | "ACALA" = "KARURA") => {
  const api = env === "KARURA" ? KarApi : AcaApi;
  const dexPoolInfo = await api.query.dex.liquidityPool.entries();
  let strings = "";
  dexPoolInfo.forEach(([k, v]) => {
    const pair = (k.toHuman() as any as any[])[0];
    const token0 = getTokenName(JSON.stringify(pair[0]).trim());
    const token1 = getTokenName(JSON.stringify(pair[1]).trim());
    const decimals0 = getTokenDecimals(token0);
    const decimals1 = getTokenDecimals(token1);
    const amount0 = FN.fromInner((v as any)[0], decimals0);
    const amount1 = FN.fromInner((v as any)[1], decimals1);

    strings += `[${token0}-${token1}]\n`;
    strings += `  - 1 ${token1} = ${amount0.div(amount1).toNumber()} ${token0}\n`;
    strings += `  - 1 ${token0} = ${amount1.div(amount0).toNumber()} ${token1}\n`;
  });

  Logger.pushEvent("[DEX_EXCHANGE_RATE] Dex Exchange Rate Check", `%%% \n ${strings} \n %%% @slack-watchdog`, "normal", "warning");
};
