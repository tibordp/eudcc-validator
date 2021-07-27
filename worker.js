addEventListener("fetch", (event) => {
  event.respondWith(
    handleRequest(event).catch(
      (err) => new Response(err.stack, { status: 500 })
    )
  );
});

const PROD_ENDPOINT = "https://dgcg.covidbevis.se/tp/trust-list";
const TEST_ENDPOINT = "https://dgcg-qa.covidbevis.se/tp/trust-list";

async function handleRequest(event) {
  const { request } = event;
  const url = new URL(request.url);
  const cacheKey = url.toString();
  const cache = caches.default;

  let response = await cache.match(cacheKey);

  if (!response) {
    if (request.method === "OPTIONS") {
      response = handleOptions(request);
    } else if (request.method === "GET") {
      if (url.pathname.startsWith("/trust-list")) {
        let endpoint;
        if (url.pathname === "/trust-list/prod") {
          endpoint = PROD_ENDPOINT;
        } else if (url.pathname === "/trust-list/test") {
          endpoint = TEST_ENDPOINT;
        } else {
          response = new Response(null, {
            status: 404,
            statusText: "Not Found",
          });
        }

        const trustList = await getTrustList(endpoint);
        response = new Response(JSON.stringify(trustList), {
          headers: {
            "Content-Type": "application/json",
          },
        });
        response.headers.append("Cache-Control", "s-maxage=3600");
        response.headers.append("Access-Control-Allow-Origin", "*");
      } else {
        response = new Response(null, {
          status: 404,
          statusText: "Not Found",
        });
      }
    } else {
      response = new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
    }
  }
  event.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

async function getTrustList(endpoint) {
  const response = await fetch(endpoint);
  const token = await response.text();

  const payload = JSON.parse(atob(token.split(".")[1]));

  return Object.fromEntries(
    Object.entries(payload.dsc_trust_list)
      .flatMap(([_, value]) => value.keys)
      .map(({ kid, x, y, x5c }) => [kid, { kid, x, y, x5c }])
  );
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function handleOptions(request) {
  if (
    request.headers.get("Origin") !== null &&
    request.headers.get("Access-Control-Request-Method") !== null &&
    request.headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: corsHeaders,
    });
  } else {
    return new Response(null, {
      headers: {
        Allow: "GET, OPTIONS",
      },
    });
  }
}
