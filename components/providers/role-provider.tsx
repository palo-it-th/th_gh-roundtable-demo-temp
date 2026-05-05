"use client";

import { createContext, useContext, useState } from "react";
import type { Role } from "@/lib/types";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export const ROLES: Role[] = ["Analyst", "Reviewer", "Operations Manager"];

export function RoleProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [role, setRole] = useState<Role>("Analyst");

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
