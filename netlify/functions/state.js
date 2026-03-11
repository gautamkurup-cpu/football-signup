import { getState } from "./_store.js";

export default async () => {
  try {
    const state = await getState();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(state)
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Function crashed",
        message: err.message || String(err)
      })
    };
  }
};
