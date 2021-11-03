import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@acala-network/api';
import { types, typesBundle } from '@acala-network/type-definitions';
import { config } from '../config';
import { API_ERROR, Logger } from '.';
import Scanner from '@open-web3/scanner';
import { WalletPromise } from '@acala-network/sdk-wallet';

export type TChain = 'karura' | 'kusama';

interface IToken extends Object {
  token: string;
}

interface DexToken extends Object {
  dexShare: IToken[]
}

export const generateDexToken = (tokens: IToken | DexToken) => {
  if(tokens.hasOwnProperty('token')) {
    return (tokens as IToken).token;
  } else {
    const _t = tokens as DexToken;
    return `lp://${_t.dexShare[0].token}/${_t.dexShare[1].token}`
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
      this.api = new ApiPromise(options({ provider: this.provider }));
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
    this.api = new ApiPromise(options({ provider }));
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

const _KarApi = new karuraApi();
export const KarApi = _KarApi.api;
export const KarScanner = _KarApi.scanner;
export const KarProvider = _KarApi.provider;
const _KsmApi = new kusamaApi();
export const KsmApi = _KsmApi.api;