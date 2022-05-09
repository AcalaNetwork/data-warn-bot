import { Wallet } from "@acala-network/sdk";
import { FixedPointNumber as FN, forceToCurrencyName } from "@acala-network/sdk-core";
import axios from "axios";
import { RecurrenceRule, scheduleJob } from "node-schedule";
import { config } from "../config";
import { DEX_PRICE_WARNING, KarApi, Logger } from "../utils"

interface ItradingPairs {
  [k: string]: {
    token: [string, string];
    price: [string, string];
    pools: [string, string];
    exchange_rate_dex: number;
    market_price: number;
    rate: number
  }
}

const formatQueryParmas = (name: string) => {
  if(name.includes('://')) {
    if(name.startsWith('sa://')) {
      return {StableAssetPoolToken: name.slice(5)};
    } else if(name.startsWith('lc://')) {
      return {liquidCrowdloan: name.slice(5)};
    } else if(name.startsWith('fa://')) {
      return {ForeignAsset: name.slice(5)};
    }
  } else {
    return {Token: name};
  }
};

export const _dexStatus = async (KarWallet: Wallet) => {
  let strings = '';
  const pools = await KarApi.query.dex.tradingPairStatuses.entries();
  const enabledPoolQuerys: [string, string][] = [];
  const tokens: string[] = [];
  const tradingPairs: ItradingPairs = {};
  const prices: any = {};
  pools.forEach(pool => {
    const [pair, status] = pool;
    const [token1, token2] = [forceToCurrencyName((pair.args[0] as any)[0]), forceToCurrencyName((pair.args[0] as any)[1])];
    if (status.toString() === 'Enabled') {
      enabledPoolQuerys.push([token1, token2]);
      tokens.push(...[token1, token2]);
    }
  })
  const liquidityPools = await Promise.all(enabledPoolQuerys.map(pair => KarApi.query.dex.liquidityPool([formatQueryParmas(pair[0]), formatQueryParmas(pair[1])])));
  const liquidityPrices = await Promise.all(Array.from(new Set(tokens)).map( async token => {
    return {
      token: KarWallet.__getToken(token),
      price: await KarWallet.getPrice(token)
    }
  }));
  const karPrice = await axios.get(config.price, { params: { token: 'KAR' } })
  liquidityPrices.forEach(token => prices[token.token?.name || ''] = token.price.toNumber());
  prices.KAR = karPrice.data.data.price[0];

  liquidityPools.forEach((item, index) => {
    const [token0, token1] = enabledPoolQuerys[index];
    const pair = `${token0}-${token1}`;
    const [decimal0, decimal1] = [KarWallet?.__getToken(token0)?.decimals, KarWallet?.__getToken(token1)?.decimals]
    const [_issuance0, _issuance1] = [(item.toJSON() as any)[0], (item.toJSON() as any)[1]];
    const [issuance0, issuance1] = [FN.fromInner(_issuance0, decimal0), FN.fromInner(_issuance1, decimal1)];
    const exchange_rate_dex = issuance1.div(issuance0).toNumber();
    const market_price = prices[token0] / prices[token1];
    const rate = (exchange_rate_dex - market_price) / market_price;
    tradingPairs[pair] = {
      pools: [issuance0.toString(), issuance1.toString()],
      token: [token0, token1],
      price: [prices[token0], prices[token1]],
      exchange_rate_dex: exchange_rate_dex,
      market_price: market_price,
      rate,
    }

    if (enabledPoolQuerys[index].includes('KUSD') && (rate >= 0.15 || rate <= -0.15)) {
      strings += `- pool: ${pair}, price: [${prices[token0]}, ${prices[token1]}], exchange_rate_dex: ${exchange_rate_dex}, market_price: ${market_price}, rate: ${rate} \n`
    }
    if (!enabledPoolQuerys[index].includes('KUSD') && (rate >= 0.1 || rate <= -0.1)) {
      strings += `- pool: ${pair}, price: [${prices[token0]}, ${prices[token1]}], exchange_rate_dex: ${exchange_rate_dex}, market_price: ${market_price}, rate: ${rate} \n`
    }
  })

  if (strings != '') {
    Logger.pushEvent(
      DEX_PRICE_WARNING,
      `%%% \n - list: \n ${strings} \n %%%`,
      'normal',
      'info'
    )
  }
}

export const dexStatus = (KarApi: Wallet) => {
  const rule = new RecurrenceRule();
  rule.minute = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  rule.second = 0

  const job = scheduleJob(rule, () => _dexStatus(KarApi));
}