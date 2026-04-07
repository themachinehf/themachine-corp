/**
 * Minimal static file server for themachine-corp
 * Serves static files from the parent directory (repo root)
 * No external dependencies required.
 */

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  let path = url.pathname;

  // Normalize path
  path = path.replace(/^\/+/, ""); // Remove leading slashes

  // If it's a directory (no extension or ends with /), try index.html
  const hasExtension = /\.[^/]+$/.test(path);
  if (!hasExtension) {
    if (!path.endsWith("/")) path += "/";
    path += "index.html";
  }

  // Try to fetch from the static origin using cache
  const staticUrl = `${url.origin}/${path}`;
  const cacheKey = new Request(staticUrl, request);
  const cache = caches.default;

  let response = await cache.match(cacheKey);
  if (!response) {
    response = await fetch(request.url, {
      cf: { cacheEverything: true },
    });
    if (response.status === 200) {
      cache.put(cacheKey, response.clone());
    }
  }

  // If 404, try index.html fallback
  if (response.status === 404) {
    const indexPath = url.pathname.replace(/\/[^/]*$/, "/index.html").replace(/^\/+/, "");
    const indexUrl = `${url.origin}/${indexPath}`;
    const indexReq = new Request(indexUrl, request);
    response = await cache.match(indexReq);
    if (!response) {
      response = await fetch(indexUrl, { cf: { cacheEverything: true } });
      if (response.status === 200) {
        cache.put(indexReq, response.clone());
      }
    }
  }

  // Set content-type based on file extension
  const contentType = getContentType(path);
  if (contentType && response.headers.get("content-type") !== contentType) {
    const headers = new Headers(response.headers);
    headers.set("content-type", contentType);
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  return response;
}

function getContentType(path) {
  const ext = path.split(".").pop().toLowerCase();
  const types = {
    html: "text/html; charset=utf-8",
    htm: "text/html; charset=utf-8",
    js: "application/javascript",
    mjs: "application/javascript",
    css: "text/css",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
   woff: "font/woff",
    woff2: "font/woff2",
  };
  return types[ext] || "application/octet-stream";
}
