(function () {
  const KEY = "workflow.xUserId";

  function ensureUserId() {
    let v = window.localStorage.getItem(KEY);

    // If missing or invalid GUID, prompt
    const guidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

    if (!v || !guidRegex.test(v)) {
      v = window.prompt("Enter X-User-Id (GUID) for Swagger requests:", v || "");
      if (v && guidRegex.test(v)) {
        window.localStorage.setItem(KEY, v);
      } else {
        // If user cancels or enters invalid value, remove it
        window.localStorage.removeItem(KEY);
      }
    }

    return window.localStorage.getItem(KEY);
  }

  // Swagger-UI calls this interceptor for every request
  window.swaggerRequestInterceptor = function (req) {
    const userId = ensureUserId();
    if (userId) {
      req.headers["X-User-Id"] = userId;
    }
    return req;
  };
})();
