import { saveState } from "./_store.js";

export default async (req) => {
  const body = await req.json().catch(() => ({}));
  const secret = body.secret;

  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const state = { players: [] };
  await saveState(state);

  return Response.json(state);
};
