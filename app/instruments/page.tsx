import { prisma } from "@/lib/prisma/client";
import { Suspense } from "react";

/**
 * Equipment Types 데이터 조회 컴포넌트
 * 
 * Prisma를 사용하여 equipment_types 테이블의 데이터를 조회합니다.
 */
async function EquipmentTypesData() {
  try {
    const equipmentTypes = await prisma.equipmentType.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    if (!equipmentTypes || equipmentTypes.length === 0) {
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">운동 기구 종류가 없습니다.</p>
          <p className="text-yellow-700 text-sm mt-2">
            Prisma Studio에서 equipment_types 테이블에 데이터를 추가해보세요.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {equipmentTypes.map((equipmentType) => (
          <div
            key={equipmentType.id}
            className="p-3 bg-white border rounded-lg shadow-sm"
          >
            <p className="font-medium">{equipmentType.name}</p>
            <p className="text-sm text-gray-500">ID: {equipmentType.id}</p>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-red-800 font-semibold mb-2">Error</h2>
        <p className="text-red-700 text-sm">
          {error instanceof Error ? error.message : "데이터를 불러오는 중 오류가 발생했습니다."}
        </p>
        <p className="text-red-600 text-xs mt-2">
          💡 데이터베이스 연결을 확인하거나 Prisma Studio에서 테이블을 확인해보세요.
        </p>
      </div>
    );
  }
}

export default function Instruments() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">운동 기구 종류</h1>
        <p className="text-gray-600">
          equipment_types 테이블의 데이터를 조회하여 표시합니다.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          💡 Prisma Studio에서 데이터를 추가하거나 수정할 수 있습니다.
        </p>
      </div>

      <Suspense fallback={<div>운동 기구 종류를 불러오는 중...</div>}>
        <EquipmentTypesData />
      </Suspense>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-900">
          💡 이 페이지의 작동 원리
        </h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <code className="bg-blue-100 px-1 rounded">prisma</code> 클라이언트를
            사용하여 데이터베이스에서 데이터 조회
          </li>
          <li>
            Prisma를 통해 equipment_types 테이블의 활성화된 데이터만 조회
          </li>
          <li>
            Server Component에서 비동기로 데이터를 조회합니다
          </li>
          <li>
            <code className="bg-blue-100 px-1 rounded">Suspense</code>를 사용하여
            로딩 상태를 처리합니다
          </li>
        </ul>
      </div>
    </div>
  );
}

