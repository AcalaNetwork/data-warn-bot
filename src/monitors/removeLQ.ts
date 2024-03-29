import { Logger, REMOVE_LIQUID_STAKING, generateDexToken, getKarApi } from "../utils";
import { forceToDexShareCurrencyId } from "@acala-network/sdk-core";

export const removeLQ = async (height: number, args: any, index: number) => {
  const { currency_id_a, currency_id_b, remove_share } = args;
  const dexToken = forceToDexShareCurrencyId(getKarApi() as any, [
    generateDexToken(currency_id_a),
    generateDexToken(currency_id_b),
  ]);
  const _toalInstance = await getKarApi().query.tokens.totalIssuance(dexToken);
  const toalInstance = parseInt(_toalInstance.toString());
  const percent = remove_share / toalInstance;

  if (percent > 0.05) {
    Logger.pushEvent(
      REMOVE_LIQUID_STAKING,
      ` %%% \n - blockHeight: ${height} \n - token: ${dexToken.toString()} \n - percent: ${(percent * 100).toFixed(
        2
      )} \n - link: https://karura.subscan.io/extrinsic/${height}-${index} \n %%% @slack-Acala-data-warn-bot`,
      "normal",
      "warning"
    );
  }
};
