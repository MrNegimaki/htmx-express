function serialize(event) {
    return typeof event === "string" ? event : JSON.stringify(event);
}
export function htmx() {
    return (req, res, next) => {
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
        };
        // --- Vary header for cache correctness ---
        res.vary("HX-Request");
        // --- Response helpers ---
        res.htmx = {
            redirect(url) {
                res.set("HX-Redirect", url);
                res.end();
            },
            location(url) {
                res.set("HX-Location", url);
                res.end();
            },
            refresh() {
                res.set("HX-Refresh", "true");
                res.end();
            },
            trigger(event) {
                res.set("HX-Trigger", serialize(event));
            },
            triggerAfterSwap(event) {
                res.set("HX-Trigger-After-Swap", serialize(event));
            },
            triggerAfterSettle(event) {
                res.set("HX-Trigger-After-Settle", serialize(event));
            },
        };
        // --- Rendering helper ---
        res.renderHtmx = function (options) {
            const template = req.isHtmxRequest ? options.partial : options.page;
            res.render(template, options.locals);
        };
        next();
    };
}
