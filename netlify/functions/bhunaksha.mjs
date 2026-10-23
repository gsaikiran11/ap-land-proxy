export default async (request) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json; charset=utf-8"
      }
    });

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "GET") {
    return json({ success: false, error: "GET requests only." }, 405);
  }

  const incoming = new URL(request.url);
  const village = incoming.searchParams.get("village");
  const plot = incoming.searchParams.get("plot");

  if (!village || !plot ||
      !/^\d+$/.test(village) ||
      !/^\d+$/.test(plot)) {
    return json({
      success: false,
      error: "Valid numeric village and plot values are required."
    }, 400);
  }

  const api = new URL(
    "https://bhunaksha.ap.gov.in/bhunakshalpm/rest/ManagementService/getweblanddata"
  );

  api.searchParams.set("vsrno", village);
  api.searchParams.set("gisCode", `B${village}_`);
  api.searchParams.set("plotNo", plot);
  api.searchParams.set("state", "28");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const started = Date.now();

  try {
    const upstream = await fetch(api.toString(), {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://bhunaksha.ap.gov.in/"
      },
      signal: controller.signal
    });

    const body = await upstream.text();

    console.log("BhuNaksha response", {
      status: upstream.status,
      elapsedMs: Date.now() - started,
      bodyLength: body.length
    });

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...cors,
        "Content-Type":
          upstream.headers.get("Content-Type") ||
          "application/json; charset=utf-8"
      }
    });
  } catch (error) {
    console.error("BhuNaksha upstream failure", {
      elapsedMs: Date.now() - started,
      timedOut: controller.signal.aborted,
      message: error?.message
    });

    return json({
      success: false,
      error: controller.signal.aborted
        ? "Official BhuNaksha API timed out."
        : "Unable to contact the official BhuNaksha API.",
      elapsedMs: Date.now() - started
    }, 502);
  } finally {
    clearTimeout(timer);
  }
};
