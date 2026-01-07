import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "NAVER 검색 API 환경변수가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      "https://openapi.naver.com/v1/search/local.json?query=헬스장&display=5",
      {
        headers: {
          "X-Naver-Client-Id": process.env.NAVER_CLIENT_ID,
          "X-Naver-Client-Secret": process.env.NAVER_CLIENT_SECRET,
        },
      }
    );

    if (!res.ok) {
      throw new Error("네이버 API 응답 오류");
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "검색 API 호출 실패" },
      { status: 500 }
    );
  }
}

