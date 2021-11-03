import { Logger, POLKADOTXCMS } from "../utils"

export const polkadotXcms = async (height: number, methods: string, args: any) => {
  Logger.pushEvent(POLKADOTXCMS, `%%% \n - methods: ${methods} \n - data: ${JSON.stringify(args)} \n %%%`, 'low', 'info');
}