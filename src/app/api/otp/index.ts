import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { ApiOtpType, ValidateStatus } from "@/helpers/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

import { now } from "@/helpers/basic";
import { makeRandomText } from "@/helpers/common";
import { sendEmail } from "@/helpers/server/ses";
import { emailAuth } from "@/helpers/emailFormat";

export interface OtpProps {
  email?: string;
  phone_number?: string;
  otp?: string;
  validate_type: ApiOtpType;
  request_id?: string;
}

export const POST = async (json: OtpProps) => {
  try {
    const { otp, request_id, validate_type, phone_number, email }: OtpProps =
      json;
    const isAblePropsToSignup =
      typeof email === "string" && typeof validate_type !== undefined;

    if (isAblePropsToSignup) {
      if (validate_type === ApiOtpType.EmailSignup) {
        const profile = await handleConnect((prisma) =>
          prisma.profile.findFirst({
            where: {
              email,
            },
          })
        );

        if (profile) {
          throw ToastData.alreadyExistId;
        }

        const validateData = await handleConnect((prisma) =>
          prisma.validate.findMany({
            where: {
              email,
              type: "email",
              status: ValidateStatus.progress,
            },
          })
        );
        const existSend = validateData && validateData?.length > 0;

        if (existSend) {
          console.info(`already send user: ${email}, ${validate_type}`);
          const diffMinutes = now().diff(
            dayjs(validateData[0].updated_at).tz("Asia/Seoul"),
            "minute"
          );
          if (diffMinutes < 2) {
            throw ToastData.alreadySend;
          }
        }
        const validate_data = makeRandomText({ length: 6 });

        const result = await sendEmail(
          email,
          `[테더나라] 인증메일입니다.`,
          emailAuth({
            title: "[테더나라] 인증메일입니다.",
            time: "30",
            authCode: validate_data,
            date: now().format("YYYY-MM-DD HH:mm:ss"),
          })
        );

        if (!result.MessageId) throw ToastData.unknown;

        const validateInsert = await handleConnect((prisma) =>
          prisma.validate.create({
            data: {
              email,
              validate_data,
              type: "email",
              request_id: result.MessageId,
            },
          })
        );
        if (!validateInsert) throw ToastData.unknown;

        return {
          result: true,
          message: ToastData.sendOtp,
          data: result.MessageId,
        };
      }
    }
    if (validate_type === ApiOtpType.EmailValid) {
      if (
        !(
          json &&
          email &&
          request_id &&
          otp &&
          email !== "" &&
          request_id !== "" &&
          otp !== ""
        )
      )
        throw ToastData.unknown;

      const validateFirstData = await handleConnect((prisma) =>
        prisma.validate.findFirst({
          where: {
            email,
            request_id,
            type: "email",
          },
        })
      );

      if (
        validateFirstData?.blocked_until &&
        dayjs(validateFirstData.blocked_until).tz("Asia/Seoul").isAfter(now())
      ) {
        throw ToastData.tooManyAttempts;
      }

      const validateData = await handleConnect((prisma) =>
        prisma.validate.findMany({
          where: {
            email,
            type: "email",
            status: ValidateStatus.progress,
            request_id,
          },
        })
      );
      const existSmsRequest = validateData && validateData.length > 0,
        isSmsEqual = otp === validateData?.[0].validate_data;
      let isValid = false,
        smsUpdateComplete = false;
      if (!(existSmsRequest && validateData)) throw ToastData.unknown;

      const diffMinutes = now().diff(
        dayjs(validateData[0].updated_at).tz("Asia/Seoul"),
        "minute"
      );
      const limitTime = 30;
      isValid =
        diffMinutes < limitTime && validateData[0].validate_data === otp;
      if (isValid) {
        const validateUpdate = await handleConnect((prisma) =>
          prisma.validate.updateMany({
            data: {
              status: ValidateStatus.valid,
            },
            where: {
              email,
              type: "email",
              validate_data: otp,
              status: ValidateStatus.progress,
              request_id,
            },
          })
        );
        smsUpdateComplete = !!validateUpdate;

        if (!smsUpdateComplete)
          return { result: false, message: ToastData.otpError };

        return { result: true };
      }
      if (!isValid) {
        const newAttemptCount = (validateData?.[0]?.attempt_count || 0) + 1;
        const shouldBlock = newAttemptCount >= 5;

        await handleConnect((prisma) =>
          prisma.validate.updateMany({
            where: {
              email,
              type: "email",
              request_id,
            },
            data: {
              attempt_count: newAttemptCount,
              blocked_until: shouldBlock
                ? now().add(5, "minutes").toDate()
                : null,
              status: ValidateStatus.fail,
            },
          })
        );

        if (shouldBlock) {
          throw ToastData.tooManyAttempts;
        }
      }

      return {
        result: false,
        message: isSmsEqual ? ToastData.timeOut : ToastData.otpError,
      };
    }

    if (validate_type === ApiOtpType.EmailForgotPassword) {
      if (!(json && email && email !== "")) throw ToastData.unknown;

      const matchColumn = { email };
      const userData = await handleConnect((prisma) =>
        prisma.profile.findMany({
          where: matchColumn,
        })
      );
      const noUser = userData && userData.length === 0,
        isUser = userData && userData.length > 0;
      let existSend = false,
        validateInsertComplete = false;
      if (noUser) {
        console.info(`no user: ${email}, ${validate_type}`);
        return { result: false, error: "no_user" };
      } else if (isUser && userData?.[0]) {
        const searchedEmail = userData[0].email;
        console.info(`is_user: ${searchedEmail}, ${validate_type}`);

        const validateData = await handleConnect((prisma) =>
          prisma.validate.findMany({
            where: {
              email: searchedEmail,
              type: "email",
              status: ValidateStatus.progress,
            },
          })
        );
        existSend = !!validateData && validateData.length > 0;

        if (existSend) {
          console.info(`already send user: ${searchedEmail}, ${validate_type}`);
          const diffMinutes = now().diff(
            dayjs(validateData![0].updated_at).tz("Asia/Seoul"),
            "minute"
          );
          if (diffMinutes < 2) {
            return { result: false, error: ToastData.waitSend };
          }
        }
        const validate_data = makeRandomText({ length: 6 });

        const result = await sendEmail(
          email,
          `[테더나라] 인증메일입니다.`,
          emailAuth({
            title: "[테더나라] 인증메일입니다.",
            time: "30",
            authCode: validate_data,
            date: now().format("YYYY-MM-DD HH:mm:ss"),
          })
        );
        if (!result.MessageId) throw ToastData.unknown;
        console.info(
          `valid sms send success user: ${searchedEmail}, ${validate_type}`
        );

        const validateInsert = await handleConnect((prisma) =>
          prisma.validate.create({
            data: {
              email: searchedEmail,
              validate_data,
              type: "email",
              request_id: result.MessageId,
            },
          })
        );
        validateInsertComplete = !!validateInsert;
        if (!validateInsertComplete) throw ToastData.unknown;

        return {
          result: true,
          data: result.MessageId,
        };
      }
    }

    if (validate_type === ApiOtpType.EmailSettings) {
      if (!(json && email && email !== "")) throw ToastData.unknown;

      const validateData = await handleConnect((prisma) =>
        prisma.validate.findMany({
          where: {
            email,
            type: "email",
            status: ValidateStatus.progress,
          },
        })
      );
      const existSend = !!validateData && validateData.length > 0;

      if (existSend) {
        console.info(`already send user: ${email}, ${validate_type}`);
        const diffMinutes = now().diff(
          dayjs(validateData![0].updated_at).tz("Asia/Seoul"),
          "minute"
        );
        if (diffMinutes < 2) {
          return { result: false, error: ToastData.waitSend };
        }
      }
      const validate_data = makeRandomText({ length: 6 });

      const result = await sendEmail(
        email,
        `[테더나라] 인증메일입니다.`,
        emailAuth({
          title: "[테더나라] 인증메일입니다.",
          time: "30",
          authCode: validate_data,
          date: now().format("YYYY-MM-DD HH:mm:ss"),
        })
      );
      if (!result.MessageId) throw ToastData.unknown;
      console.info(`valid sms send success user: ${email}, ${validate_type}`);

      const validateInsert = await handleConnect((prisma) =>
        prisma.validate.create({
          data: {
            email,
            validate_data,
            type: "email",
            request_id: result.MessageId,
          },
        })
      );
      const validateInsertComplete = !!validateInsert;
      if (!validateInsertComplete) throw ToastData.unknown;

      return {
        result: true,
        data: result.MessageId,
      };
    }

    // if (validate_type === ApiOtpType.SmsSignup) {
    //   const profiles = await handleConnect((prisma) =>
    //     prisma.profile.findMany({
    //       where: {
    //         phone_number,
    //       },
    //     })
    //   );

    //   if (!profiles) throw ToastData.unknown;
    //   if (profiles && profiles.length > 0) {
    //     throw ToastData.alreadyExistId;
    //   }

    //   const validateData = await handleConnect((prisma) =>
    //     prisma.validate.findMany({
    //       where: {
    //         phone_number,
    //         type: "sms",
    //         status: ValidateStatus.progress,
    //       },
    //     })
    //   );
    //   const existSend = validateData && validateData?.length > 0;

    //   if (existSend) {
    //     console.info(`already send user: ${phone_number}, ${validate_type}`);
    //     const diffMinutes = now().diff(
    //       dayjs(validateData[0].updated_at).tz("Asia/Seoul"),
    //       "minute"
    //     );
    //     if (diffMinutes < 2) {
    //       throw ToastData.alreadySend;
    //     }
    //   }
    //   const validate_data = makeRandomText({ length: 6 });

    //   const { success, messageId } = await sendSMS(
    //     phone_number,
    //     `[테더나라] 인증번호는 [${validate_data}] 입니다.`
    //   );
    //   if (!success || !messageId) throw ToastData.unknown;

    //   const validateInsert = await handleConnect((prisma) =>
    //     prisma.validate.create({
    //       data: {
    //         phone_number,
    //         validate_data,
    //         request_id: messageId,
    //       },
    //     })
    //   );
    //   if (!validateInsert) throw ToastData.unknown;

    //   return {
    //     result: true,
    //     message: ToastData.sendOtp,
    //     data: messageId,
    //   };
    // }
    // if (validate_type === ApiOtpType.SmsValid) {
    //   if (
    //     !(
    //       json &&
    //       phone_number &&
    //       request_id &&
    //       otp &&
    //       phone_number !== "" &&
    //       request_id !== "" &&
    //       otp !== ""
    //     )
    //   )
    //     throw ToastData.unknown;

    //   const validateFirstData = await handleConnect((prisma) =>
    //     prisma.validate.findFirst({
    //       where: {
    //         phone_number,
    //         request_id,
    //         type: "sms",
    //       },
    //     })
    //   );

    //   if (
    //     validateFirstData?.blocked_until &&
    //     dayjs(validateFirstData.blocked_until).tz("Asia/Seoul").isAfter(now())
    //   ) {
    //     throw ToastData.tooManyAttempts;
    //   }

    //   const validateData = await handleConnect((prisma) =>
    //     prisma.validate.findMany({
    //       where: {
    //         phone_number,
    //         type: "sms",
    //         status: ValidateStatus.progress,
    //         request_id,
    //       },
    //     })
    //   );
    //   const existSmsRequest = validateData && validateData.length > 0,
    //     isSmsEqual = otp === validateData?.[0].validate_data;
    //   let isValid = false,
    //     smsUpdateComplete = false;
    //   if (!(existSmsRequest && validateData)) throw ToastData.unknown;

    //   const diffMinutes = now().diff(
    //     dayjs(validateData[0].updated_at).tz("Asia/Seoul"),
    //     "minute"
    //   );
    //   const limitTime = 3;
    //   isValid =
    //     diffMinutes < limitTime && validateData[0].validate_data === otp;
    //   if (isValid) {
    //     const validateUpdate = await handleConnect((prisma) =>
    //       prisma.validate.updateMany({
    //         data: {
    //           status: ValidateStatus.valid,
    //         },
    //         where: {
    //           phone_number,
    //           type: "sms",
    //           validate_data: otp,
    //           status: ValidateStatus.progress,
    //           request_id,
    //         },
    //       })
    //     );
    //     smsUpdateComplete = !!validateUpdate;

    //     if (!smsUpdateComplete)
    //       return { result: false, message: ToastData.otpError };

    //     return { result: true };
    //   }
    //   if (!isValid) {
    //     const newAttemptCount = (validateData?.[0]?.attempt_count || 0) + 1;
    //     const shouldBlock = newAttemptCount >= 5;

    //     await handleConnect((prisma) =>
    //       prisma.validate.updateMany({
    //         where: {
    //           phone_number,
    //           type: "sms",
    //           request_id,
    //         },
    //         data: {
    //           attempt_count: newAttemptCount,
    //           blocked_until: shouldBlock
    //             ? dayjs().add(5, "minutes").toDate()
    //             : null,
    //           status: ValidateStatus.fail,
    //         },
    //       })
    //     );

    //     if (shouldBlock) {
    //       throw ToastData.tooManyAttempts;
    //     }
    //   }

    //   return {
    //     result: false,
    //     message: isSmsEqual ? ToastData.timeOut : ToastData.otpError,
    //   };
    // }

    // if (validate_type === ApiOtpType.SmsForgotPassword) {
    //   if (
    //     !(
    //       json &&
    //       phone_number &&
    //       phone_number !== "" &&
    //       validate_type === ApiOtpType.forgotPassword
    //     )
    //   )
    //     throw ToastData.unknown;

    //   const matchColumn = { phone_number };
    //   const userData = await handleConnect((prisma) =>
    //     prisma.profile.findMany({
    //       where: matchColumn,
    //     })
    //   );
    //   const noUser = userData && userData.length === 0,
    //     isUser = userData && userData.length > 0;
    //   let existSend = false,
    //     validateInsertComplete = false;
    //   if (noUser) {
    //     console.info(`no user: ${phone_number}, ${validate_type}`);
    //     return { result: false, error: "no_user" };
    //   } else if (isUser && userData?.[0]) {
    //     const searchedPhoneNumber = userData[0].phone_number;
    //     console.info(`is_user: ${searchedPhoneNumber}, ${validate_type}`);

    //     const validateData = await handleConnect((prisma) =>
    //       prisma.validate.findMany({
    //         where: {
    //           phone_number: searchedPhoneNumber,
    //           type: "sms",
    //           status: ValidateStatus.progress,
    //         },
    //       })
    //     );
    //     existSend = !!validateData && validateData.length > 0;

    //     if (existSend) {
    //       console.info(
    //         `already send user: ${searchedPhoneNumber}, ${validate_type}`
    //       );
    //       const diffMinutes = now().diff(
    //         dayjs(validateData![0].updated_at).tz("Asia/Seoul"),
    //         "minute"
    //       );
    //       if (diffMinutes < 2) {
    //         return { result: false, error: ToastData.waitSend };
    //       }
    //     }
    //     const validate_data = makeRandomText({ length: 6 });

    //     const { success, messageId } = await sendSMS(
    //       searchedPhoneNumber,
    //       `[테더나라] 인증번호는 [${validate_data}] 입니다.`
    //     );
    //     if (!success || !messageId) throw ToastData.unknown;
    //     console.info(
    //       `valid sms send success user: ${searchedPhoneNumber}, ${validate_type}`
    //     );

    //     const validateInsert = await handleConnect((prisma) =>
    //       prisma.validate.create({
    //         data: {
    //           phone_number: searchedPhoneNumber,
    //           validate_data,
    //           request_id: messageId,
    //         },
    //       })
    //     );
    //     validateInsertComplete = !!validateInsert;
    //     if (!validateInsertComplete) throw ToastData.unknown;

    //     return {
    //       result: true,
    //       request_id: messageId,
    //     };
    //   }
    // }
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
  return {
    result: false,
    message: ToastData.unknown,
  };
};
