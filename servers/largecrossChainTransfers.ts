import { FixedPointNumber } from "@acala-network/sdk-core";
import { LARGE_XTOKENS_TRANSFER, Logger, generateDexToken } from "../utils";
import { config } from "../config";
import { encodeAddress } from "@polkadot/util-crypto";
import { u128, u64 } from "@polkadot/types";

interface XTokensArgs {
  currency_id: {
    token: string;
  };
  amount: u128;
  dest: {
    v1: {
      parents: number;
      interior: {
        x1: {
          accountId32: {
            network: any;
            id: string;
          };
        };
      };
    };
  };
  dest_weight: u64;
}

/**
 * send [warn] message if xTokens transfer out KSM > 1000.
 */
export const largecrossChainTransfers = async (height: number, args: any, index: number) => {
  const { currency_id, amount, dest } = args as XTokensArgs;

  const token = generateDexToken(currency_id);
  const total = FixedPointNumber.fromInner(amount.toString(), config.ksm.decimal).toNumber();
  const account = dest?.v1?.interior?.x1?.accountId32?.id
    ? encodeAddress(dest?.v1?.interior?.x1?.accountId32?.id?.toString() || "", config.kar.prefix)
    : "";
  const parents = dest.v1.parents;

  if (total > 1000 && token === "KSM") {
    Logger.pushEvent(
      LARGE_XTOKENS_TRANSFER,
      `%%% \n - block_height: __${height}__ \n - sender: __${account}__ \n - dest: - parents: ${parents} \n - currency_id: __${token}__ \n - amount: __${total}__ \n - link: https://karura.subscan.io/extrinsic/${height}-${index} \n %%% @slack-Acala-data-warn-bot`,
      "normal",
      "warning"
    );
  }
};
