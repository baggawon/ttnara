import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

// AWS SES 클라이언트 초기화
export const sesClient = new SESClient([
  {
    region: process.env.AWS_REGION, // 예: "us-east-1"
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  },
]);

export const sendEmail = async (to: string, subject: string, html: string) => {
  // 이메일 파라미터 설정
  const params = {
    Source: process.env.SES_SENDER_EMAIL, // 발신자 이메일 (SES에서 검증된 이메일이어야 함)
    Destination: {
      ToAddresses: [to], // 수신자 이메일 (배열 또는 단일 문자열)
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        // HTML 본문 (선택사항)
        Html: {
          Data: html,
          Charset: "UTF-8",
        },
      },
    },
  };

  // 이메일 전송 명령 생성
  const command = new SendEmailCommand(params);

  // 이메일 전송 실행
  return await sesClient.send(command);
};
