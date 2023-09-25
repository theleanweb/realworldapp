import { createRouter } from "@hattip/router";
import { render } from "leanweb-kit/runtime";

import { cookie } from "@hattip/cookie";
import { session, SimpleCookieStore } from "@hattip/session";

import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as Effect from "@effect/io/Effect";

import { provideHttp, provideHttpWithToken } from "@/common/http/index.js";

import { Tab } from "./types/index.js";

import * as Articles from "@/core/workflows/article.js";
import * as Authentication from "@/core/workflows/authentication.js";
import * as Tags from "@/core/workflows/tag.js";

let empty: Partial<Articles.Article> = {
  body: "",
  title: "",
  tagList: [],
  description: "",
};

const app = createRouter();

// =========== Authentication =============
app.use(cookie());

app.use(
  session({
    store: new SimpleCookieStore(),
    defaultSessionData: { user: null },
  })
);

app.get("/login", () => render("login"));

app.post("/login", (ctx) => {
  const program = Effect.gen(function* (_) {
    const auth = yield* _(Authentication.Authentication);
    const form = yield* _(Effect.tryPromise(() => ctx.request.formData()));
    const data = yield* _(auth.login(Object.fromEntries(form) as any));

    ctx.session.data = data;

    return yield* _(
      Effect.sync(
        () =>
          new Response("", {
            status: 307,
            headers: { Location: "/" },
          })
      )
    );
  });

  return pipe(
    program,
    Effect.catchAll((e) => {
      const err = e as any;

      const errors =
        "errors" in err
          ? err.errors
          : { unknown: ["An unknown error occurred"] };

      return Effect.tryPromise(() => render("login", { errors }));
    }),
    provideHttp,
    Effect.provideLayer(Authentication.AuthenticationLive),
    Effect.runPromise
  );
});

app.get("/register", () => render("register"));

app.post("/register", (ctx) => {
  const program = Effect.gen(function* (_) {
    const auth = yield* _(Authentication.Authentication);
    const form = yield* _(Effect.tryPromise(() => ctx.request.formData()));
    const data = yield* _(auth.register(Object.fromEntries(form) as any));

    ctx.session.data = data;

    return yield* _(
      Effect.sync(
        () =>
          new Response("", {
            status: 307,
            headers: { Location: "/" },
          })
      )
    );
  });

  return pipe(
    program,
    Effect.catchAll((e) => {
      const err = e as any;

      const errors =
        "errors" in err
          ? err.errors
          : { unknown: ["An unknown error occurred"] };

      return Effect.tryPromise(() => render("register", { errors }));
    }),
    provideHttp,
    Effect.provideLayer(Authentication.AuthenticationLive),
    Effect.runPromise
  );
});
// =========== Authentication =============

// =========== Articles =============
app.get("/articles/:slug", async (ctx) => {
  const data = await pipe(
    Effect.flatMap(Articles.Articles, (articles) =>
      articles.getArticle((ctx.params as any).slug)
    ),
    provideHttpWithToken(ctx.session.data.user!.token),
    Effect.provideLayer(Articles.ArticlesLive),
    Effect.runPromise
  );

  return render("article", { ...data, user: ctx.session.data.user });
});
// =========== Articles =============

// ============= Editor =============
app.get("/editor/:slug?", (ctx) => {
  const program = Effect.gen(function* (_) {
    const articles = yield* _(Articles.Articles);

    const article = yield* _(
      Option.fromNullable((ctx.params as any).slug),
      Effect.flatMap((slug) => articles.getArticle(slug)),
      Effect.catchTag("NoSuchElementException", () => Effect.succeed(empty))
    );

    return yield* _(
      Effect.tryPromise(() =>
        render("editor", { article, user: ctx.session.data.user })
      )
    );
  });

  return pipe(
    program,
    provideHttpWithToken(ctx.session.data.user!.token),
    Effect.provideLayer(Articles.ArticlesLive),
    Effect.runPromise
  );
});

app.post("/editor", async (ctx) => {
  const form = await ctx.request.formData();
  return render("editor", { article: empty });
});
// ============= Editor =============

// ============= Settings =============
app.get("/settings", (ctx) =>
  render("settings", { user: ctx.session.data.user })
);

app.post("/settings", (ctx) => {
  const program = Effect.gen(function* (_) {
    const auth = yield* _(Authentication.Authentication);
    const form = yield* _(Effect.tryPromise(() => ctx.request.formData()));
    const data = yield* _(auth.updateUser(Object.fromEntries(form) as any));

    ctx.session.data = data;

    return yield* _(Effect.tryPromise(() => render("register")));
  });

  return pipe(
    program,
    Effect.catchAll(() => {
      return Effect.tryPromise(() => {
        return render("settings", {
          user: ctx.session.data.user,
          errors: null,
        });
      });
    }),
    provideHttpWithToken(ctx.session.data.user!.token),
    Effect.provideLayer(Authentication.AuthenticationLive),
    Effect.runPromise
  );
});
// ============= Settings =============

app.get("/", async (ctx) => {
  const { user } = ctx.session.data;

  if (!user) {
    return new Response("", {
      status: 307,
      headers: { Location: "/login" },
    });
  }

  const search = ctx.url.searchParams;

  const tag = search.get("tag");

  const tab = pipe(
    Option.fromNullable(search.get("tab")),
    Option.getOrElse(() => (user ? Tab.Personal : Tab.Global))
  );

  const page = pipe(
    Option.fromNullable(search.get("page")),
    Option.map(parseFloat),
    Option.getOrElse(() => 1)
  );

  const program = Effect.gen(function* (_) {
    const articles = yield* _(Articles.Articles);
    const tags = yield* _(Tags.Tags);

    const articles_ =
      tab === Tab.Personal
        ? articles.getPersonalFeed({ offset: (page - 1) * 10 })
        : articles.getArticles({
            offset: (page - 1) * 10,
            tag: tab === Tab.Global ? null : tag,
          });

    const tags_ = pipe(
      tags.getPopularTags(),
      Effect.map((_) => _.tags)
    );

    const data = yield* _(Effect.all({ articles: articles_, tags: tags_ }));

    return yield* _(
      Effect.tryPromise(() =>
        render("home/index.html", {
          ...data.articles,
          tab: tag ? "tag" : tab,
          tags: data.tags,
          activeTag: tag,
          user,
        })
      )
    );
  });

  return pipe(
    program,
    Effect.provideSomeLayer(Tags.TagsLive),
    Effect.provideSomeLayer(Articles.ArticlesLive),
    provideHttpWithToken(ctx.session.data.user!.token),
    Effect.runPromise
  );
});

export default app;
