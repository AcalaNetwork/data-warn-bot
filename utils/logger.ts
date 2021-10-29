import moment from 'moment';
import { v1 } from '@datadog/datadog-api-client';
import { EventPriority } from '@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventPriority';
import { EventAlertType } from '@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/EventAlertType';
import { config } from '../config';

const configuration = v1.createConfiguration();
const events = new v1.EventsApi(configuration);

export const API_ERROR = '[API_ERROR] Apipromise Create Error';
export const KSM_BILL = '[KSM_BILL] Parachain Account Balance Is Wrong With Karura Total Insurance';

export class Logger {
  public static log(...args: any[]) {
    const { stack } = new Error();
    const arr = stack?.split('\n') as string[];
    const path = arr[2].trim();
    const _path = path.split('data-warn-bot');
    const time = moment().format('MM-DD HH:mm:ss');
    console.log(`[ ${time} ] [at ${_path[1]} ] \n${args.map((i, a) => `    ${i}${args.length == a + 1 ? '' : '\n'}`).join('')}`);
  }

  public static pushEvent(title: string, text: string, priority?: EventPriority, alertType?: EventAlertType) {
    events.createEvent({ body: { title, text, priority, alertType, host: config.host } });
  }

}