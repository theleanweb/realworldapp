type User = any;

declare module "@hattip/session" {
  interface SessionData {
    user: User | null;
  }
}

export {};
