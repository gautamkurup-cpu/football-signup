import { getState } from "./_store.js";

export default async (event) => {
  try {
    const state = await getState(event);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "state function crashed",
        message: err?.message || String(err)
      })
    };
  }
};
