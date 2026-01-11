/**
 * @file privacy/page.tsx
 * @description 개인정보 처리방침 페이지
 * 
 * 개인정보 수집, 이용, 제3자 제공에 관한 정책을 표시합니다.
 */

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보 처리방침 | REHAB",
  description: "REHAB 개인정보 처리방침",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">개인정보 처리방침</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          {/* 개요 */}
          <section>
            <p className="text-muted-foreground leading-relaxed">
              REHAB(이하 &quot;회사&quot;)은 이용자의 개인정보를 중요시하며, 
              「개인정보 보호법」을 준수하고 있습니다. 
              본 방침을 통해 수집하는 개인정보의 항목, 이용 목적, 보유 기간 등을 안내합니다.
            </p>
          </section>

          {/* 수집 항목 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제1조 (수집하는 개인정보 항목)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-foreground">수집 항목</th>
                    <th className="text-left py-3 px-4 text-foreground">수집 방법</th>
                    <th className="text-left py-3 px-4 text-foreground">필수 여부</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">이메일 주소</td>
                    <td className="py-3 px-4">회원가입 시 (Clerk 인증)</td>
                    <td className="py-3 px-4">필수</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">위치 정보 (위도/경도)</td>
                    <td className="py-3 px-4">헬스장 검색 시 (사용자 동의)</td>
                    <td className="py-3 px-4">선택</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">부위별 통증 정보</td>
                    <td className="py-3 px-4">재활 코스 생성 시</td>
                    <td className="py-3 px-4">필수</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">운동 기록</td>
                    <td className="py-3 px-4">코스 저장 시</td>
                    <td className="py-3 px-4">선택</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 이용 목적 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제2조 (개인정보 이용 목적)
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>회원 관리:</strong> 회원 식별, 서비스 이용 기록 관리</li>
              <li><strong>맞춤형 서비스 제공:</strong> 부위별 재활 운동 코스 생성, 코스 저장</li>
              <li><strong>위치 기반 서비스:</strong> 주변 헬스장 검색 및 추천</li>
              <li><strong>서비스 개선:</strong> 이용 통계 분석, 신규 기능 개발</li>
            </ul>
          </section>

          {/* 제3자 제공 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제3조 (개인정보의 제3자 제공)
            </h2>
            <p className="text-muted-foreground mb-4">
              회사는 서비스 제공을 위해 다음의 외부 서비스를 이용하며, 
              이에 따라 개인정보가 처리될 수 있습니다.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-foreground">제공받는 자</th>
                    <th className="text-left py-3 px-4 text-foreground">제공 항목</th>
                    <th className="text-left py-3 px-4 text-foreground">이용 목적</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Clerk Inc.</td>
                    <td className="py-3 px-4">이메일, 인증 정보</td>
                    <td className="py-3 px-4">회원 인증 및 로그인</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">Supabase Inc.</td>
                    <td className="py-3 px-4">운동 기록, 리뷰</td>
                    <td className="py-3 px-4">데이터 저장 및 관리</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-3 px-4">네이버 클라우드</td>
                    <td className="py-3 px-4">위치 정보</td>
                    <td className="py-3 px-4">지도 API, 장소 검색</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 보유 기간 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제4조 (개인정보 보유 및 이용 기간)
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>회원 탈퇴 시 즉시 파기 (단, 법령에 따라 보관이 필요한 경우 제외)</li>
              <li>위치 정보: 검색 완료 후 즉시 파기 (서버에 저장하지 않음)</li>
              <li>운동 기록: 회원 탈퇴 시까지 보관</li>
            </ul>
          </section>

          {/* 이용자 권리 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제5조 (이용자의 권리)
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>개인정보 열람, 정정, 삭제를 요청할 수 있습니다.</li>
              <li>위치 정보 수집에 대한 동의를 언제든지 철회할 수 있습니다.</li>
              <li>회원 탈퇴를 통해 모든 개인정보 삭제를 요청할 수 있습니다.</li>
            </ul>
          </section>

          {/* 보안 조치 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              제6조 (개인정보 보호를 위한 조치)
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>HTTPS 암호화 통신 적용</li>
              <li>비밀번호 암호화 저장 (Clerk 제공)</li>
              <li>데이터베이스 접근 권한 최소화</li>
            </ul>
          </section>

          {/* 시행일 */}
          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              본 개인정보 처리방침은 2026년 1월 11일부터 시행됩니다.
            </p>
          </section>

          {/* 돌아가기 링크 */}
          <div className="pt-8">
            <Link 
              href="/" 
              className="text-primary hover:underline"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
