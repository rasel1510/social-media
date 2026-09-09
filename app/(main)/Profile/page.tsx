import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?callbackURL=/Profile");
  }

  const username = (session.user as any)?.username || session.user.id;
  redirect(`/Profile/${username}`);
}
