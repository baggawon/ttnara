"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { adminEmailTemplatesGet } from "@/helpers/get";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import { EMAIL_TEMPLATE_VARS } from "@/helpers/emailTemplateVars";

interface EmailTemplateRow {
  id: number;
  key: string;
  name: string;
  subject: string;
  body: string;
  footer_text: string | null;
  contact_email: string | null;
  sender_id: number | null;
  is_active: boolean;
  is_system: boolean;
}

interface EmailSenderRow {
  id: number;
  label: string;
  email: string;
  is_default: boolean;
  is_active: boolean;
}

interface EmailTemplatesData {
  templates: EmailTemplateRow[];
  senders: EmailSenderRow[];
}

interface SenderDraft {
  id?: number;
  label: string;
  email: string;
  is_default: boolean;
  is_active: boolean;
  _key: string;
}

type EditableField = "subject" | "body" | "footer_text";

interface TemplateDraft {
  subject: string;
  body: string;
  footer_text: string;
  contact_email: string;
  sender_id: number | null;
  is_active: boolean;
}

const SENDER_DEFAULT_VALUE = "default";

let senderKeySeq = 0;
const makeSenderKey = () => `new-${senderKeySeq++}`;

export default function EmailTemplatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useGetQuery<EmailTemplatesData, undefined>(
    { queryKey: [QueryKey.adminEmailTemplates] },
    adminEmailTemplatesGet,
    undefined,
    { silent: true }
  );

  const templates = data?.templates ?? [];
  const senders = data?.senders ?? [];

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<TemplateDraft>({
    subject: "",
    body: "",
    footer_text: "",
    contact_email: "",
    sender_id: null,
    is_active: true,
  });

  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [senderDrafts, setSenderDrafts] = useState<SenderDraft[]>([]);
  const [savingSenders, setSavingSenders] = useState(false);
  const sendersInitialized = useRef(false);

  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const footerRef = useRef<HTMLTextAreaElement | null>(null);
  const lastFocused = useRef<EditableField>("body");

  const toDraft = (t: EmailTemplateRow): TemplateDraft => ({
    subject: t.subject,
    body: t.body,
    footer_text: t.footer_text ?? "",
    contact_email: t.contact_email ?? "",
    sender_id: t.sender_id,
    is_active: t.is_active,
  });

  const runPreview = async (d: TemplateDraft) => {
    setPreviewLoading(true);
    try {
      const { hasData } = await postJson(ApiRoute.adminEmailTemplatesPreview, {
        subject: d.subject,
        body: d.body,
        footer_text: d.footer_text || null,
        contact_email: d.contact_email || null,
        sender_id: d.sender_id,
      });
      if (hasData?.html) setPreviewHtml(hasData.html as string);
    } catch {
      // Preview is best-effort; ignore transient failures.
    } finally {
      setPreviewLoading(false);
    }
  };

  const selectTemplate = (t: EmailTemplateRow) => {
    setSelectedId(t.id);
    const next = toDraft(t);
    setDraft(next);
    void runPreview(next);
  };

  // Initialize selection + sender drafts once data arrives. After a sender save
  // we flip sendersInitialized back to false so fresh ids are picked up.
  useEffect(() => {
    if (!data) return;
    if (selectedId === null && data.templates.length > 0) {
      selectTemplate(data.templates[0]);
    }
    if (!sendersInitialized.current) {
      setSenderDrafts(
        data.senders.map((s) => ({
          id: s.id,
          label: s.label,
          email: s.email,
          is_default: s.is_default,
          is_active: s.is_active,
          _key: `db-${s.id}`,
        }))
      );
      sendersInitialized.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const selectedTemplate = templates.find((t) => t.id === selectedId) ?? null;
  const activeSenders = senders.filter((s) => s.is_active);

  const insertToken = (token: string) => {
    const field = lastFocused.current;
    const el =
      field === "subject"
        ? subjectRef.current
        : field === "body"
          ? bodyRef.current
          : footerRef.current;
    const current = draft[field] ?? "";
    let start = current.length;
    let end = current.length;
    if (el) {
      start = el.selectionStart ?? start;
      end = el.selectionEnd ?? end;
    }
    const nextValue = current.slice(0, start) + token + current.slice(end);
    setDraft((d) => ({ ...d, [field]: nextValue }));
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const saveTemplate = async () => {
    if (selectedId === null || savingTemplate) return;
    if (!draft.subject.trim() || !draft.body.trim()) {
      toast({ id: ToastData.emailTemplateUpdateFailed, type: "error" });
      return;
    }
    setSavingTemplate(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminEmailTemplatesUpdate,
        {
          id: selectedId,
          subject: draft.subject,
          body: draft.body,
          footer_text: draft.footer_text || null,
          contact_email: draft.contact_email || null,
          sender_id: draft.sender_id,
          is_active: draft.is_active,
        }
      );
      if (hasMessage)
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.adminEmailTemplates);
        void runPreview(draft);
      }
    } finally {
      setSavingTemplate(false);
    }
  };

  const addSenderRow = () => {
    setSenderDrafts((rows) => [
      ...rows,
      {
        label: "",
        email: "",
        is_default: rows.length === 0,
        is_active: true,
        _key: makeSenderKey(),
      },
    ]);
  };

  const updateSenderRow = (key: string, patch: Partial<SenderDraft>) => {
    setSenderDrafts((rows) =>
      rows.map((r) => (r._key === key ? { ...r, ...patch } : r))
    );
  };

  const removeSenderRow = (key: string) => {
    setSenderDrafts((rows) => {
      const filtered = rows.filter((r) => r._key !== key);
      // Keep exactly one default among the remaining rows.
      if (filtered.length && !filtered.some((r) => r.is_default)) {
        filtered[0] = { ...filtered[0], is_default: true };
      }
      return filtered;
    });
  };

  const setSenderDefault = (key: string) => {
    setSenderDrafts((rows) =>
      rows.map((r) => ({ ...r, is_default: r._key === key }))
    );
  };

  const saveSenders = async () => {
    if (savingSenders) return;
    setSavingSenders(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminEmailSendersSave,
        {
          senders: senderDrafts.map((s) => ({
            id: s.id,
            label: s.label,
            email: s.email,
            is_default: s.is_default,
            is_active: s.is_active,
          })),
        }
      );
      if (hasMessage)
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      if (isSuccess) {
        sendersInitialized.current = false;
        refreshCache(queryClient, QueryKey.adminEmailTemplates);
      }
    } finally {
      setSavingSenders(false);
    }
  };

  const senderSelectValue =
    draft.sender_id === null ? SENDER_DEFAULT_VALUE : String(draft.sender_id);

  return (
    <div className="w-full flex flex-col gap-4 max-w-6xl">
      {/* Sender address registry */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3>발신 이메일</h3>
            <p className="text-xs text-black/50 dark:text-white/50">
              이메일을 보낼 때 사용할 발신(From) 주소를 등록합니다. 각 양식에서
              어떤 주소로 보낼지 선택합니다. (AWS SES에서 해당 도메인/주소가
              인증되어 있어야 발송됩니다.) 사용자가 문의할 주소는 각 양식의 문의
              이메일에서 따로 지정합니다.
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {senderDrafts.length === 0 && (
            <p className="text-sm text-black/40">
              등록된 발신 이메일이 없습니다. 추가해 주세요.
            </p>
          )}
          {senderDrafts.map((s) => (
            <div
              key={s._key}
              className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 border rounded-md p-3"
            >
              <Input
                value={s.label}
                placeholder="이름 (예: 발신전용)"
                className="sm:w-40"
                onChange={(e) =>
                  updateSenderRow(s._key, { label: e.target.value })
                }
              />
              <Input
                value={s.email}
                placeholder="noreply@example.com"
                className="sm:flex-1"
                onChange={(e) =>
                  updateSenderRow(s._key, { email: e.target.value })
                }
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant={s.is_default ? "default" : "outline"}
                  onClick={() => setSenderDefault(s._key)}
                >
                  {s.is_default ? "기본" : "기본으로"}
                </Button>
                <div className="flex items-center gap-1.5">
                  <Switch
                    checked={s.is_active}
                    onCheckedChange={(v) =>
                      updateSenderRow(s._key, { is_active: v })
                    }
                  />
                  <span className="text-xs text-black/50">활성</span>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => removeSenderRow(s._key)}
                  aria-label="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSenderRow}
            >
              <Plus className="w-4 h-4 mr-1" />
              발신 이메일 추가
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveSenders}
              disabled={savingSenders}
              aria-busy={savingSenders}
            >
              {savingSenders && (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              )}
              발신 이메일 저장
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template editor */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
        {/* Case list */}
        <div className="flex flex-col gap-1.5">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTemplate(t)}
              className={clsx(
                "text-left px-3 py-2 rounded-md border text-sm transition-colors",
                t.id === selectedId
                  ? "border-primary bg-primary/5 font-medium"
                  : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"
              )}
            >
              <span className="flex items-center justify-between gap-2">
                {t.name}
                {!t.is_active && (
                  <Badge variant="secondary" className="text-[10px]">
                    비활성
                  </Badge>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Editor + preview */}
        {selectedTemplate ? (
          <div className="flex flex-col gap-4 min-w-0">
            <Card>
              <CardHeader>
                <h3>{selectedTemplate.name}</h3>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Variable insert panel */}
                <div className="rounded-md border border-dashed bg-muted/40 p-3 flex flex-col gap-2">
                  <Label className="text-xs text-black/60 dark:text-white/60">
                    변수 삽입 (클릭하면 마지막으로 선택한 입력란에 추가됩니다)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {EMAIL_TEMPLATE_VARS.map((v) => (
                      <Button
                        key={v.key}
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        title={`${v.token} — ${v.description}`}
                        onClick={() => insertToken(v.token)}
                      >
                        {v.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email-subject">제목</Label>
                  <Input
                    id="email-subject"
                    ref={subjectRef}
                    value={draft.subject}
                    onFocus={() => (lastFocused.current = "subject")}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, subject: e.target.value }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email-body">본문</Label>
                  <Textarea
                    id="email-body"
                    ref={bodyRef}
                    value={draft.body}
                    rows={12}
                    className="font-mono text-sm"
                    onFocus={() => (lastFocused.current = "body")}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, body: e.target.value }))
                    }
                  />
                  <p className="text-xs text-black/40">
                    빈 줄로 문단을 구분합니다. {"{{authCode}}"} 변수가 들어간
                    양식만 인증번호가 표시됩니다.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="email-footer">
                    하단 영역 (안내 문구 · 저작권)
                  </Label>
                  <Textarea
                    id="email-footer"
                    ref={footerRef}
                    value={draft.footer_text}
                    rows={5}
                    className="font-mono text-sm"
                    onFocus={() => (lastFocused.current = "footer_text")}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        footer_text: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-black/40">
                    본문 하단에 표시됩니다. 저작권 문구를 포함해 모든 텍스트를
                    편집할 수 있고, 변수도 사용할 수 있습니다. 비우면 하단
                    영역이 표시되지 않습니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>발신 이메일 (보내는 주소)</Label>
                    <Select
                      value={senderSelectValue}
                      onValueChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          sender_id:
                            v === SENDER_DEFAULT_VALUE ? null : Number(v),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SENDER_DEFAULT_VALUE}>
                          기본 발신자 사용
                        </SelectItem>
                        {activeSenders.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.label} ({s.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-black/40">
                      이메일이 발송되는 From 주소입니다. (예: noreply@…)
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email-contact">
                      문의 이메일 (받는 주소)
                    </Label>
                    <Input
                      id="email-contact"
                      type="email"
                      value={draft.contact_email}
                      placeholder="help@example.com"
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          contact_email: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-black/40">
                      사용자가 문의할 주소입니다. 발신 주소와 별개이며,{" "}
                      {"{{contactEmail}}"} 변수로 본문/하단에 넣을 수 있습니다.
                    </p>
                  </div>
                </div>

                {!selectedTemplate.is_system && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={draft.is_active}
                      onCheckedChange={(v) =>
                        setDraft((d) => ({ ...d, is_active: v }))
                      }
                    />
                    <span className="text-sm">활성화</span>
                  </div>
                )}

                <Button
                  type="button"
                  className="w-fit"
                  onClick={saveTemplate}
                  disabled={savingTemplate}
                  aria-busy={savingTemplate}
                >
                  {savingTemplate && (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  )}
                  저장
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <h3>미리보기</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void runPreview(draft)}
                  disabled={previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  새로고침
                </Button>
              </CardHeader>
              <CardContent>
                <iframe
                  title="이메일 미리보기"
                  srcDoc={previewHtml}
                  sandbox=""
                  className="w-full h-[560px] rounded border bg-white"
                />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-sm text-black/40">
            불러오는 중...
          </div>
        )}
      </div>
    </div>
  );
}
