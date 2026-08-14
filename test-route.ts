import { POST } from "./app/api/auth/[...better-auth]/route";

async function testPostUrl(urlStr: string) {
  const req = new Request(urlStr, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: "test@example.com", password: "password" }),
  });
  console.log(`Calling route.POST with URL ${urlStr}...`);
  const res = await POST(req);
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
}

async function main() {
  await testPostUrl("http://localhost:3000/api/auth/sign-in/email");
}

main().catch(console.error);
