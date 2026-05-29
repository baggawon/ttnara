import EmailTemplatesManager from "./EmailTemplatesManager";

export default function EmailTemplatesPage() {
  return (
    <section className="w-full flex flex-col gap-4">
      <h2>이메일 양식</h2>
      <p className="text-sm text-black/50 dark:text-white/50">
        사용자에게 발송되는 이메일의 제목과 본문을 직접 편집할 수 있습니다. 본문
        안에 변수를 넣으면 발송 시 실제 값으로 치환됩니다.
      </p>
      <EmailTemplatesManager />
    </section>
  );
}
