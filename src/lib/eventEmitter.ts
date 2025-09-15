import { EventEmitter } from "events";
import type { QueryKey } from "@/helpers/types";

export interface UserUpdateEvent {
  userId: string;
  data: {
    queryKey: QueryKey;
  };
}

declare global {
  // eslint-disable-next-line no-var
  var userUpdateEmitter: EventEmitter;
}

if (!global.userUpdateEmitter) {
  global.userUpdateEmitter = new EventEmitter();
  // Increase max listeners to prevent memory leak warnings
  global.userUpdateEmitter.setMaxListeners(1000);
}

export const userUpdateEmitter = global.userUpdateEmitter;
