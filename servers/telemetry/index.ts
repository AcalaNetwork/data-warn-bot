import { Connection } from "./Connection";
import { SortedCollection } from "./common";
import { GenesisHash } from "./common/types";
import { Node } from "./state";
import { watchDogLog } from "../../utils";
import { config } from "../../config";

const acalaState = {
  ACALA: {
    subscribed: "0xfc41b9bd8ef8fe53d58c7ea67c794c7ec9a73daf05e6d54b14ff6342c99ba64c" as GenesisHash,
    nodes: new SortedCollection(Node.compare),
  },
  KARURA: {
    subscribed: "0xbaf5aabe40646d11f0ee8abbdc64f4a4b7674925cba08e4a05ff9ebed6e2126b" as GenesisHash,
    nodes: new SortedCollection(Node.compare),
  },
};
export type AcalaNetwork = keyof typeof acalaState;

export const startTelemetry = (network: AcalaNetwork = "KARURA") => {
  const genesisHash = acalaState[network].subscribed;
  Connection.create(acalaState[network]).then((connection) => {
    connection.subscribe(genesisHash);
  });
};

export const pushTelemetryLog = (network: AcalaNetwork = "KARURA") => {
  const ownNodes = acalaState[network].nodes.list.filter((e) => config.nodeIDs[network].includes(e.networkId as string));

  const heightSorted = ownNodes.sort((a, b) => (a.height > b.height ? -1 : 1));
  const notSyncNodes = heightSorted.filter((e) => e.height + 10 < heightSorted[0].height);

  let logMsg = `${network} nodes check:
- Detected/All nodes: ${ownNodes.length}/${config.nodeIDs[network].length}
- Synced/Unsynced: ${ownNodes.length - notSyncNodes.length}/${notSyncNodes.length}`;
  if (notSyncNodes.length > 0) {
    logMsg += `- Unsynced: [${notSyncNodes.map((e) => e.name).join(",")}]`;
  }
  console.log(logMsg);
  watchDogLog(
    {
      level: "info",
      title: `${network}-node-telemetry`,
      message: logMsg,
      value: notSyncNodes.length,
      timestamp: new Date().toUTCString(),
    },
    `env:${network},env:mainnet`
  );
};