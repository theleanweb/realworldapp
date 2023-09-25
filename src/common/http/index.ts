import { API_URL } from "$env/static/private";

import * as Http from "http-kit";
import * as Fetch from "http-kit/fetch";
import { Builder } from "@http-kit/client";
import { with_token } from "./interceptors/token.js";
import { with_API_URL } from "./interceptors/url.js";

export const HttpClient = new Builder()
  .setBaseUrl(API_URL)
  .setAdapter(Fetch.adapter)
  // .addInterceptor(with_token)
  .build();

export const provideHttp = Http.provide(Fetch.adapter, with_API_URL);

export const provideHttpWithToken = (token: string) =>
  Http.provide(Fetch.adapter, with_API_URL, with_token(token));
