/**
 * @file terms/page.tsx
 * @description 이용약관 페이지
 * 
 * 서비스 이용약관 및 면책조항을 표시합니다.
 * - 의료행위 아님 명시
 * - 통증 악화 시 중단 권고
 * - 전문의 상담 권장
 */

import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관 | REHAB",
  description: "REHAB 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">이용약관</h1>
        
        <div className="prose prose-invert max-w-none space-y-8">
          {/* 서비스 개요 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제1조 (서비스 개요)</h2>
            <p className="text-muted-foreground leading-relaxed">
              REHAB(이하 &quot;서비스&quot;)은 동네 기반 재활 헬스장 추천 및 맞춤형 재활 운동 코스 생성 서비스입니다.
              사용자는 본 서비스를 통해 부위별 재활 운동 코스를 제공받고, 주변 헬스장 정보를 확인할 수 있습니다.
            </p>
          </section>

          {/* 의료행위 면책 - 가장 중요 */}
          <section className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-amber-400 mb-4">
              ⚠️ 제2조 (의료행위 아님 및 면책)
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="font-medium text-foreground">
                본 서비스는 의료행위가 아니며, 의료적 진단, 치료, 처방을 대체하지 않습니다.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  본 서비스에서 제공하는 운동 코스는 일반적인 재활 운동 정보를 기반으로 하며,
                  개인의 의학적 상태를 고려한 것이 아닙니다.
                </li>
                <li>
                  <strong className="text-amber-400">
                    운동 중 통증이 악화되거나 불편함이 느껴지면 즉시 운동을 중단하고 전문의와 상담하시기 바랍니다.
                  </strong>
                </li>
                <li>
                  급성 부상, 수술 후 회복기, 또는 심각한 질환이 있는 경우
                  반드시 전문 의료진의 지도 하에 운동을 진행해야 합니다.
                </li>
                <li>
                  서비스 이용으로 인해 발생할 수 있는 부상이나 건강 문제에 대해
                  REHAB은 법적 책임을 지지 않습니다.
                </li>
              </ul>
            </div>
          </section>

          {/* 이용자 의무 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제3조 (이용자의 의무)</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>이용자는 서비스 이용 전 본인의 건강 상태를 확인해야 합니다.</li>
              <li>운동 코스 수행 시 무리하지 않고, 본인의 체력에 맞게 조절해야 합니다.</li>
              <li>정확한 부위 및 통증 정보를 입력하여 적절한 코스를 제공받아야 합니다.</li>
              <li>타인의 리뷰 작성 시 허위 정보를 기재하지 않아야 합니다.</li>
            </ul>
          </section>

          {/* 서비스 이용 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제4조 (서비스 이용)</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>서비스 이용을 위해 회원가입이 필요할 수 있습니다.</li>
              <li>일부 기능(위치 기반 헬스장 검색)은 위치 정보 제공 동의가 필요합니다.</li>
              <li>서비스는 사전 통지 없이 변경되거나 중단될 수 있습니다.</li>
            </ul>
          </section>

          {/* 지적재산권 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제5조 (지적재산권)</h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스 내 모든 콘텐츠(운동 코스, 디자인, 로고 등)에 대한 저작권은 REHAB에 귀속됩니다.
              이용자는 개인적 용도 외에 무단 복제, 배포, 수정할 수 없습니다.
            </p>
          </section>

          {/* 약관 변경 */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">제6조 (약관 변경)</h2>
            <p className="text-muted-foreground leading-relaxed">
              본 약관은 서비스 개선을 위해 변경될 수 있으며, 변경 시 서비스 내 공지를 통해 안내합니다.
              변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.
            </p>
          </section>

          {/* 시행일 */}
          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              본 약관은 2026년 1월 11일부터 시행됩니다.
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
