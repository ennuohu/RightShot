export type TrialStatus = 'not_applied' | 'pending' | 'approved' | 'tester' | 'rejected';

export type TrialProfile = {
  fullName: string;
  companyName: string;
  roleTitle: string;
  useCase: string;
  trialStatus: TrialStatus;
  accessRole: 'user' | 'admin';
};

export type TrialApplicationRecord = {
  id: string;
  email: string;
  fullName: string;
  companyName: string;
  roleTitle: string;
  useCase: string;
  trialStatus: TrialStatus;
  accessRole: 'user' | 'admin';
  trialSubmittedAt: string | null;
  updatedAt: string;
};
