export type IntakeSource = "web" | "sheet";

export type TaskStatus =
  | "queued"
  | "scraping"
  | "generating"
  | "reviewing"
  | "publishing"
  | "published"
  | "failed";

export const TASK_STATUS_FLOW: TaskStatus[] = [
  "queued",
  "scraping",
  "generating",
  "reviewing",
  "publishing",
  "published",
];

export interface Task {
  id: string;
  source: IntakeSource;
  sheetRowId: string | null;
  keyword: string;
  geo: string;
  language: string;
  brand: string;
  contentType: string;
  status: TaskStatus;
  outputUrl: string | null;
  createdAt: string;
  statusUpdatedAt: string;
}

export interface NewTaskInput {
  source: IntakeSource;
  sheetRowId?: string | null;
  keyword: string;
  geo: string;
  language: string;
  brand: string;
  contentType: string;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  scope: string;
}
