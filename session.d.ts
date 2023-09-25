import { User } from "./src/core/workflows/authentication.js";

declare module "@hattip/session" {
  interface SessionData {
    user: User | null;
  }
}

export {};
