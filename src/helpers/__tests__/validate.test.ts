import {
  validNumber,
  validateValidEmail,
  invalidEmailCases,
  validateEmailCode,
  ValidateEmailCode,
  validatePassword,
  ValidatePassword,
  validateConfirmPassword,
  ValidateConfirmPassword,
  validatephone,
} from "@/helpers/validate";
import { ValidateStatus, ValidateEmailStatus } from "@/helpers/types";

describe("validNumber", () => {
  it("accepts a value within range", () => {
    expect(validNumber({ value: "5", min: 0, max: 10 })).toBe(true);
  });

  it("rejects a value above max", () => {
    expect(validNumber({ value: "15", min: 0, max: 10 })).toBe(false);
  });

  it("rejects a value below min", () => {
    expect(validNumber({ value: "-1", min: 0, max: 10 })).toBe(false);
  });

  it("rejects decimals when maxDecimal is 0", () => {
    expect(validNumber({ value: "5.5", min: 0, max: 10, maxDecimal: 0 })).toBe(
      false
    );
  });

  it("accepts decimals within maxDecimal", () => {
    expect(validNumber({ value: "5.5", min: 0, max: 10, maxDecimal: 1 })).toBe(
      true
    );
  });

  it("rejects empty input", () => {
    expect(validNumber({ value: "", min: 0, max: 10 })).toBe(false);
  });
});

describe("validateValidEmail", () => {
  it("flags empty input", () => {
    expect(validateValidEmail("", "")).toBe(invalidEmailCases.empty);
  });

  it("flags malformed addresses", () => {
    expect(validateValidEmail("not-an-email", "")).toBe(
      invalidEmailCases.invalidFormat
    );
  });

  it("passes a well-formed address when no certification is required", () => {
    expect(validateValidEmail("user@example.com", "")).toBeUndefined();
  });

  it("requires certification when status is not valid", () => {
    expect(
      validateValidEmail("user@example.com", ValidateStatus.progress)
    ).toBe(invalidEmailCases.needCertified);
  });

  it("passes when status is valid", () => {
    expect(
      validateValidEmail("user@example.com", ValidateStatus.valid)
    ).toBeUndefined();
  });
});

describe("validateEmailCode", () => {
  it("flags empty input", () => {
    expect(validateEmailCode("", ValidateEmailStatus.valid)).toBe(
      ValidateEmailCode.empty
    );
  });

  it("requires exactly 6 characters", () => {
    expect(validateEmailCode("123", ValidateEmailStatus.valid)).toBe(
      ValidateEmailCode.invalidFormat
    );
  });

  it("reports a failed verification", () => {
    expect(validateEmailCode("123456", ValidateEmailStatus.fail)).toBe(
      ValidateEmailCode.fail
    );
  });

  it("reports a timed-out verification", () => {
    expect(validateEmailCode("123456", ValidateEmailStatus.timeout)).toBe(
      ValidateEmailCode.timeout
    );
  });
});

describe("validatePassword", () => {
  it("flags empty input when required", () => {
    expect(validatePassword("")).toBe(ValidatePassword.empty);
  });

  it("allows empty input when not required", () => {
    expect(validatePassword("", false)).toBeUndefined();
  });

  it("rejects passwords shorter than 6 chars", () => {
    expect(validatePassword("12345")).toBe(ValidatePassword.short);
  });

  it("rejects passwords longer than 12 chars", () => {
    expect(validatePassword("1234567890123")).toBe(ValidatePassword.long);
  });

  it("accepts a valid password", () => {
    expect(validatePassword("secret123")).toBeUndefined();
  });
});

describe("validateConfirmPassword", () => {
  it("flags mismatched confirmation", () => {
    expect(validateConfirmPassword("secret123", "different")).toBe(
      ValidateConfirmPassword.notMatch
    );
  });

  it("accepts a matching confirmation", () => {
    expect(validateConfirmPassword("secret123", "secret123")).toBeUndefined();
  });
});

describe("validatephone", () => {
  it("flags empty input", () => {
    expect(validatephone("")).toBe("연락처를 입력해 주세요");
  });

  it("rejects non-numeric input", () => {
    expect(validatephone("abc-defg")).toBe(
      "9글자 이상의 숫자로만 입력해 주세요"
    );
  });

  it("accepts a well-formed number", () => {
    expect(validatephone("01012345678")).toBeUndefined();
  });
});
