import AdminPushNotificationForm from "./form";

export default function AdminPushNotification() {
  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">푸시 알림 관리</h1>
      </div>
      <AdminPushNotificationForm />
    </section>
  );
}
