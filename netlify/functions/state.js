import { getState } from "./_store.js";

export default async () => {
  try {
    const state = await getState();

    // Return a Response (modern Netlify Functions runtime)
    // AND explicitly disable caching so state updates show immediately
    return new Response(JSON.stringify(state), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Pragma": "no-cache"
      }
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || String(err) }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          "Pragma": "no-cache"
        }
      }
    );
  }
};
