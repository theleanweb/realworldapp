import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";

import * as Http from "http-kit";

const make = Effect.gen(function* (_) {
  return {
    getPopularTags() {
      return pipe(
        Http.get("/tags"),
        Http.filterStatusOk,
        Http.toJsonT<{ tags: Array<string> }>()
      );
    },
  };
});

export interface Tags extends Effect.Effect.Success<typeof make> {}

export const Tags = Context.Tag<Tags>("@realworldapp/tags");

export const TagsLive = Layer.effect(Tags, make);
