import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  isValidAdminSession,
} from "@/lib/admin-session";

export const runtime = "nodejs";

type ReplyRequest = {
  inquiryId?: number;
  reply?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toHtmlParagraphs(value: string) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;line-height:1.75">${paragraph.replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!(await isValidAdminSession(sessionCookie))) {
    return NextResponse.json(
      { error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  }

  let body: ReplyRequest;

  try {
    body = (await request.json()) as ReplyRequest;
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const inquiryId = Number(body.inquiryId);
  const reply = String(body.reply ?? "").trim();

  if (!Number.isInteger(inquiryId) || inquiryId <= 0) {
    return NextResponse.json(
      { error: "문의 번호가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (!reply) {
    return NextResponse.json(
      { error: "답변 내용을 입력해 주세요." },
      { status: 400 },
    );
  }

  if (reply.length > 5000) {
    return NextResponse.json(
      { error: "답변은 5,000자 이내로 입력해 주세요." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const replyToEmail = process.env.RESEND_REPLY_TO_EMAIL;

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !fromEmail) {
    return NextResponse.json(
      {
        error:
          "이메일 발송 환경변수가 설정되지 않았습니다. SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL을 확인해 주세요.",
      },
      { status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: inquiry, error: inquiryError } = await supabase
    .from("inquiries")
    .select("id, name, email, property_title, message")
    .eq("id", inquiryId)
    .single();

  if (inquiryError || !inquiry) {
    console.error("답변 대상 문의 조회 오류:", inquiryError);
    return NextResponse.json(
      { error: "문의 정보를 찾지 못했습니다." },
      { status: 404 },
    );
  }

  if (!inquiry.email) {
    return NextResponse.json(
      { error: "고객 이메일이 입력되지 않은 문의입니다." },
      { status: 400 },
    );
  }

  const subject = inquiry.property_title
    ? `[백조현대부동산중개] ${inquiry.property_title} 문의 답변`
    : "[백조현대부동산중개] 문의 답변";

  const emailHtml = `
    <div style="background:#f1f5f9;padding:32px 16px;font-family:Arial,'Noto Sans KR',sans-serif;color:#1e293b">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0">
        <div style="background:#0A2342;padding:24px 28px">
          <p style="margin:0;color:#C9A227;font-size:14px;font-weight:700">백조현대부동산중개</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px">문의하신 내용에 답변드립니다</h1>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 20px;line-height:1.75">안녕하세요, ${escapeHtml(inquiry.name)}님.</p>
          <div style="margin:0 0 24px;padding:16px 18px;background:#f8fafc;border-radius:12px;border-left:4px solid #C9A227">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#64748b">고객 문의</p>
            <p style="margin:0;line-height:1.7;white-space:pre-wrap">${escapeHtml(inquiry.message)}</p>
          </div>
          <div style="font-size:15px">${toHtmlParagraphs(reply)}</div>
          <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;line-height:1.75;color:#475569">
            추가로 궁금한 사항이 있으시면 언제든지 연락해 주세요.<br />
            감사합니다.<br /><strong>백조현대부동산중개</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  const emailText = [
    `안녕하세요, ${inquiry.name}님.`,
    "",
    "[고객 문의]",
    inquiry.message,
    "",
    "[답변]",
    reply,
    "",
    "추가로 궁금한 사항이 있으시면 언제든지 연락해 주세요.",
    "감사합니다.",
    "백조현대부동산중개",
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "premium-estate/1.0",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [inquiry.email],
      subject,
      html: emailHtml,
      text: emailText,
      ...(replyToEmail ? { reply_to: replyToEmail } : {}),
    }),
  });

  const resendResult = (await resendResponse.json()) as {
    id?: string;
    message?: string;
    error?: { message?: string };
  };

  if (!resendResponse.ok || !resendResult.id) {
    console.error("Resend 이메일 발송 오류:", resendResult);
    return NextResponse.json(
      {
        error:
          resendResult.message ??
          resendResult.error?.message ??
          "이메일을 발송하지 못했습니다.",
      },
      { status: 502 },
    );
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
.update({
  reply_text: reply,
  status: "completed",
  reply_sent_at: sentAt,
  reply_email_id: resendResult.id,
  updated_at: sentAt,
})
    .eq("id", inquiryId);

  if (updateError) {
    console.error("답변 발송 이력 저장 오류:", updateError);
    return NextResponse.json(
      {
        error:
          "이메일은 발송되었지만 발송 이력을 저장하지 못했습니다. 데이터베이스 컬럼을 확인해 주세요.",
        emailSent: true,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    emailId: resendResult.id,
    sentAt,
  });
}
