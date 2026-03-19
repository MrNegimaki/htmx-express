export interface HtmxRequestMeta {
  boosted: boolean;
  currentUrl: string | null;
  target: string | null;
  trigger: string | null;
  triggerName: string | null;
  historyRestoreRequest: boolean;
}

export interface HtmxResponseHelpers {
  redirect(url: string): void;
  location(url: string): void;
  refresh(): void;
  trigger(event: string | object): void;
  triggerAfterSwap(event: string | object): void;
  triggerAfterSettle(event: string | object): void;
}

export interface RenderHtmxOptions {
  page: string;
  partial: string;
  locals?: Record<string, unknown>;
}

declare module "express-serve-static-core" {
  interface Request {
    isHtmxRequest: boolean;
    htmx: HtmxRequestMeta;
  }

  interface Response {
    htmx: HtmxResponseHelpers;
    renderHtmx(options: RenderHtmxOptions): void;
  }
}
