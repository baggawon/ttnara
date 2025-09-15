import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export function formatPhoneNumber(phone: string): string {
  // 전화번호에서 모든 공백과 특수문자 제거
  let cleaned = phone.replace(/\D/g, "");

  // 010, 011 등으로 시작하는 번호를 +82 형식으로 변환
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1); // 맨 앞의 0 제거
    return `+82${cleaned}`;
  }

  return `+82${cleaned}`;
}

export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    const params = {
      Message: message,
      PhoneNumber: formatPhoneNumber(phoneNumber),
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error) {
    console.error("SMS 발송 실패:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
