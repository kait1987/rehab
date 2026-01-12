/**
 * ENG-S2-02: Body Part Hierarchy Types/Helpers
 * 
 * 부위 계층 구조를 위한 타입 정의 및 유틸리티 함수
 */

// 부위 노드 타입
export interface BodyPartNode {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  synonyms: string[];
  displayOrder: number;
  isActive: boolean;
  children?: BodyPartNode[];
}

// 플랫 부위 데이터 (DB에서 조회한 형태)
export interface FlatBodyPart {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  synonyms: string[];
  displayOrder: number;
  isActive: boolean;
}

// 시드 입력 형식
export interface BodyPartSeedInput {
  name: string;
  parentName?: string; // 상위 부위 이름 (없으면 대분류)
  level: 1 | 2 | 3;
  synonyms?: string[];
  displayOrder?: number;
}

/**
 * 플랫 배열을 트리 구조로 변환
 */
export function buildBodyPartTree(flatParts: FlatBodyPart[]): BodyPartNode[] {
  const partMap = new Map<string, BodyPartNode>();
  const roots: BodyPartNode[] = [];

  // 먼저 모든 노드를 맵에 추가
  flatParts.forEach(part => {
    partMap.set(part.id, { ...part, children: [] });
  });

  // 부모-자식 관계 구성
  flatParts.forEach(part => {
    const node = partMap.get(part.id)!;
    if (part.parentId && partMap.has(part.parentId)) {
      partMap.get(part.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // displayOrder로 정렬
  const sortByOrder = (a: BodyPartNode, b: BodyPartNode) => 
    a.displayOrder - b.displayOrder;

  const sortTree = (nodes: BodyPartNode[]): BodyPartNode[] => {
    nodes.sort(sortByOrder);
    nodes.forEach(n => {
      if (n.children && n.children.length > 0) {
        n.children = sortTree(n.children);
      }
    });
    return nodes;
  };

  return sortTree(roots);
}

/**
 * 트리를 플랫 배열로 변환 (DFS 순서)
 */
export function flattenBodyPartTree(tree: BodyPartNode[]): BodyPartNode[] {
  const result: BodyPartNode[] = [];
  
  const traverse = (nodes: BodyPartNode[]) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  
  traverse(tree);
  return result;
}

/**
 * 동의어로 부위 찾기
 */
export function findBodyPartBySynonym(
  parts: FlatBodyPart[],
  searchTerm: string
): FlatBodyPart | undefined {
  const lowerSearch = searchTerm.toLowerCase();
  
  return parts.find(part => 
    part.name.toLowerCase() === lowerSearch ||
    part.synonyms.some(syn => syn.toLowerCase() === lowerSearch)
  );
}

/**
 * 부위의 모든 하위 부위 ID 가져오기
 */
export function getAllChildIds(
  partId: string,
  flatParts: FlatBodyPart[]
): string[] {
  const childIds: string[] = [];
  
  const traverse = (currentId: string) => {
    flatParts
      .filter(p => p.parentId === currentId)
      .forEach(child => {
        childIds.push(child.id);
        traverse(child.id);
      });
  };
  
  traverse(partId);
  return childIds;
}

/**
 * 부위의 모든 상위 부위 ID 가져오기
 */
export function getAllParentIds(
  partId: string,
  flatParts: FlatBodyPart[]
): string[] {
  const parentIds: string[] = [];
  const partMap = new Map(flatParts.map(p => [p.id, p]));
  
  let current = partMap.get(partId);
  while (current && current.parentId) {
    parentIds.push(current.parentId);
    current = partMap.get(current.parentId);
  }
  
  return parentIds;
}
