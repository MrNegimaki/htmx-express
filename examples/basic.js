const express = require("express");
const { htmx } = require("../dist/cjs/index");

const app = express();
app.use(htmx());

app.get("/", (req, res) => {
  if (req.isHtmxRequest) {
    res.send("<p>This is a partial HTMX response</p>");
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>htmx-express example</title>
          <script src="https://unpkg.com/htmx.org@1.9.12"></script>
        </head>
        <body>
          <h1>htmx-express demo</h1>
          <button hx-get="/greet" hx-target="#result">Say Hello</button>
          <div id="result"></div>
        </body>
      </html>
    `);
  }
});

app.get("/greet", (req, res) => {
  res.htmx.trigger("greeted");
  res.send("<p>Hello from HTMX!</p>");
});

app.get("/redirect-example", (_req, res) => {
  res.htmx.redirect("/");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Example app listening on http://localhost:${PORT}`);
});
