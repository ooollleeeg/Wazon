export interface Verification {
  id: number;
  deviceName: string;
  serialNumber: string;
  certificateRegNumber: string;
  verificationDate: string;
  validUntil: string;
  verificationCost: number;
}

export interface EquipmentItem {
  id: number;
  category: string;
  name: string;
  serialNumber: string;
  invertarNumber: string;
  releaseYear: number;
  technicalCondition: string;
  pricePerUnit: string; // Stored as string to preserve precision
  notes: string;
  verifications?: Verification[];
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentStats {
  total: number;
  specialSearch: number;
  measurementControl: number;
  verificationsWarning?: number;
  verificationsCritical?: number;
}
