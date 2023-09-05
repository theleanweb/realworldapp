import { Router, render } from "leanweb-kit/runtime";

const app = new Router();

app.get("/", () => render("home"));

export default app;
