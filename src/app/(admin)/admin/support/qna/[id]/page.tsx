import QnaFormPage from "../_components/QnaFormPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSupportQnaEdit(props: PageProps) {
  const params = await props.params;
  const numericId = Number(params.id);
  const qnaId = Number.isFinite(numericId) && numericId > 0 ? numericId : null;
  return <QnaFormPage qnaId={qnaId} />;
}
