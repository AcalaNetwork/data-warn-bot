import axios from "axios";
import { config } from "../config";

export interface AlertData {
  name: string;
  message: string;
  value: string;
  network: "acala" | "karura";
  type: "chain" | "service";
  level: "MAX" | "MID" | "MIN";
}

export const sendAlert = (data: AlertData) => {
  axios.post(config.aliAlertUrl, {
    alertname: data.name,
    severity: data.level,
    message: data.message,
    value: data.value,
    network: data.network,
    class: data.type,
    service: "data-warn-bot",
  });
};
