import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, Home, ShoppingBag } from "lucide-react";

/**
 * 404 페이지
 * 
 * 존재하지 않는 페이지에 접근했을 때 표시됩니다.
 */
export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Search className="h-24 w-24 mx-auto text-gray-300 mb-4" />
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-8">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/">
            <Button size="lg" className="w-full sm:w-auto">
              <Home className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <ShoppingBag className="h-4 w-4 mr-2" />
              상품 보러가기
            </Button>
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>다음 페이지들을 확인해보세요:</p>
          <div className="mt-4 flex flex-wrap gap-4 justify-center">
            <Link href="/products" className="text-blue-600 hover:underline">
              상품 목록
            </Link>
            <Link href="/categories" className="text-blue-600 hover:underline">
              카테고리
            </Link>
            <Link href="/cart" className="text-blue-600 hover:underline">
              장바구니
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

