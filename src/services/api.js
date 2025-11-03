export async function fetchInventory(host = "", scanPaths = []) {
  // Use proxy by default (empty host means use proxy at /api)
  const useProxy = !host || host.trim() === "";
  const baseUrl = useProxy
    ? "/api/clientlibs-inventory"
    : `${host}/bin/myaemproject/clientlibs-inventory`;

  // Build query params with all scan paths
  const params = new URLSearchParams();
  scanPaths.forEach((path) => {
    if (path && path.trim()) {
      params.append("roots", path.trim());
    }
  });

  const url = params.toString() ? `${baseUrl}?${params}` : baseUrl;

  console.log("🔍 Fetching inventory from paths:", scanPaths);
  console.log("📡 Request URL:", url);
  console.log("🔒 Using proxy:", useProxy);

  // Prepare headers
  const headers = {
    "Content-Type": "application/json",
  };

  // If calling AEM directly (not using proxy), add Basic Auth
  if (!useProxy) {
    const aemUser = "admin"; // You can make this configurable
    const aemPassword = "admin";
    headers["Authorization"] = "Basic " + btoa(`${aemUser}:${aemPassword}`);
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: useProxy ? "include" : "omit",
    headers: headers,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("✅ Received clientlibs count:", data.clientlibs?.length || 0);

  return data;
}
