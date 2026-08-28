export interface AntivirusItem {
  sourceTable: 'class_a_systems' | 'iks';
  sourceId: number;
  systemClass: string; // АС класу 1/2/3 або ІКС класу 1/2/3
  systemName: string;
  subdivisionName: string;
  subdivisionType: string; // підрозділ апарату або територіальний підрозділ
  antivirus: string;
  antivirusOpinionNumber: string | null;
  antivirusOpinionDate: string | null;
  address?: string | null;
}

export interface AntivirusStats {
  total: number;
  byClass: {
    [key: string]: number;
  };
  byDepartmentType: {
    [key: string]: number;
  };
  uniqueAntivirus: string[];
}

export interface AntivirusGroup {
  name: string;
  count: number;
  items: AntivirusItem[];
  opinionNumber: string | null;
  opinionDate: string | null;
}

export interface AntivirusUpdateRequest {
  antivirusName: string;
  opinionNumber: string | null;
  opinionDate: string | null;
}

export interface AntivirusUpdateResponse {
  success: boolean;
  message: string;
  updated: {
    classA: number;
    iks: number;
    total: number;
  };
}
