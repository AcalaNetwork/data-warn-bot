import { Logger, POLKADOTXCMS } from "../utils"

export const polkadotXcms = async (height: number, methods: string, args: any, index: number) => {
  Logger.pushEvent(POLKADOTXCMS, `%%% \n - methods: ${methods} \n - data: ${JSON.stringify(args)} \n - link: https://karura.subscan.io/extrinsic/${height}-${index} \n %%%`, 'low', 'info');
}