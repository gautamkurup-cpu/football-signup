import { getState } from "./_store.js";

export default async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(await getState())
  };
};
