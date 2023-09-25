import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";

import * as Http from "http-kit";
import type { Author } from "./author.js";

const make = Effect.gen(function* (_) {
  return {
    getProfile(username: string) {
      return pipe(
        Http.get(`/profiles/${username}`, { cache: "no-store" }),
        Http.filterStatusOk,
        Http.toJsonT<{ profile: Author }>()
      );
    },
  };
});

export interface Profile extends Effect.Effect.Success<typeof make> {}

export const Profile = Context.Tag<Profile>("@realworldapp/profile");

export const ProfileLive = Layer.effect(Profile, make);
