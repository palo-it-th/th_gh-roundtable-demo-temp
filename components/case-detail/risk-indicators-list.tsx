interface RiskIndicatorsListProps {
  indicators: string[];
}

export function RiskIndicatorsList({ indicators }: RiskIndicatorsListProps): React.ReactElement {
  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="risk-indicators-list"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Risk Indicators
      </h2>
      {indicators.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted" data-testid="risk-indicators-empty">No risk indicators.</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {indicators.map((indicator) => (
            <span
              key={indicator}
              className="inline-flex items-center rounded-full bg-[#2D1215] px-3 py-1 font-mono text-xs font-medium text-tertiary"
              data-testid="risk-indicator"
            >
              ⚠ {indicator}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
