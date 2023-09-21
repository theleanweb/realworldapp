import { createRouter, render } from "leanweb-kit/runtime";

const app = createRouter();

app.get("/", () => render("home"));

export default app;
