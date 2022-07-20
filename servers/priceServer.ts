import axios from 'axios'
import { Logger, PRICE_SERVER } from '../utils';

export const priceServer = async () => {
  const data = await axios.get('https://api.polkawallet.io/price-server/?token=KSM&from=market');

  console.log(data)

  if(data.status === 200) {
    Logger.pushEvent(PRICE_SERVER, '', 'normal', 'info');
  }
}