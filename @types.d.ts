declare interface IConfig {
  port: number,
  endPoints: {[key in TChain]: string},
  host: string;
  ksm: {
    account: string
    decimal: number
  }
}