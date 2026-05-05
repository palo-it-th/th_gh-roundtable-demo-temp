interface RiskScoreBadgeProps {
  score: number;
}

function getRiskBand(score: number): { label: string; className: string } {
  if (score >= 76) return { label: "Critical", className: "bg-[#2D1215] text-error" };
  if (score >= 51) return { label: "High", className: "bg-[#2D1215] text-error" };
  if (score >= 26) return { label: "Medium", className: "bg-[#1E293B] text-tertiary" };
  return { label: "Low", className: "bg-[#0F2E1F] text-primary" };
}

export function RiskScoreBadge({ score }: RiskScoreBadgeProps): React.ReactElement {
  const { label, className } = getRiskBand(score);

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${className}`}
      data-testid="risk-score-badge"
    >
      <span>{score}</span>
      <span className="text-[10px] opacity-75">({label})</span>
    </span>
  );
}
