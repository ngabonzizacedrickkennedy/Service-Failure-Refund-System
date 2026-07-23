import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

/* ── POST – proxy image file upload to Spring Boot → S3 ── */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const path = formData.get("path") as string | null;
  if (!file || !path) {
    return NextResponse.json({ error: "file and path are both required." }, { status: 400 });
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  try {
    const res = await fetch(`${BACKEND}/api/home/upload-image?path=${encodeURIComponent(path)}`, {
      method: "POST",
      headers: { Authorization: auth },
      body: backendForm,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Upload failed." }, { status: res.status });
    }
    return NextResponse.json(data); // { key, url, path }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/* ── DELETE – remove a homepage image from S3 by its settings path ── */
export async function DELETE(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const path = req.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path is required." }, { status: 400 });
  }

  try {
    const res = await fetch(`${BACKEND}/api/home/image?path=${encodeURIComponent(path)}`, {
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
