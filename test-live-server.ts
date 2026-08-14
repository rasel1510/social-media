async function main() {
  console.log("Sending GET request to local dev server on port 3000...");
  const res = await fetch("http://localhost:3000/api/auth/get-session");
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  console.log("Body:", await res.text());
}

main().catch(console.error);
