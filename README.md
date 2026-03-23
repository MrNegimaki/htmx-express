# htmx-express

Lightweight, zero-dependency Express.js middleware for HTMX request/response handling.

Inspired by [htmx-spring-boot](https://github.com/wimdeblauwe/htmx-spring-boot) — bringing the same ergonomic HTMX integration to the Express ecosystem.

## What it does

`htmx-express` gives you a single middleware that handles everything you need to work with [HTMX](https://htmx.org) on the server side:

- **Detects HTMX requests** via `req.isHtmxRequest`
- **Parses HTMX headers** into a structured `req.htmx` object (target, trigger, boosted, etc.)
- **Provides response helpers** for setting HTMX response headers (`res.htmx.redirect()`, `.trigger()`, `.refresh()`, etc.)
- **Includes a rendering helper** (`res.renderHtmx()`) that automatically picks between a full page and a partial based on request type
- **Sets `Vary: HX-Request`** automatically for correct caching behavior

```js
const express = require("express");
const { htmx } = require("htmx-express");

const app = express();
app.use(htmx());

app.get("/users", (req, res) => {
  const users = getUsers();

  // Renders partial for HTMX requests, full page otherwise
  res.renderHtmx({
    page: "users/index",
    partial: "users/_list",
    locals: { users },
  });
});

app.post("/users", (req, res) => {
  createUser(req.body);
  res.htmx.trigger("userCreated");
  res.send("<tr>...</tr>");
});
```

## Installation

```bash
npm install htmx-express
```

Requires **Node >= 18** and **Express >= 4** (peer dependency).

## API

### Request

| Property | Type | Description |
|---|---|---|
| `req.isHtmxRequest` | `boolean` | `true` when `HX-Request` header is present |
| `req.htmx.boosted` | `boolean` | Whether the request is via `hx-boost` |
| `req.htmx.currentUrl` | `string \| null` | The current URL of the browser |
| `req.htmx.target` | `string \| null` | The `id` of the target element |
| `req.htmx.trigger` | `string \| null` | The `id` of the triggered element |
| `req.htmx.triggerName` | `string \| null` | The `name` of the triggered element |
| `req.htmx.historyRestoreRequest` | `boolean` | Whether this is a history restoration request |

### Response helpers

| Method | Header set | Ends response? | Description |
|---|---|---|---|
| `res.htmx.redirect(url)` | `HX-Redirect` | Yes | Client-side redirect |
| `res.htmx.location(url)` | `HX-Location` | Yes | Navigate without full page reload |
| `res.htmx.refresh()` | `HX-Refresh: true` | Yes | Full page refresh |
| `res.htmx.trigger(event)` | `HX-Trigger` | No | Trigger a client-side event |
| `res.htmx.triggerAfterSwap(event)` | `HX-Trigger-After-Swap` | No | Trigger event after swap |
| `res.htmx.triggerAfterSettle(event)` | `HX-Trigger-After-Settle` | No | Trigger event after settle |

The `trigger` methods accept a string (event name) or an object (serialized as JSON for passing data with events).

### Rendering helper

```js
res.renderHtmx({
  page: "users/index",       // Full page template (non-HTMX requests)
  partial: "users/_list",    // Partial template (HTMX requests)
  locals: { users },         // Template data
});
```

Works with any Express-compatible view engine (EJS, Pug, Handlebars, etc.).

## Design Principles

- **Minimal** — one middleware, one function call, nothing to configure
- **Zero dependencies** — only Express as a peer dependency
- **Express-native** — augments `req` and `res` the way Express middleware should; plays nicely with the existing middleware stack
- **View-engine agnostic** — uses Express's built-in `res.render()`, so it works with whatever templating engine you already use
- **Easy to adopt** — add `app.use(htmx())` and start using the helpers; no boilerplate, no setup

## TypeScript

Full TypeScript support with type augmentations for Express's `Request` and `Response` interfaces. Types are included in the package — no separate `@types` install needed.

## Potential Future Features

The following features are not yet implemented but could be valuable additions:

- **Middleware options** — configuration object for `htmx()` to customize behavior (e.g., disable automatic `Vary` header, configure which headers to parse)
- **`HX-Push-Url` / `HX-Replace-Url` helpers** — response helpers for controlling browser URL bar updates
- **`HX-Reswap` / `HX-Retarget` helpers** — override the swap method or target element from the server
- **Out-of-band swap support** — helper for constructing `hx-swap-oob` responses that update multiple page regions
- **Request guard middleware** — a convenience middleware (e.g., `htmxOnly()`) that returns 400/403 for non-HTMX requests on routes that should only serve partials
- **Event accumulation** — allow multiple `trigger()` calls per response, merging them into a single header value
- **Express 5 compatibility** — verify and test against Express 5 once it stabilizes

## Contributing

Contributions are welcome! Here's how to get started:

### Setup

```bash
git clone <repo-url>
cd htmx-express
npm install
```

### Development workflow

```bash
npm run build      # Compile TypeScript (dual CJS + ESM output)
npm test           # Run tests with vitest
```

All source code lives in `src/`. The build produces `dist/` with separate CJS, ESM, and type declaration outputs.

### Guidelines

- **Keep it minimal** — this library's value is in its simplicity. Think twice before adding a dependency or a configuration option.
- **Write tests** — all new features and bug fixes should include tests. The test suite uses [vitest](https://vitest.dev/) and [supertest](https://github.com/ladakh/supertest) for HTTP assertions.
- **Maintain TypeScript types** — if you add or change API surface, update the type augmentations in `src/types/express.d.ts`.
- **Dual module support** — ensure changes work in both CJS (`require`) and ESM (`import`) contexts.
- **Follow existing patterns** — look at how existing response helpers are implemented before adding new ones.

### Submitting changes

1. Fork the repository
2. Create a feature branch (`git checkout -b my-feature`)
3. Make your changes with tests
4. Ensure `npm test` and `npm run build` pass
5. Open a pull request with a clear description of what and why

## License

MIT