import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home, Navigation, HeartPulse, Timer } from "lucide-react";

/**
 * 404 페이지 (완전 정적 페이지)
 * 
 * 존재하지 않는 페이지에 접근했을 때 표시됩니다.
 * REHAB 앱의 주요 기능으로 안내합니다.
 * 
 * 주의: Clerk 컴포넌트를 사용하지 않아 prerender 시 안전합니다.
 */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Search className="h-24 w-24 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
          <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
          <h2 className="text-2xl font-semibold mb-4 text-foreground">페이지를 찾을 수 없습니다</h2>
          <p className="text-muted-foreground mb-8 text-base leading-relaxed">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.<br />
            안전한 회복을 위해 다시 시작해보세요.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/">
            <Button 
              size="lg" 
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl bg-primary hover:bg-primary-hover text-white transition-all duration-300 shadow-xl hover:shadow-2xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5"
            >
              <Home className="h-4 w-4 mr-2" strokeWidth={1.5} />
              홈으로 돌아가기
            </Button>
          </Link>
          <Link href="/gyms">
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full sm:w-auto text-lg px-8 py-6 rounded-2xl bg-secondary hover:bg-secondary-hover text-secondary-foreground border-2 border-secondary-dark/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5"
            >
              <Navigation className="h-4 w-4 mr-2" strokeWidth={1.5} />
              헬스장 찾기
            </Button>
          </Link>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-4">다음 페이지들을 확인해보세요:</p>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <Link 
              href="/gyms" 
              className="text-primary hover:text-primary-hover hover:underline transition-colors duration-200 flex items-center gap-1"
            >
              <Navigation className="h-4 w-4" strokeWidth={1.5} />
              헬스장 찾기
            </Link>
            <Link 
              href="/courses/new" 
              className="text-primary hover:text-primary-hover hover:underline transition-colors duration-200 flex items-center gap-1"
            >
              <HeartPulse className="h-4 w-4" strokeWidth={1.5} />
              재활 코스 만들기
            </Link>
            <Link 
              href="/courses" 
              className="text-primary hover:text-primary-hover hover:underline transition-colors duration-200 flex items-center gap-1"
            >
              <Timer className="h-4 w-4" strokeWidth={1.5} />
              내 코스
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
