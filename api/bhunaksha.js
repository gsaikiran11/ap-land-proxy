
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "GET requests only.",
    });
  }

  const { village, plot, test } = req.query;

  // Test whether Vercel can reach the BhuNaksha host.
  if (test === "connectivity") {
    const started = Date.now();

    try {
      const response = await fetch("https://bhunaksha.ap.gov.in/", {
        signal: AbortSignal.timeout(20000),
        headers: { Accept: "text/html,*/*" },
      });

      await response.body?.cancel();

      return res.status(200).json({
        test: "BhuNaksha connectivity from Vercel",
        status: response.status,
        ok: response.ok,
        elapsedMs: Date.now() - started,
      });
    } catch (error) {
      return res.status(502).json({
        test: "BhuNaksha connectivity from Vercel",
        error: error.message,
        elapsedMs: Date.now() - started,
      });
    }
  }

  if (!village || !plot) {
    return res.status(400).json({
      success: false,
      error: "Provide village and plot numbers.",
      usage: "/api/bhunaksha?village=1319010&plot=1",
    });
  }

  if (!/^\d+$/.test(String(village)) ||
      !/^\d+$/.test(String(plot))) {
    return res.status(400).json({
      success: false,
      error: "Village and plot must contain digits only.",
    });
  }

  const apiUrl = new URL(
    "https://bhunaksha.ap.gov.in/bhunakshalpm/rest/ManagementService/getweblanddata"
  );

  apiUrl.searchParams.set("vsrno", String(village));
  apiUrl.searchParams.set("gisCode", "B" + village + "_");
  apiUrl.searchParams.set("plotNo", String(plot));
  apiUrl.searchParams.set("state", "28");

  try {
    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(25000),
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    const body = await response.text();

    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") ||
        "text/plain; charset=utf-8"
    );

    return res.status(response.status).send(body);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: "Vercel could not retrieve data from BhuNaksha AP.",
      details: error.message,
    });
  }
}
