import { FixedPointNumber, forceToCurrencyIdName } from "@acala-network/sdk-core";
import { CurrencyId } from "@acala-network/types/interfaces";
import { u128, u64 } from "@polkadot/types";
import { encodeAddress } from "@polkadot/util-crypto";
import { config } from "../config";
import { generateDexToken, LARGE_XTOKENS_TRANSFER, Logger } from "../utils";

interface XTokensArgs {
  currency_id: {
    token: string
  };
  amount: u128,
  dest: {
    v1: {
      parents: number,
      interior: {
        x1: {
          accountId32: {
            network: any,
            id: string
          }
        }
      }
    }
  },
  dest_weight: u64;
}

export const largecrossChainTransfers = async (height: number, args: any, index: number) => {
  const { currency_id, amount, dest, dest_weight } = args as XTokensArgs;

  const token = generateDexToken(currency_id);
  const total = FixedPointNumber.fromInner(amount.toString(), config.ksm.decimal).toNumber();
  const account = dest?.v1?.interior?.x1?.accountId32?.id ? encodeAddress(dest?.v1?.interior?.x1?.accountId32?.id?.toString() || '', config.kar.prefix) : '';
  const parents = dest.v1.parents;

  if(total > 1000 && token === 'KSM') {
    Logger.pushEvent(
      LARGE_XTOKENS_TRANSFER,
      `%%% \n - block_height: __${height}__ \n - sender: __${account}__ \n - dest: - parents: ${parents} \n - currency_id: __${token}__ \n - amount: __${total}__ \n - link: https://karura.subscan.io/extrinsic/${height}-${index} \n %%%`
    );
  } 
}