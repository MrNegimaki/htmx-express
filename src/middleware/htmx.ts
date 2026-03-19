import type { Request, Response, NextFunction, RequestHandler } from "express";
import type {
  HtmxRequestMeta,
  HtmxResponseHelpers,
  RenderHtmxOptions,
} from "../types/express";

function serialize(event: string | object): string {
  return typeof event === "string" ? event : JSON.stringify(event);
}

export function htmx(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    // --- Request parsing ---
    const hxRequest = req.get("HX-Request");
    req.isHtmxRequest = hxRequest === "true";

    req.htmx = {
      boosted: req.get("HX-Boosted") === "true",
      currentUrl: req.get("HX-Current-URL") ?? null,
      target: req.get("HX-Target") ?? null,
      trigger: req.get("HX-Trigger") ?? null,
      triggerName: req.get("HX-Trigger-Name") ?? null,
      historyRestoreRequest: req.get("HX-History-Restore-Request") === "true",
    } satisfies HtmxRequestMeta;

    // --- Vary header for cache correctness ---
    res.vary("HX-Request");

    // --- Response helpers ---
    res.htmx = {
      redirect(url: string): void {
        res.set("HX-Redirect", url);
        res.end();
      },
      location(url: string): void {
        res.set("HX-Location", url);
        res.end();
      },
      refresh(): void {
        res.set("HX-Refresh", "true");
        res.end();
      },
      trigger(event: string | object): void {
        res.set("HX-Trigger", serialize(event));
      },
      triggerAfterSwap(event: string | object): void {
        res.set("HX-Trigger-After-Swap", serialize(event));
      },
      triggerAfterSettle(event: string | object): void {
        res.set("HX-Trigger-After-Settle", serialize(event));
      },
    } satisfies HtmxResponseHelpers;

    // --- Rendering helper ---
    res.renderHtmx = function (options: RenderHtmxOptions): void {
      const template = req.isHtmxRequest ? options.partial : options.page;
      res.render(template, options.locals);
    };

    next();
  };
}
