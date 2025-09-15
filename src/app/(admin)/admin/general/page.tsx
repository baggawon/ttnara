import { GeneralHandleForm } from "@/components/3_organisms/general/GeneralHandleForm";
import { LevelHandleForm } from "@/components/3_organisms/general/LevelHandleForm";
import { SystemHandleForm } from "@/components/3_organisms/general/SystemHandleForm";
import { UserHandleForm } from "@/components/3_organisms/general/UserHandleForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function General() {
  return (
    <section className="w-full flex flex-col gap-4 p-0 md:p-4">
      <h2>일반 설정</h2>

      <Card>
        <CardHeader>
          <h3>일반 설정</h3>
        </CardHeader>
        <CardContent className="w-full">
          <GeneralHandleForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3>시스템 설정</h3>
        </CardHeader>
        <CardContent>
          <SystemHandleForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3>레벨 설정</h3>
        </CardHeader>
        <CardContent>
          <LevelHandleForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <h3>사용자 설정</h3>
        </CardHeader>
        <CardContent>
          <UserHandleForm />
        </CardContent>
      </Card>
    </section>
  );
}
