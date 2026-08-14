import { auth } from "./lib/auth";

async function main() {
  const req = new Request("http://localhost:3000/api/auth/get-session", {
    method: "GET",
  });
  console.log("Calling auth.handler...");
  const res = await auth.handler(req);
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  console.log("Body:", await res.text());
}

main().catch(console.error);
