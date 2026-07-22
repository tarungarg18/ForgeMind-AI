"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Ctx = {
  equipmentId: string | null;
  setEquipmentId: (id: string | null) => void;
};

const EquipmentContext = createContext<Ctx | null>(null);

export function EquipmentProvider({ children }: { children: React.ReactNode }) {
  const [equipmentId, setEquipmentId] = useState<string | null>("eq-p102");
  const value = useMemo(() => ({ equipmentId, setEquipmentId }), [equipmentId]);
  return <EquipmentContext.Provider value={value}>{children}</EquipmentContext.Provider>;
}

export function useEquipment() {
  const ctx = useContext(EquipmentContext);
  if (!ctx) throw new Error("useEquipment must be used within EquipmentProvider");
  return ctx;
}
