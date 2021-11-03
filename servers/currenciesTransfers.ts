import { FixedPointNumber } from "@acala-network/sdk-core";
import { WalletPromise } from "@acala-network/sdk-wallet";
import { AccountId32 } from "@acala-network/types/interfaces";
import { Event } from "@open-web3/scanner/types";
import { u128 } from "@polkadot/types";
import { generateDexToken, LARGE_CURRENCIES_TRANSFER, Logger } from "../utils";


export const currenciesTransfers = async (KarWallet: WalletPromise, height: number, event: Event) => {
  const [currencyId, from, to, amount] = event.args as [any, AccountId32, AccountId32, u128];
  const tokenName = generateDexToken(currencyId);
  const { token, price } = await KarWallet.queryPrice(tokenName);
  const fromAccount = from.toString();
  const toAccount = to.toString();
  const _amount = FixedPointNumber.fromInner(amount.toString(), token.decimal);
  const TokenPrice = _amount.times(price);

  if(TokenPrice.toNumber() > 10000) {
    Logger.pushEvent(
      LARGE_CURRENCIES_TRANSFER,
      `%%% \n - token: ${tokenName} \n - from: ${fromAccount} \n - to: ${toAccount} \n - amount: ${_amount.toNumber()} \n %%%`,
      'normal',
      'warning'
    )
  }
}