declare module "*module.css" {
  const styles: {
    [className: string]: string;
  };
  export default styles;
}

import { DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

interface UserBasic {
  name: string;
  auth: string;
  id: string;
  displayname: string;
  point: number;
  is_app_admin: boolean;
  auth_level: number;
  kyc_id: string | null;
}
declare module "next-auth" {
  /**
   * Session에 추가
   */
  interface Session {
    user: User;
  }

  /**
   * User에 추가
   */
  interface User extends UserBasic {}
}

declare module "next-auth/jwt" {
  /**
   * JWT에 추가
   */
  interface JWT extends UserBasic {
    sub: string;
    iat: number;
    exp: number;
    jti: string;
  }
}
