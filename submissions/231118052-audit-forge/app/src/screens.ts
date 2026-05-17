export type ScreenModel = {
  title: string;
  description: string;
  cardTitle: string;
  cardBody: string;
  bullets: string[];
};

export const screens = {
  capture: {
    title: 'Capture',
    description: 'Three lightweight routes, one audit primitive, and no hidden customer data.',
    cardTitle: 'Issue capture checklist',
    cardBody: 'Open the audit button, draw one yellow selection, and keep the note short enough for the repair loop.',
    bullets: ['One visible problem per report', 'One screenshot with immutable burn-in', 'One concise customer note'],
  },
  reports: {
    title: 'Reports',
    description: 'Export-ready notes stay small, shareable, and coding-agent friendly.',
    cardTitle: 'Artifacts waiting to ship',
    cardBody: 'Markdown stays the default because it is easy for humans to read and easy for an agent to consume.',
    bullets: ['Markdown for the repair loop', 'DOCX for review handoff', 'Local storage only'],
  },
  forge: {
    title: 'Forge',
    description: 'The repair loop advances only when each hypothesis survives a focused test.',
    cardTitle: 'Ratchet status',
    cardBody: 'A failed hypothesis is retained as evidence instead of disappearing from the story.',
    bullets: ['READ -> LOCATE -> REPAIR', 'TEST -> VERIFY -> COMMIT', 'Rollback when evidence says no'],
  },
} satisfies Record<string, ScreenModel>;

