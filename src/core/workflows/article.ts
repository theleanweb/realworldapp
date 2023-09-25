import * as S from "@effect/schema/Schema";
import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";

import * as Http from "http-kit";
import { searchParams } from "http-kit";
import { Author } from "./author.js";

export const Article = S.struct({
  slug: S.string,
  body: S.string,
  author: Author,
  title: S.string,
  createdAt: S.string,
  updatedAt: S.string,
  favorited: S.boolean,
  description: S.string,
  favoritesCount: S.number,
  tagList: S.array(S.string),
});

export type Article = S.Schema.To<typeof Article>;

interface SearchParams {
  limit?: number;
  offset?: number;
  author?: string;
  favorited?: string;
  tag?: string | null;
}

const make = Effect.gen(function* (_) {
  return {
    getArticles({
      tag,
      author,
      favorited,
      offset = 0,
      limit = 10,
    }: SearchParams) {
      return pipe(
        Http.get("/articles", {
          search: searchParams({
            limit,
            offset,
            ...(tag ? { tag } : {}),
            ...(author ? { author } : {}),
            ...(favorited ? { favorited } : {}),
          }),
        }),
        Http.filterStatusOk,
        Http.toJsonT<{ articles: Array<Article>; articlesCount: number }>()
      );
    },
    getArticle(slug: string) {
      return pipe(
        Http.get(`/articles/${slug}`),
        Http.filterStatusOk,
        Http.toJsonT<{ article: Article }>()
      );
    },
    getPersonalFeed({ offset = 0, limit = 10 }: SearchParams) {
      return pipe(
        Http.get("/articles/feed", { search: searchParams({ limit, offset }) }),
        Http.filterStatusOk,
        Http.toJsonT<{ articles: Array<Article>; articlesCount: number }>()
      );
    },
  };
});

export interface Articles extends Effect.Effect.Success<typeof make> {}

export const Articles = Context.Tag<Articles>("@realworldapp/articles");

export const ArticlesLive = Layer.effect(Articles, make);
