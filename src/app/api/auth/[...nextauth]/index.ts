import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { handleConnect } from "@/helpers/server/prisma";
import bcrypt from "bcrypt";
import { forEach, removeColumnsFromObject } from "@/helpers/basic";
import { AppRoute } from "@/helpers/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
import requestIp from "request-ip";
import { checkUserStatus } from "@/helpers/server/serverFunctions";
import type { general_setting } from "@prisma/client";
import GoogleProvider from "next-auth/providers/google";
import { createId } from "@paralleldrive/cuid2";
import { parseSiteSettings } from "@/middleware";

const userSelect = {
  password: true,
  id: true,
  username: true,
  is_active: true,
  is_superuser: true,
  profile: {
    select: {
      phone_number: true,
      displayname: true,
      is_app_admin: true,
      phone_is_validated: true,
      google_id: true,
      auth_level: true,
    },
  },
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 2 * 24 * 60 * 60, // days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "UserId", type: "username", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, req): Promise<any> => {
        const siteSettings = req.headers?.cookie;

        if (siteSettings) {
          const siteSettingsValue = parseSiteSettings(siteSettings);
          if (siteSettingsValue) {
            const generalSettings = JSON.parse(siteSettingsValue) as
              | general_setting
              | undefined;
            if (generalSettings?.allow_login === false) {
              return null;
            }
          }
        }

        if (credentials) {
          const userData = await handleConnect((prisma) =>
            prisma.user.findUnique({
              where: {
                username: credentials.username,
              },
              select: userSelect,
            })
          );
          if (userData) {
            const isMatch = await bcrypt.compare(
              credentials.password,
              userData?.password
            );

            if (isMatch) {
              return removeColumnsFromObject(
                {
                  ...userData,
                  name: userData.username,
                  req,
                },
                ["password"]
              );
            }
          }
        }
        // Return null if user data could not be retrieved
        return null;
      },
    }),
    // Google 프로바이더 추가
    GoogleProvider({
      clientId: process.env.CLIENT_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Google 토큰으로 로그인하기 위한 Credentials 프로바이더 추가
    CredentialsProvider({
      id: "google-token",
      name: "Google Token",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials, req): Promise<any> {
        const siteSettings = req.headers?.cookie;

        if (siteSettings) {
          const siteSettingsValue = parseSiteSettings(siteSettings);
          if (siteSettingsValue) {
            const generalSettings = JSON.parse(siteSettingsValue) as
              | general_setting
              | undefined;
            if (generalSettings?.allow_login === false) {
              return null;
            }
          }
        }

        if (!credentials?.token) return null;

        try {
          // Google API를 사용하여 토큰으로 사용자 정보 가져오기
          const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: {
                Authorization: `Bearer ${credentials.token}`,
              },
            }
          );

          if (!response.ok) {
            return null;
          }

          const googleData: {
            sub: string;
            picture: string;
            email: string;
            email_verified: boolean;
          } = await response.json();

          // 이메일로 사용자 확인 또는 생성
          let userData = await handleConnect((prisma) =>
            prisma.user.findFirst({
              where: {
                profile: { email: googleData.email },
              },
              select: userSelect,
            })
          );

          if (userData && userData.profile?.google_id !== googleData.sub)
            return null;

          // 사용자가 존재하지 않으면 새로 생성 (필요에 따라 활성화/비활성화)
          if (!userData) {
            const password = createId();
            const hashedPassword = await bcrypt.hash(password, 10);

            const userSettings = await handleConnect((prisma) =>
              prisma.user_setting.findFirst()
            );

            if (userSettings) {
              userData = await handleConnect((prisma) =>
                prisma.user.create({
                  data: {
                    username: password,
                    password: hashedPassword,
                    profile: {
                      create: {
                        displayname: password,
                        phone_number: "",
                        email: googleData.email,
                        email_is_validated: googleData.email_verified,
                        auth_level: userSettings.default_auth_level,
                        user_level: userSettings.default_user_level,
                        google_id: googleData.sub,
                      },
                    },
                  },
                  select: userSelect,
                })
              );

              const updateResult = await handleConnect((prisma) =>
                prisma.user.update({
                  where: {
                    id: userData!.id,
                  },
                  data: {
                    username: userData!.id,
                  },
                })
              );

              if (!updateResult) return null;

              if (userData) userData.username = userData.id;
            }
          }

          return removeColumnsFromObject(
            {
              ...userData,
              name: userData?.username,
              req,
            },
            ["password"]
          );
        } catch (error) {
          console.error("Error verifying Google token:", error);
          return null;
        }
      },
    }),
  ],
  events: {
    async updateUser(message: any) {
      console.log("message", message);
      const password = await bcrypt.hash(message.password, 10);
      await handleConnect((prisma) =>
        prisma.user.update({ ...message, password })
      );
    },
  },
  pages: {
    signIn: AppRoute.Main,
  },
  callbacks: {
    async signIn(message: any) {
      try {
        const error = checkUserStatus(message.user);
        if (error) throw error;
      } catch (error) {
        return false;
      }

      await handleConnect((prisma) =>
        prisma.user.update({
          where: {
            id: message.user.id,
          },
          data: {
            last_login: dayjs.utc().toDate(),
            login_histories: {
              create: {
                ip: requestIp.getClientIp(message.user.req) ?? "unknown",
                agent: message.user.req?.headers?.["user-agent"],
              },
            },
          },
        })
      );
      return true;
    },
    async jwt({ token }) {
      const userData = await handleConnect((prisma) =>
        prisma.user.findUnique({
          where: {
            username: token.name!,
          },
          select: {
            id: true,
            is_superuser: true,
            profile: {
              select: {
                displayname: true,
                point: true,
                is_app_admin: true,
                auth_level: true,
                kyc_id: true,
              },
            },
          },
        })
      );
      let auth = "user";
      if (userData?.profile?.is_app_admin) {
        auth = "admin";
      }
      if (userData?.is_superuser) {
        auth = "superAdmin";
      }

      return {
        ...token,
        auth,
        ...(userData && {
          ...removeColumnsFromObject(userData, ["profile", "is_superuser"]),
          ...userData.profile,
        }),
      };
    },
    async session({ session, token }) {
      forEach(Object.entries(token), ([key, value]) => {
        if (["sub", "iat", "exp", "jti"].includes(key)) return;
        (session as any).user[key] = value;
      });
      return session;
    },
  },
};
