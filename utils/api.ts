import { ApiPromise } from '@polkadot/api/promise';
import { WsProvider } from '@polkadot/rpc-provider';
import { types, typesBundle } from '@acala-network/type-definitions';
import { config } from '../config';
import { API_ERROR, Logger } from '.';
import Scanner from '@open-web3/scanner';
import { options } from '@acala-network/api';

export type TChain = 'karura' | 'kusama';

interface IToken extends Object {
  token?: string;
  dexShare?: IToken[];
  foreignAsset?: number;
  erc20?: string;
  liquidCrowdloan?: string;
  stableAssetPoolToken?: string;
}


export const generateDexToken = (tokens: IToken) => {
  if(tokens.token) {
    return tokens.token;
  } else if(tokens.dexShare) {
    return `lp://${tokens?.dexShare[0].token}/${tokens?.dexShare[1].token}`
  } else if(tokens.erc20) {
    return `erc20://${tokens.erc20}`
  } else if(tokens.foreignAsset) {
    return `fa://${tokens.foreignAsset}`
  } else if(tokens.stableAssetPoolToken) {
    return `sa://${tokens.stableAssetPoolToken}`
  } else if(tokens.liquidCrowdloan) {
    return `lc://${tokens.liquidCrowdloan}`
  } else {
    return JSON.stringify(tokens);
  }
}

export class karuraApi {
  static instance: karuraApi | null
  public api: ApiPromise;
  public provider: WsProvider;
  public scanner: Scanner;
  constructor() {
    if (karuraApi.instance == null) {
      this.provider = new WsProvider(config.endPoints.karura);
      this.api = new ApiPromise(options({provider: this.provider}));
      this.scanner = new Scanner({ wsProvider: this.provider, types, typesBundle })
      this.api.isReadyOrError.then(_api => {
        Logger.log('karuraApi is Ready!')
      }).catch(err => {
        Logger.pushEvent(API_ERROR, err, 'normal', 'error');
      })
      karuraApi.instance = this;
    }
    return karuraApi.instance;
  }
}

export class kusamaApi {
  static instance: kusamaApi | null
  public api: ApiPromise;
  constructor() {
    const provider = new WsProvider(config.endPoints.kusama);
    this.api = new ApiPromise(options({provider}));
    this.api.isReadyOrError.then(_api => {
      Logger.log('kusamaApi is Ready!')
    }).catch(err => {
      Logger.pushEvent(API_ERROR, err, 'normal', 'error');
    })
    if (kusamaApi.instance == null) {
      kusamaApi.instance = this;
    }
    return kusamaApi.instance;
  }
};

export class acalaApi {
  static instance: acalaApi | null
  public api: ApiPromise;
  constructor() {
    const provider = new WsProvider(config.endPoints.acala);
    this.api = new ApiPromise(options({provider}));
    this.api.isReadyOrError.then(_api => {
      Logger.log('acalaApi is Ready!')
    }).catch(err => {
      Logger.pushEvent(API_ERROR, err, 'normal', 'error');
    })
    if (acalaApi.instance == null) {
      acalaApi.instance = this;
    }
    return acalaApi.instance;
  }
};

export class polkaApi {
  static instance: polkaApi | null
  public api: ApiPromise;
  constructor() {
    const provider = new WsProvider(config.endPoints.polkadot);
    this.api = new ApiPromise(options({provider}));
    this.api.isReadyOrError.then(_api => {
      Logger.log('polkaApi is Ready!')
    }).catch(err => {
      Logger.pushEvent(API_ERROR, err, 'normal', 'error');
    })
    if (polkaApi.instance == null) {
      polkaApi.instance = this;
    }
    return polkaApi.instance;
  }
};


const _KarApi = new karuraApi();
export const KarApi = _KarApi.api;
export const KarScanner = _KarApi.scanner;
export const KarProvider = _KarApi.provider;
const _KsmApi = new kusamaApi();
export const KsmApi = _KsmApi.api;
const _AcaApi = new acalaApi();
export const AcaApi = _AcaApi.api;
const _PolkaApi = new polkaApi();
export const PolkaApi = _PolkaApi.api;