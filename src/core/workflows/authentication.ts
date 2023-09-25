import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as S from "@effect/schema/Schema";

import * as Http from "http-kit";
import { json } from "http-kit/body";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
}

interface ErrorResponse {
  errors: { [K: string]: string[] };
}

export const User = S.struct({
  email: S.string,
  image: S.string,
  token: S.string,
  username: S.string,
  bio: pipe(S.string, S.nullable),
});

export type User = S.Schema.To<typeof User>;

const make = Effect.gen(function* (_) {
  return {
    login(credentials: LoginCredentials) {
      return pipe(
        Http.post("/users/login", json({ user: credentials })),
        Http.filterStatusOk,
        Http.toJsonT<{ user: User }>()
      );
    },
    register(credentials: RegisterCredentials) {
      return pipe(
        Http.post("/users", json({ user: credentials })),
        Http.filterStatusOk,
        Http.toJsonT<{ user: User }>()
      );
    },
    getCurrentUser() {
      return pipe(Http.get("/user"), Http.filterStatusOk, Http.toJson);
    },
    updateUser(user: unknown) {
      return pipe(
        Http.put("/user", json({ user })),
        Http.filterStatusOk,
        Http.toJsonT<{ user: User }>()
      );
    },
  };
});

export interface Authentication extends Effect.Effect.Success<typeof make> {}

export const Authentication = Context.Tag<Authentication>(
  "@realworldapp/authentication"
);

export const AuthenticationLive = Layer.effect(Authentication, make);
