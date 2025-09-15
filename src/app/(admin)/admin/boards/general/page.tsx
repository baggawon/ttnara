import { BoardGeneralForm } from "./form";

export default function Page() {
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <h2>게시판 설정</h2>
      <BoardGeneralForm />
    </section>
  );
}
