import type { CaseNote } from "@/lib/types";

interface InvestigationNotesPanelProps {
  notes: CaseNote[];
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  CUSTOMER_PROFILE_REVIEW: "Customer Profile Review",
  TRANSACTION_REVIEW: "Transaction Review",
  COUNTERPARTY_REVIEW: "Counterparty Review",
  CUSTOMER_OUTREACH: "Customer Outreach",
  DECISION_RATIONALE: "Decision Rationale",
};

export function InvestigationNotesPanel({ notes }: InvestigationNotesPanelProps): React.ReactElement {
  const sorted = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div
      className="rounded-md border border-card-border bg-card p-5"
      data-testid="investigation-notes-panel"
    >
      <h2 className="font-mono text-base font-bold text-text-primary">
        Investigation Notes ({notes.length})
      </h2>
      {sorted.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted" data-testid="notes-empty">No notes yet. Add the first investigation note to begin documenting this case.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map((note) => (
            <div
              key={note.id}
              className="rounded border border-[#1E293B] px-4 py-3"
              data-testid="note-card"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#1E293B] px-2 py-0.5 font-mono text-secondary" data-testid="note-type">
                  {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
                </span>
                <span className="text-text-secondary" data-testid="note-author">{note.author}</span>
                <span className="text-text-muted" data-testid="note-timestamp">
                  {new Date(note.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-text-primary">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
