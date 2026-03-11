import { getState } from "./_store.js";

export default async (req) => {
  try {
    const state = await getState();
    return Response.json(state); // ✅ modern runtime
  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
};
