// renderEmailTemplate is pure (no DB), but its module imports the prisma helper
// at the top for the sibling loadEmailTemplateForSend(). Mock it so importing
// this module under Jest doesn't spin up a real Prisma client.
jest.mock("../prisma", () => ({
  handleConnect: jest.fn(),
}));

import {
  renderEmailTemplate,
  type EmailRenderInput,
} from "@/helpers/server/emailRender";

const baseVars = (
  overrides: Partial<EmailRenderInput> = {}
): EmailRenderInput => ({
  siteName: "테더나라",
  authCode: "123456",
  date: "2026-06-25 10:00",
  validityMinutes: "5",
  contactEmail: "help@example.com",
  siteUrl: "https://example.com",
  year: "2026",
  logoUrl: null,
  ...overrides,
});

describe("renderEmailTemplate — subject", () => {
  it("substitutes variables in the subject (plain text)", () => {
    const { subject } = renderEmailTemplate(
      { subject: "[{{siteName}}] 인증번호", body: "" },
      baseVars()
    );
    expect(subject).toBe("[테더나라] 인증번호");
  });

  it("does not HTML-escape the subject itself", () => {
    const { subject } = renderEmailTemplate(
      { subject: "{{siteName}}", body: "" },
      baseVars({ siteName: "A & B" })
    );
    expect(subject).toBe("A & B");
  });

  it("replaces unknown/empty variables with an empty string", () => {
    const { subject } = renderEmailTemplate(
      { subject: "code:{{authCode}}", body: "" },
      baseVars({ authCode: "" })
    );
    expect(subject).toBe("code:");
  });
});

describe("renderEmailTemplate — body substitution & escaping", () => {
  it("renders the auth code in bold markup", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "{{authCode}}" },
      baseVars({ authCode: "987654" })
    );
    expect(html).toContain(
      '<strong style="font-weight: 700; color: #020817">987654</strong>'
    );
  });

  it("renders contactEmail as a mailto link when present", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "{{contactEmail}}" },
      baseVars({ contactEmail: "help@example.com" })
    );
    expect(html).toContain(
      '<a href="mailto:help@example.com" style="color: #1e293b">help@example.com</a>'
    );
  });

  it("omits the mailto link when contactEmail is empty", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "contact: {{contactEmail}}" },
      baseVars({ contactEmail: "" })
    );
    expect(html).not.toContain("mailto:");
    // paragraphs are trimmed, so the trailing space after the removed token is gone
    expect(html).toContain(
      '<p style="font-size: 16px; color: #0f172a; margin: 0 0 16px">contact:</p>'
    );
  });

  it("escapes HTML in admin-authored body text (injection guard)", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "<script>alert('x')</script>" },
      baseVars()
    );
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
  });

  it("escapes HTML inside substituted variable values", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "{{siteName}}" },
      baseVars({ siteName: "<b>evil</b>" })
    );
    expect(html).toContain("&lt;b&gt;evil&lt;/b&gt;");
    expect(html).not.toContain("<b>evil</b>");
  });

  it("splits blank-line-separated text into separate paragraphs", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "first\n\nsecond" },
      baseVars()
    );
    const paragraphs = html.match(/<p style="font-size: 16px/g) ?? [];
    expect(paragraphs).toHaveLength(2);
    expect(html).toContain("first");
    expect(html).toContain("second");
  });

  it("converts single newlines within a paragraph to <br>", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "line1\nline2" },
      baseVars()
    );
    expect(html).toContain("line1<br>line2");
  });
});

describe("renderEmailTemplate — footer", () => {
  it("renders the footer block when footerText is provided", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "body", footerText: "© {{year}} footerMarker" },
      baseVars({ year: "2026" })
    );
    expect(html).toContain("footerMarker");
    expect(html).toContain("2026");
    // footer-specific separator color
    expect(html).toContain("#cbd5e1");
  });

  it("omits the footer block when footerText is empty or null", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "body", footerText: "   " },
      baseVars()
    );
    expect(html).not.toContain("#cbd5e1");
  });
});

describe("renderEmailTemplate — layout", () => {
  it("escapes the subject in the document title", () => {
    const { html } = renderEmailTemplate(
      { subject: "{{siteName}}", body: "" },
      baseVars({ siteName: "A & B" })
    );
    expect(html).toContain("<title>A &amp; B</title>");
  });

  it("renders a logo image when logoUrl is provided", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "" },
      baseVars({ logoUrl: "https://cdn.example.com/logo.png" })
    );
    expect(html).toContain('<img src="https://cdn.example.com/logo.png"');
  });

  it("renders no logo image when logoUrl is absent", () => {
    const { html } = renderEmailTemplate(
      { subject: "s", body: "" },
      baseVars({ logoUrl: null })
    );
    expect(html).not.toContain("<img src=");
  });
});
