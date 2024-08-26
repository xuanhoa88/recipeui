import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { APP_COOKIE } from "ui/utils/constants/main";
import { getUrl } from "ui/utils/main";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = cookies();

  cookieStore.set(APP_COOKIE, "true", {
    expires: 7,
  });

  const url = new URL(getUrl());

  const searchParams = new URLSearchParams();
  searchParams.append("test", "test");

  url.search = searchParams.toString();

  return NextResponse.redirect(url);
}
