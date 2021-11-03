import moment from 'moment';
import { v1 } from '@datadog/datadog-api-client';
import { EventPriority } from '@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventPriority';
import { EventAlertType } from '@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventAlertType';
import { config } from '../config';

const configuration = v1.createConfiguration();
const events = new v1.EventsApi(configuration);

// socket error
export const API_ERROR = '[API_ERROR] Apipromise Create Error';
export const SCANNER_ERROR = '[API_ERROR] Scanner Subscribe Error';

// servers error
export const KSM_BILL = '[KSM_BILL] Parachain Account Balance Is Wrong With Karura Total Insurance';
export const LARGE_XTOKENS_TRANSFER = '[LARGE_TRANSFER] More Than 100 KSM Xtokens Transfer'
export const LARGE_CURRENCIES_TRANSFER = '[LARGE_TRANSFER] More Than $10000 Currencies Transfer'
export const LARGE_TOKENS_TRANSFER = '[LARGE_TRANSFER] More Than $10000 Tokens Transfer'

export class Logger {
  public static log(...args: any[]) {
    const { stack } = new Error();
    const arr = stack?.split('\n') as string[];
    const path = arr[2].trim();
    const _path = path.split('data-warn-bot');
    const time = moment().format('MM-DD HH:mm:ss');
    console.log(`[INFO] [${time}] [at ${_path[1]} ] \n${args.map((i, a) => `    ${i}${args.length == a + 1 ? '' : '\n'}`).join('')}`);
  }

  public static error(...args: any[]) {
    const { stack } = new Error();
    const arr = stack?.split('\n') as string[];
    const path = arr[2].trim();
    const _path = path.split('data-warn-bot');
    const time = moment().format('MM-DD HH:mm:ss');
    console.error(`[ERROR] [${time}] [at ${_path[1]} ] \n${args.map((i, a) => `    ${i}${args.length == a + 1 ? '' : '\n'}`).join('')}`);
  }

  public static pushEvent(title: string, text: string, priority?: EventPriority, alertType?: EventAlertType) {
    try {
      events.createEvent({ body: { title, text, priority, alertType, host: config.host } });
    } catch (error) {
      Logger.error('Datadog error')
    }
  }

}