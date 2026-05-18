import type { CaseTransaction } from "@/lib/types";

interface TransactionTimelineProps {
  transactions: CaseTransaction[];
}

const DIRECTION_STYLES = {
  INCOMING: "bg-[#0F2E1F] text-primary",
  OUTGOING: "bg-[#2D1215] text-tertiary",
};

export function TransactionTimeline({ transactions }: TransactionTimelineProps): React.ReactElement {
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="transaction-timeline"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Transactions ({transactions.length})
      </h2>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted" data-testid="transaction-empty">No transactions recorded.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {sorted.map((tx) => (
            <div
              key={tx.id}
              className="flex items-start gap-3 rounded border border-[#1E293B] px-4 py-3 text-sm"
              data-testid="transaction-row"
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-medium ${DIRECTION_STYLES[tx.direction]}`}
                data-testid="transaction-direction"
              >
                {tx.direction === "INCOMING" ? "IN" : "OUT"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-mono font-medium text-text-primary">
                    {new Intl.NumberFormat("th-TH", {
                      style: "currency",
                      currency: tx.currency,
                    }).format(tx.amount)}
                  </span>
                  <span className="text-text-secondary">{tx.counterparty}</span>
                  <span className="text-text-muted">{tx.country}</span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  {tx.purpose} · {new Date(tx.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
