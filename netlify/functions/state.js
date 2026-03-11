import { getState } from "./_store.js";

export default async () => {
  try {
    const state = await getState();
    return Response.json(state);
  } catch (err) {
    return Response.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
};
