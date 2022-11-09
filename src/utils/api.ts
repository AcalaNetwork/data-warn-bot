/* eslint-disable no-prototype-builtins */
import { API_ERROR, Logger } from ".";
import { ApiPromise } from "@polkadot/api/promise";
import { WsProvider } from "@polkadot/rpc-provider";
import { config } from "../config";
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
  constructor() {
    if (karuraApi.instance == null) {
      this.provider = new WsProvider(config.endPoints.karura);
      this.api = new ApiPromise(options({ provider: this.provider }));
      this.api.isReadyOrError
        .then(() => {
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
      .then(() => {
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
      .then(() => {
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
      .then(() => {
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
const allNetworks = ["aca", "kar", "dot", "ksm"];
let connectedAll = false;
export const connectNodes = async () => {
  apis["aca"] = new acalaApi().api;
  apis["kar"] = new karuraApi().api;
  apis["dot"] = new polkaApi().api;
  apis["ksm"] = new kusamaApi().api;

  await apis["aca"].isReady;
  await apis["kar"].isReady;
  await apis["dot"].isReady;
  await apis["ksm"].isReady;

  connectedAll = true;
};

export const reConnectAll = async () => {
  connectedAll = false;

  await Promise.all(allNetworks.map((e) => apis[e].disconnect()));

  // wait 6s to disconnect
  await new Promise((resolve) => {
    setTimeout(() => {
      allNetworks.forEach((e) => {
        apis[e].connect();
      });
      resolve(true);
    }, 1000 * 6);
  });

  // wait 30s to re-connect
  await new Promise((resolve) => {
    setTimeout(() => {
      connectedAll = true;

      resolve(true);
    }, 1000 * 30);
  });
};

export const getAcaApi = () => apis["aca"];
export const getKarApi = () => apis["kar"];
export const getPolkaApi = () => apis["dot"];
export const getKsmApi = () => apis["ksm"];

export const getApiConnected = () => connectedAll;
