"use client";

import { useRole, ROLES } from "@/components/providers/role-provider";

export function RoleSelector(): React.ReactElement {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center gap-2" data-testid="role-selector">
      <label
        htmlFor="role-select"
        className="text-sm text-text-secondary"
      >
        Role:
      </label>
      <select
        id="role-select"
        value={role}
        onChange={(e) => setRole(e.target.value as typeof role)}
        className="rounded-md border border-card-border bg-surface-editor px-3 py-1.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        data-testid="role-select"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}
