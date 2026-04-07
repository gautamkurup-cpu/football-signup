import { getStoreDiagnostics } from "./_store.js";

export default async () => {
  const diagnostics = getStoreDiagnostics();

  return new Response(JSON.stringify(diagnostics), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Pragma": "no-cache"
    }
  });
};
