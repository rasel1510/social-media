import { MainLayout } from "@/components/main-layout";
import { getNotifications } from "@/app/actions";
import { NotificationList } from "@/components/notification-list";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login?callbackURL=/notifications");
  }

  const notifications = await getNotifications();

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen border-r border-zinc-800">
        <NotificationList initialNotifications={notifications} />
      </div>
    </MainLayout>
  );
}
