import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { htmx } from "../src";

function createApp() {
  const app = express();
  app.use(htmx());
  return app;
}

describe("htmx middleware", () => {
  describe("request parsing", () => {
    it("sets isHtmxRequest to false for non-HTMX requests", async () => {
      const app = createApp();
      app.get("/", (req, res) => {
        res.json({ isHtmx: req.isHtmxRequest });
      });

      const res = await request(app).get("/");
      expect(res.body.isHtmx).toBe(false);
    });

    it("sets isHtmxRequest to true when HX-Request header is present", async () => {
      const app = createApp();
      app.get("/", (req, res) => {
        res.json({ isHtmx: req.isHtmxRequest });
      });

      const res = await request(app).get("/").set("HX-Request", "true");
      expect(res.body.isHtmx).toBe(true);
    });

    it("parses all HTMX request headers", async () => {
      const app = createApp();
      app.get("/", (req, res) => {
        res.json({ htmx: req.htmx });
      });

      const res = await request(app)
        .get("/")
        .set("HX-Request", "true")
        .set("HX-Boosted", "true")
        .set("HX-Current-URL", "http://example.com/page")
        .set("HX-Target", "content")
        .set("HX-Trigger", "btn")
        .set("HX-Trigger-Name", "myBtn")
        .set("HX-History-Restore-Request", "true");

      expect(res.body.htmx).toEqual({
        boosted: true,
        currentUrl: "http://example.com/page",
        target: "content",
        trigger: "btn",
        triggerName: "myBtn",
        historyRestoreRequest: true,
      });
    });

    it("sets null for missing optional headers", async () => {
      const app = createApp();
      app.get("/", (req, res) => {
        res.json({ htmx: req.htmx });
      });

      const res = await request(app).get("/");
      expect(res.body.htmx).toEqual({
        boosted: false,
        currentUrl: null,
        target: null,
        trigger: null,
        triggerName: null,
        historyRestoreRequest: false,
      });
    });
  });

  describe("Vary header", () => {
    it("sets Vary: HX-Request on every response", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.send("ok");
      });

      const res = await request(app).get("/");
      expect(res.headers["vary"]).toMatch(/HX-Request/);
    });
  });

  describe("response helpers", () => {
    it("redirect sets HX-Redirect header and ends response", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.redirect("/new-page");
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-redirect"]).toBe("/new-page");
    });

    it("location sets HX-Location header and ends response", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.location("/other");
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-location"]).toBe("/other");
    });

    it("refresh sets HX-Refresh header and ends response", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.refresh();
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-refresh"]).toBe("true");
    });

    it("trigger sets HX-Trigger header with string", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.trigger("myEvent");
        res.send("ok");
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-trigger"]).toBe("myEvent");
    });

    it("trigger sets HX-Trigger header with object (JSON)", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.trigger({ showMessage: "Hello" });
        res.send("ok");
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-trigger"]).toBe('{"showMessage":"Hello"}');
    });

    it("triggerAfterSwap sets HX-Trigger-After-Swap header", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.triggerAfterSwap("swapDone");
        res.send("ok");
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-trigger-after-swap"]).toBe("swapDone");
    });

    it("triggerAfterSettle sets HX-Trigger-After-Settle header", async () => {
      const app = createApp();
      app.get("/", (_req, res) => {
        res.htmx.triggerAfterSettle({ settled: true });
        res.send("ok");
      });

      const res = await request(app).get("/");
      expect(res.headers["hx-trigger-after-settle"]).toBe('{"settled":true}');
    });
  });

  describe("renderHtmx", () => {
    it("renders partial for HTMX requests", async () => {
      const app = createApp();
      app.engine("test", (path, _options, callback) => {
        callback(null, `rendered:${path}`);
      });
      app.set("view engine", "test");

      app.get("/", (_req, res) => {
        res.renderHtmx({
          page: "users/index",
          partial: "users/_list",
          locals: { users: [] },
        });
      });

      const res = await request(app).get("/").set("HX-Request", "true");
      expect(res.text).toContain("users/_list");
    });

    it("renders page for non-HTMX requests", async () => {
      const app = createApp();
      app.engine("test", (path, _options, callback) => {
        callback(null, `rendered:${path}`);
      });
      app.set("view engine", "test");

      app.get("/", (_req, res) => {
        res.renderHtmx({
          page: "users/index",
          partial: "users/_list",
          locals: { users: [] },
        });
      });

      const res = await request(app).get("/");
      expect(res.text).toContain("users/index");
    });
  });
});
