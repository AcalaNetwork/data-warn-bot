import axios from "axios";
import { Logger, PRICE_SERVER } from "../utils";
import { sendAlert } from "../utils";

export const priceServer = async () => {
  const data = await axios.get("https://api.polkawallet.io/price-server/?token=KSM&from=market");

  if (data.status === 200) {
    Logger.pushEvent(PRICE_SERVER, "", "normal", "info");
  }

  // console.log("send alert 1");
  // sendAlert({
  //   name: "alert_1",
  //   message: "SMS alert test test test",
  //   value: "test value 89456 DOT",
  //   level: "MID",
  //   network: "karura",
  //   type: "service",
  // });
};
