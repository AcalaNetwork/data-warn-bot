import { AccountId32 } from "@acala-network/types/interfaces";
import { Event } from "@open-web3/scanner/types";
import { FixedPointNumber } from "@acala-network/sdk-core";
import { LARGE_CURRENCIES_TRANSFER, Logger, generateDexToken } from "../utils";
import { Wallet } from "@acala-network/sdk";
import { u128 } from "@polkadot/types";

/**
 * send [warn] message if currency transfer amount > $300000.
 */
export const currenciesTransfers = async (KarWallet: Wallet, height: number, event: Event) => {
  const [currencyId, from, to, amount] = event.args as [any, AccountId32, AccountId32, u128];
  const tokenName = generateDexToken(currencyId);
  const price = await KarWallet.getPrice(tokenName);
  const token = KarWallet.__getToken(tokenName);
  const fromAccount = from.toString();
  const toAccount = to.toString();
  const _amount = FixedPointNumber.fromInner(amount.toString(), token?.decimals);
  const TokenPrice = _amount.times(price);

  const link =
    event.phaseType === "ApplyExtrinsic"
      ? `- link: https://karura.subscan.io/extrinsic/${height}-${event.phaseIndex}?event=${height}-${event.index} \n `
      : "";

  if (TokenPrice.toNumber() > 300000) {
    Logger.pushEvent(
      LARGE_CURRENCIES_TRANSFER,
      `%%% \n - token: ${tokenName} \n - from: ${fromAccount} \n - to: ${toAccount} \n - amount: ${_amount.toNumber()} \n ${link} %%% @slack-Acala-data-warn-bot`,
      "normal",
      "warning"
    );
  }
};
