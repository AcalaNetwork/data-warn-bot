import { ApiPromise } from "@polkadot/api/promise";
import { WsProvider } from "@polkadot/rpc-provider";
import { types, typesBundle } from "@acala-network/type-definitions";
import { config } from "../config";
import { API_ERROR, Logger } from ".";
import Scanner from "@open-web3/scanner";
import { options } from "@acala-network/api";

export type TChain = "karura" | "kusama";

interface IToken extends Object {
  token?: string;
  dexShare?: IToken[];
  foreignAsset?: number;
  erc20?: string;
  liquidCrowdloan?: string;
  stableAssetPoolToken?: string;
}

export const generateDexToken = (tokens: IToken) => {
  if (tokens.token) {
    return tokens.token;
  } else if (tokens.dexShare) {
    return `lp://${tokens?.dexShare[0].token}/${tokens?.dexShare[1].token}`;
  } else if (tokens.erc20) {
    return `erc20://${tokens.erc20}`;
  } else if (tokens.foreignAsset || tokens.hasOwnProperty("foreignAsset")) {
    return `fa://${tokens.foreignAsset}`;
  } else if (tokens.stableAssetPoolToken || tokens.hasOwnProperty("stableAssetPoolToken")) {
    return `sa://${tokens.stableAssetPoolToken}`;
  } else if (tokens.liquidCrowdloan || tokens.hasOwnProperty("liquidCrowdloan")) {
    return `lc://${tokens.liquidCrowdloan}`;
  } else {
    return JSON.stringify(tokens);
  }
};

export class karuraApi {
  static instance: karuraApi | null;
  public api: ApiPromise;
  public provider: WsProvider;
  public scanner: Scanner;
  constructor() {
    if (karuraApi.instance == null) {
      this.provider = new WsProvider(config.endPoints.karura);
      this.api = new ApiPromise(options({ provider: this.provider }));
      this.scanner = new Scanner({ wsProvider: this.provider, types, typesBundle });
      this.api.isReadyOrError
        .then((_api) => {
          Logger.log("karuraApi is Ready!");
        })
        .catch((err) => {
          Logger.pushEvent(API_ERROR, err, "normal", "error");
        });
      karuraApi.instance = this;
    }
    return karuraApi.instance;
  }
}

export class kusamaApi {
  static instance: kusamaApi | null;
  public api: ApiPromise;
  constructor() {
    const provider = new WsProvider(config.endPoints.kusama);
    this.api = new ApiPromise(options({ provider }));
    this.api.isReadyOrError
      .then((_api) => {
        Logger.log("kusamaApi is Ready!");
      })
      .catch((err) => {
        Logger.pushEvent(API_ERROR, err, "normal", "error");
      });
    if (kusamaApi.instance == null) {
      kusamaApi.instance = this;
    }
    return kusamaApi.instance;
  }
}

export class acalaApi {
  static instance: acalaApi | null;
  public api: ApiPromise;
  constructor() {
    const provider = new WsProvider(config.endPoints.acala);
    this.api = new ApiPromise(options({ provider }));
    this.api.isReadyOrError
      .then((_api) => {
        Logger.log("acalaApi is Ready!");
      })
      .catch((err) => {
        Logger.pushEvent(API_ERROR, err, "normal", "error");
      });
    if (acalaApi.instance == null) {
      acalaApi.instance = this;
    }
    return acalaApi.instance;
  }
}

export class polkaApi {
  static instance: polkaApi | null;
  public api: ApiPromise;
  constructor() {
    const provider = new WsProvider(config.endPoints.polkadot);
    this.api = new ApiPromise(options({ provider }));
    this.api.isReadyOrError
      .then((_api) => {
        Logger.log("polkaApi is Ready!");
      })
      .catch((err) => {
        Logger.pushEvent(API_ERROR, err, "normal", "error");
      });
    if (polkaApi.instance == null) {
      polkaApi.instance = this;
    }
    return polkaApi.instance;
  }
}

const apis: Record<string, ApiPromise> = {};
export const connectNodes = async () => {
  apis["aca"] = new acalaApi().api;
  apis["dot"] = new polkaApi().api;
  apis["ksm"] = new kusamaApi().api;

  await apis["aca"].isReady;
  await apis["dot"].isReady;
  await apis["ksm"].isReady;

  await getKarApi().isReady;
};
const _KarApi = new karuraApi();
export const getKarApi = () => _KarApi.api;
export const getKarScanner = () => _KarApi.scanner;

export const getAcaApi = () => apis["aca"];
export const getPolkaApi = () => apis["dot"];
export const getKsmApi = () => apis["ksm"];
