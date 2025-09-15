import { useEffect, useRef } from "react";

import { waitForCondition, withLogging } from "@/helpers/common";
import { v4 as uuidv4 } from "uuid";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";

interface WsParams {
  a?: string;
}

const WS_URL = "wss://ws-api.bithumb.com/websocket/v1  ";

const MAX_RETRY_COUNT = 5;
const MIN_INTERVAL = 1000;
const MAX_JITTER = 200;

const ONERROR_CODE = 4000;

const buildUrl = ({ a }: WsParams) => `${WS_URL}${a ? `/${a}` : ""}`;
const isWebSocketOpen = (wsInstance: WebSocket) =>
  wsInstance && wsInstance.readyState === WebSocket.OPEN;

export const useWebSocket = ({
  a,
  onMessage,
}: WsParams & {
  onMessage: (data: any) => void;
}) => {
  const isMounted = useRef(false);
  const retryCount = useRef(0);
  const ws = useRef<null | WebSocket>(null);
  const id = useRef(uuidv4());

  //초기화
  useEffect(() => {
    retryCount.current = 0;
  }, []);

  useEffectFunctionHook({
    Function: () => {
      if (isMounted.current) return;
      ws.current = new WebSocket(buildUrl({ a }));
      isMounted.current = true;

      const setupWebSocket = (
        wsInstance: WebSocket,
        onMessage: (data: any) => void
      ) => {
        wsInstance.onopen = async () => {
          retryCount.current = 0; // websocket 첫 연결시 setting
          withLogging({
            msg: "WebSocket 연결",
            type: "info",
          });

          await waitForCondition(() => isWebSocketOpen(wsInstance));
          sendServer(
            JSON.stringify([
              { ticket: id.current },
              {
                type: "ticker",
                codes: [
                  "KRW-USDT",
                  "KRW-TRX",
                  "KRW-BTC",
                  "KRW-ETH",
                  "KRW-USDC",
                ],
                is_only_realtime: true,
              },
              { format: "SIMPLE" },
            ])
          );
          // sendServer(Category.Ping, new Uint8Array([]));
        };

        wsInstance.onmessage = async (event) => {
          if (isMounted.current && isWebSocketOpen(wsInstance)) {
            const temp = await (event.data as Blob).arrayBuffer();

            const decoder = new TextDecoder("utf-8");
            const decodedString = decoder.decode(temp);
            onMessage(JSON.parse(decodedString));
            // withLogging({
            //   msg: `accept data, category: ${decodedString}.`,
            //   type: "info",
            // });
          }
        };

        wsInstance.onerror = (event) => {
          if (isMounted.current) {
            withLogging({ msg: `WebSocket Error:${event}`, type: "error" });
            wsInstance.close(ONERROR_CODE); //명시적 close 실행 with custom code
          }
        };

        wsInstance.onclose = (event) => {
          if (isMounted.current) {
            withLogging({
              msg: `WebSocket closed:${(event.code, event.reason)}`,
              type: "info",
            });
            onMessage({
              category: "disconnect",
              datas: [],
            });

            //retry
            // if (event.code !== NORMAL_CODE) {
            //   if (event.code === ONERROR_CODE) {
            // Exponential Backoff
            let interval = MIN_INTERVAL * Math.pow(2, retryCount.current);

            // Adding Jitter(random)
            const jitter =
              Math.floor(Math.random() * (MAX_JITTER * 2 + 1)) - MAX_JITTER;
            interval += jitter;

            if (retryCount.current < MAX_RETRY_COUNT) {
              setTimeout(() => {
                ws.current = new WebSocket(buildUrl({ a }));
                setupWebSocket(ws.current, onMessage);
                retryCount.current++;
              }, interval);
            }
            //   }
            // }
          }
        };
      };

      setupWebSocket(ws.current, onMessage);
    },
    Unmount: () => {
      if (isReadyForSend()) {
        console.info("WebSocket 끊김");
        isMounted.current = false;
        ws.current!.close();
      }
    },
    dependency: [a, onMessage],
  });

  const sendServer = (content: string) => {
    if (isReadyForSend()) {
      ws.current!.send(content);
    }
  };

  const isReadyForSend = () => !!ws.current && isWebSocketOpen(ws.current);

  return { sendServer, isReadyForSend, id: id.current };
};
