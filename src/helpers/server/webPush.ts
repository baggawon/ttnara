import webpush from "web-push";

// VAPID 세부 정보 설정
const vapidDetails = {
  publicKey: process.env.CLIENT_VAPID_PUBLIC_KEY ?? "",
  privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  subject: process.env.VAPID_SUBJECT ?? "",
};

webpush.setVapidDetails(
  vapidDetails.subject,
  vapidDetails.publicKey,
  vapidDetails.privateKey
);

export default webpush;
