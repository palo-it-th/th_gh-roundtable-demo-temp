interface AlertSummaryPanelProps {
  alertType: string;
  alertReason: string;
  totalAmount: number;
  createdAt: string;
}

export function AlertSummaryPanel({
  alertType,
  alertReason,
  totalAmount,
  createdAt,
}: AlertSummaryPanelProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="alert-summary-panel"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Alert Summary
      </h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-text-muted">Alert Type</dt>
          <dd className="mt-0.5 font-medium text-tertiary">{alertType}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Alert Date</dt>
          <dd className="mt-0.5 text-text-primary">
            {new Date(createdAt).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-text-muted">Total Amount</dt>
          <dd className="mt-0.5 font-mono text-text-primary">
            {new Intl.NumberFormat("th-TH", {
              style: "currency",
              currency: "THB",
            }).format(totalAmount)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-text-muted">Reason</dt>
          <dd className="mt-0.5 text-text-primary">{alertReason}</dd>
        </div>
      </dl>
    </div>
  );
}
