import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

/* ── POST – proxy video file upload to Spring Boot → S3 ── */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  /* Rebuild FormData for the backend (Node fetch supports it natively) */
  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  try {
    const res = await fetch(`${BACKEND}/api/home/upload-video`, {
      method: "POST",
      headers: { Authorization: auth },
      body: backendForm,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Upload failed." }, { status: res.status });
    }
    return NextResponse.json(data);          // { key, url }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ── DELETE – remove the video from S3 and settings ── */
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";

  try {
    const res = await fetch(`${BACKEND}/api/home/video`, {
      method: "DELETE",
      headers: { Authorization: auth },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Delete failed." }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
