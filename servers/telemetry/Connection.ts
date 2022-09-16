import WebSocket from "ws";
import { VERSION, timestamp, FeedMessage, Types, Maybe, sleep } from "./common";
import { ACTIONS } from "./common/feed";
import { State, Update, Node } from "./state";
import { config } from "../../config";

const CONNECTION_TIMEOUT_BASE = (1000 * 5) as Types.Milliseconds; // 5 seconds
const CONNECTION_TIMEOUT_MAX = (1000 * 60 * 5) as Types.Milliseconds; // 5 minutes
const MESSAGE_TIMEOUT = (1000 * 60) as Types.Milliseconds; // 60 seconds

export class Connection {
  public static async create(appState: Readonly<State>): Promise<Connection> {
    return new Connection(await Connection.socket(), appState);
  }

  private static readonly utf8decoder = new TextDecoder("utf-8");
  private static readonly address = Connection.getAddress();

  private static getAddress(): string {
    return config.telemetryUrl;
  }

  private static async socket(): Promise<WebSocket> {
    let socket = await Connection.trySocket();
    let timeout = CONNECTION_TIMEOUT_BASE;

    while (!socket) {
      await sleep(timeout);

      timeout = Math.min(timeout * 2, CONNECTION_TIMEOUT_MAX) as Types.Milliseconds;
      socket = await Connection.trySocket();
    }

    return socket;
  }

  private static async trySocket(): Promise<Maybe<WebSocket>> {
    return new Promise<Maybe<WebSocket>>((resolve, _) => {
      function clean() {
        socket.removeEventListener("open", onSuccess);
        socket.removeEventListener("close", onFailure);
        socket.removeEventListener("error", onFailure);
      }

      function onSuccess() {
        clean();
        resolve(socket);
      }

      function onFailure() {
        clean();
        resolve(null);
      }
      const socket = new WebSocket(Connection.address);

      socket.binaryType = "arraybuffer";
      socket.addEventListener("open", onSuccess);
      socket.addEventListener("error", onFailure);
      socket.addEventListener("close", onFailure);
    });
  }

  // timer which will force a reconnection if no message is seen for a while
  private messageTimeout: Maybe<ResettableTimeout> = null;
  // id sent to the backend used to pair responses
  private pingId = 0;
  // timeout handler for ping messages
  private pingTimeout: NodeJS.Timer;
  // timestamp at which the last ping has been sent
  private pingSent: Maybe<Types.Timestamp> = null;
  // chain label to resubsribe to on reconnect
  private resubscribeTo: Maybe<Types.GenesisHash>;

  private readonly appUpdate: Update = (changes) => {
    // Apply new changes to the state immediately
    Object.assign(this.appState, changes);

    return this.appState;
  };

  constructor(private socket: WebSocket, private readonly appState: Readonly<State>) {
    this.bindSocket();
  }

  public subscribe(chain: Types.GenesisHash) {
    this.socket.send(`subscribe:${chain}`);
  }

  private handleMessages = (messages: FeedMessage.Message[]) => {
    this.messageTimeout?.reset();
    const { nodes } = this.appState;
    const nodesStateRef = nodes.ref;

    for (const message of messages) {
      switch (message.action) {
        case ACTIONS.FeedVersion: {
          if (message.payload !== VERSION) {
            return this.newVersion();
          }

          break;
        }

        case ACTIONS.AddedNode: {
          const [id, nodeDetails, nodeStats, nodeIO, nodeHardware, blockDetails, location, startupTime] = message.payload;
          const node = new Node(true, id, nodeDetails, nodeStats, nodeIO, nodeHardware, blockDetails, location, startupTime);

          nodes.add(node);

          break;
        }

        case ACTIONS.RemovedNode: {
          const id = message.payload;

          nodes.remove(id);

          break;
        }

        case ACTIONS.StaleNode: {
          const id = message.payload;

          nodes.mutAndSort(id, (node) => node.setStale(true));

          break;
        }

        case ACTIONS.LocatedNode: {
          const [id, lat, lon, city] = message.payload;

          nodes.mutAndMaybeSort(id, (node) => node.updateLocation([lat, lon, city]), false);

          break;
        }

        case ACTIONS.ImportedBlock: {
          const [id, blockDetails] = message.payload;

          nodes.mutAndSort(id, (node) => node.updateBlock(blockDetails));

          break;
        }

        case ACTIONS.FinalizedBlock: {
          const [id, height, hash] = message.payload;

          nodes.mutAndMaybeSort(id, (node) => node.updateFinalized(height, hash), true);

          break;
        }

        case ACTIONS.NodeStats: {
          const [id, nodeStats] = message.payload;

          nodes.mutAndMaybeSort(id, (node) => node.updateStats(nodeStats), false);

          break;
        }

        case ACTIONS.SubscribedTo: {
          nodes.clear();

          this.appUpdate({ subscribed: message.payload, nodes });

          break;
        }

        case ACTIONS.UnsubscribedFrom: {
          if (this.appState.subscribed === message.payload) {
            nodes.clear();

            this.appUpdate({ subscribed: null, nodes });
          }

          break;
        }

        case ACTIONS.Pong: {
          this.pong(Number(message.payload));

          break;
        }

        default: {
          break;
        }
      }
    }

    this.appUpdate({ nodes });

    this.autoSubscribe();
  };

  private bindSocket() {
    console.log("Connected");
    // Disconnect if no messages are received in 60s:
    this.messageTimeout = resettableTimeout(this.handleDisconnect, MESSAGE_TIMEOUT);
    // Ping periodically to keep the above happy even if no other data is coming in:
    this.ping();

    if (this.appState) {
      const { nodes } = this.appState;
      nodes.clear();
    }

    if (this.appState.subscribed) {
      this.resubscribeTo = this.appState.subscribed;
      this.appUpdate({ subscribed: null });
    }

    this.socket.addEventListener("message" as any, this.handleFeedData as any);
    this.socket.addEventListener("close", this.handleDisconnect);
    this.socket.addEventListener("error", this.handleDisconnect);
  }

  private ping = () => {
    if (this.pingSent) {
      this.handleDisconnect();
      return;
    }

    this.pingId += 1;
    this.pingSent = timestamp();
    this.socket.send(`ping:${this.pingId}`);
  };

  private pong(id: number) {
    if (!this.pingSent) {
      console.error("Received a pong without sending a ping first");

      this.handleDisconnect();
      return;
    }

    if (id !== this.pingId) {
      console.error("pingId differs");

      this.handleDisconnect();
    }

    const latency = timestamp() - this.pingSent;
    console.log(`Ping latency: ${latency}ms`);

    this.pingSent = null;

    // Schedule a new ping to be sent at least 30s after the last one:
    this.pingTimeout = setTimeout(this.ping, Math.max(0, MESSAGE_TIMEOUT / 2 - latency));
  }

  private newVersion() {
    this.clean();

    // Force reload from the server
    setTimeout(() => window.location.reload(), 3000);
  }

  private clean() {
    clearTimeout(this.pingTimeout);
    this.pingSent = null;
    this.messageTimeout?.cancel();
    this.messageTimeout = null;

    this.socket.removeEventListener("message" as any, this.handleFeedData as any);
    this.socket.removeEventListener("close", this.handleDisconnect);
    this.socket.removeEventListener("error", this.handleDisconnect);
  }

  private handleFeedData = (event: MessageEvent) => {
    let data: FeedMessage.Data;

    if (typeof event.data === "string") {
      data = event.data as any as FeedMessage.Data;
    } else {
      const u8aData = new Uint8Array(event.data);

      // Future-proofing for when we switch to binary feed
      if (u8aData[0] === 0x00) {
        return this.newVersion();
      }

      const str = Connection.utf8decoder.decode(event.data);

      data = str as any as FeedMessage.Data;
    }

    this.handleMessages(FeedMessage.deserialize(data));
  };

  private autoSubscribe() {
    const { subscribed } = this.appState;
    const { resubscribeTo } = this;

    if (subscribed) {
      return;
    }

    if (resubscribeTo) {
      this.subscribe(resubscribeTo);
      return;
    }
  }

  private handleDisconnect = async () => {
    console.warn("Disconnecting; will attempt reconnect");
    this.clean();
    this.socket.close();
    this.socket = await Connection.socket();
    this.bindSocket();
  };
}

/**
 * Fire a function if the timer runs out. You can reset it, or
 * cancel it to prevent the function from being fired.
 *
 * @param onExpired
 * @param timeoutMs
 * @returns
 */
function resettableTimeout(onExpired: () => void, timeoutMs: Types.Milliseconds) {
  let timer = setTimeout(onExpired, timeoutMs);

  return {
    reset() {
      clearTimeout(timer);
      timer = setTimeout(onExpired, timeoutMs);
    },
    cancel() {
      clearTimeout(timer);
    },
  };
}
type ResettableTimeout = ReturnType<typeof resettableTimeout>;
