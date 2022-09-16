import { Connection } from "./Connection";
import { SortedCollection } from "./common";
import { GenesisHash } from "./common/types";
import { Node } from "./state";

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
  const nodesHeight = acalaState[network].nodes.list.map((e) => e.height);
  // const nodesFinalized = acalaState[network].nodes.list.map((e) => e.finalized);
  const heightSorted = nodesHeight.sort((a, b) => (a > b ? -1 : 1));
  console.log(nodesHeight.length);
  console.log(heightSorted);
  const notSyncNodes = heightSorted.filter((e) => e + 10 < heightSorted[0]);
  console.log(notSyncNodes);
};
