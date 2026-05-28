import { create } from 'zustand';

export type CycleStatus = 'running' | 'success' | 'fail' | 'rollback' | 'stuck';

export interface ForgeCycle {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: CycleStatus;
  issue: string;
  agentLog: string[];
  durationMinutes?: number;
  auditReportId?: string;
}

export interface AuditReport {
  id: string;
  createdAt: Date;
  content: string;
  voiceDictated: boolean;
  burnInCount: number;
}

interface ForgeStore {
  cycles: ForgeCycle[];
  reports: AuditReport[];
  isStuck: boolean;
  consecutiveFailCount: number;

  addCycle: (cycle: ForgeCycle) => void;
  updateCycle: (id: string, update: Partial<ForgeCycle>) => void;
  addReport: (report: AuditReport) => void;
  checkStuck: () => boolean;
  resetStuck: () => void;
}

export const useForgeStore = create<ForgeStore>((set, get) => ({
  cycles: [],
  reports: [],
  isStuck: false,
  consecutiveFailCount: 0,

  addCycle: (cycle) => set(state => ({
    cycles: [...state.cycles, cycle],
  })),

  updateCycle: (id, update) => set(state => {
    const cycles = state.cycles.map(c =>
      c.id === id ? { ...c, ...update } : c
    );

    // Check consecutive failures
    const sorted = [...cycles].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
    const recent = sorted.slice(0, 2);
    const consecutiveFails = recent.filter(
      c => c.status === 'fail' || c.status === 'rollback'
    ).length;

    const isStuck = consecutiveFails >= 2;

    return {
      cycles,
      consecutiveFailCount: consecutiveFails,
      isStuck,
    };
  }),

  addReport: (report) => set(state => ({
    reports: [...state.reports, report],
  })),

  checkStuck: () => get().isStuck,

  resetStuck: () => set({ isStuck: false, consecutiveFailCount: 0 }),
}));
