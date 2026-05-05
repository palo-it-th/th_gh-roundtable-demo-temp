import type { CustomerType, RiskRating } from "@/lib/types";

interface CustomerProfilePanelProps {
  customer: {
    name: string;
    type: CustomerType;
    riskRating: RiskRating;
    businessActivity: string;
    accountOpenDate: string;
    sourceOfWealth: string;
    nationality: string;
  };
}

const RISK_RATING_STYLES: Record<RiskRating, string> = {
  LOW: "text-primary",
  MEDIUM: "text-tertiary",
  HIGH: "text-error",
};

export function CustomerProfilePanel({ customer }: CustomerProfilePanelProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="customer-profile-panel"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Customer Profile
      </h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-muted">Name</dt>
          <dd className="mt-0.5 text-text-primary">{customer.name}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Type</dt>
          <dd className="mt-0.5 text-text-primary">{customer.type}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Risk Rating</dt>
          <dd className={`mt-0.5 font-medium ${RISK_RATING_STYLES[customer.riskRating]}`}>
            {customer.riskRating}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Nationality</dt>
          <dd className="mt-0.5 text-text-primary">{customer.nationality}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Business Activity</dt>
          <dd className="mt-0.5 text-text-primary">{customer.businessActivity}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Source of Wealth</dt>
          <dd className="mt-0.5 text-text-primary">{customer.sourceOfWealth}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Account Opened</dt>
          <dd className="mt-0.5 text-text-primary">
            {new Date(customer.accountOpenDate).toLocaleDateString()}
          </dd>
        </div>
      </dl>
    </div>
  );
}
