import axios from "axios";
import { Logger, PRICE_SERVER, watchDogLog } from "../utils";

export const priceServer = async () => {
  // const data = await axios.get("https://api.polkawallet.io/price-server/?token=KSM&from=market");

  // if (data.status === 200) {
  //   Logger.pushEvent(PRICE_SERVER, "", "normal", "info");
  // }

  // console.log("send alert 1");
  // sendAlert({
  //   name: "alert_1",
  //   message: "SMS alert test test test",
  //   value: "test value 89456 DOT",
  //   level: "MID",
  //   network: "karura",
  //   type: "service",
  // });
  watchDogLog(
    {
      level: "info",
      title: "new-log-test",
      message: "karura loan info",
      value: 35.45,
      timestamp: new Date().toUTCString(),
    },
    "env:karura,env:mainnet"
  );
};
