import React, { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Code2,
  Database,
  FileCode2,
  Gauge,
  History,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Mail,
  Megaphone,
  MessageSquare,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  Search,
  Server,
  ShieldCheck,
  Clock3,
  Timer,
  Trophy,
  Users,
  X
} from "lucide-react";

export type Page =
  | "home"
  | "contests"
  | "service-notices"
  | "rules"
  | "help"
  | "contact"
  | "participant-login"
  | "operator-login"
  | "contest"
  | "problemset"
  | "problem"
  | "submissions"
  | "scoreboard"
  | "board"
  | "judge-status"
  | "operator"
  | "operator-settings"
  | "operator-participants"
  | "operator-problems"
  | "admin"
  | "admin-home"
  | "admin-contests"
  | "admin-judge";
export type RouteState = { page: Page; contestId?: string; problemId?: string };
export type ApiStatus = "loading" | "live" | "offline";
export type Contest = {
  contest_id: string;
  title: string;
  organization_name: string;
  overview: string;
  status: string;
  start_at: string;
  end_at: string;
  freeze_at: string;
  problem_public_after_end: boolean;
  scoreboard_public_after_end: boolean;
  submission_public_after_end: boolean;
  emergency_notice: string | null;
};
export type Division = { division_id: string; code: string; name: string; description: string; display_order?: number };
export type Problem = {
  problem_id: string;
  division_id?: string;
  problem_code: string;
  title: string;
  statement: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  display_order?: number;
  max_score?: number;
  solve_status?: "accepted" | "wrong" | "unsolved";
  solved_team_count?: number;
  total_team_count?: number;
};
export type ProblemAsset = {
  asset_id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  asset_status: string;
  download_url?: string;
};
export type PackageFileRole = "main-solution" | "brute-solution" | "wrong-solution" | "checker" | "validator" | "generator" | "manual-input" | "test-script" | "package-resource" | "interactor";
export type AuthoringTab = "settings" | "statement" | "tests" | "judge" | "preview";
export type ProblemExample = { input: string; output: string; note?: string };
export type ProblemDocument = {
  statement: string;
  inputDescription: string;
  outputDescription: string;
  note: string;
  examples: ProblemExample[];
};
export type MonacoEditorInstance = {
  getValue: () => string;
  setValue: (value: string) => void;
  dispose: () => void;
  layout: () => void;
  updateOptions: (options: Record<string, unknown>) => void;
  onDidChangeModelContent: (listener: () => void) => { dispose: () => void };
  getModel: () => unknown;
};
export type MonacoNamespace = {
  editor: {
    create: (element: HTMLElement, options: Record<string, unknown>) => MonacoEditorInstance;
    setModelLanguage: (model: unknown, language: string) => void;
  };
};
export type MonacoLoader = {
  config?: (options: Record<string, unknown>) => void;
  (deps: string[], onLoad: () => void, onError?: () => void): void;
};
export type MonacoWindow = Window &
  typeof globalThis & {
    monaco?: MonacoNamespace;
    require?: MonacoLoader;
    __zojMonacoLoading?: Promise<MonacoNamespace | null>;
  };
export type Testcase = {
  testcase_id: string;
  display_order: number;
  input_storage_key: string;
  output_storage_key: string;
  input_sha256: string;
  output_sha256: string;
};
export type TestcaseSet = {
  testcase_set_id: string;
  version: number;
  is_active: boolean;
  testcases?: Testcase[];
};
export type PackageSupportFileStatus = {
  role: PackageFileRole;
  label: string;
  required: boolean;
  count: number;
  latest_filename?: string | null;
  status: "ready" | "missing";
};
export type ProblemPackageStatus = {
  ready: boolean;
  warnings: string[];
  support_files: PackageSupportFileStatus[];
  active_testcase_set?: TestcaseSet | null;
  active_testcase_count: number;
  testcase_set_count: number;
};
export type TestcaseDraft = {
  id: string;
  display_order: number;
  input_filename: string;
  output_filename: string;
  input_storage_key: string;
  output_storage_key: string;
  input_sha256: string;
  output_sha256: string;
};
export type ScoreboardRow = {
  rank: number;
  team_name: string;
  division: string | null;
  solved: number;
  penalty?: number | null;
  submission_count: number;
  last_solved_at?: string | null;
  problem_scores: {
    problem_id?: string;
    problem_code: string;
    attempts: number;
    wrong_attempts: number;
    solved: boolean;
    penalty?: number | null;
    solved_at?: string | null;
    best_submission_id?: string | null;
    best_submitted_at?: string | null;
    best_status: string | null;
  }[];
};
export type ScoreboardResponse = { division: Division; frozen: boolean; rows: ScoreboardRow[] };
export type OperatorScoreboardResponse = { frozen_public_view: boolean; operator_live_view: boolean; rows: (ScoreboardRow & { team_id?: string; visible_to_team?: boolean })[] };
export type Submission = {
  submission_id: string;
  problem_id: string;
  division_id?: string;
  language: string;
  status: string;
  awarded_score: number | null;
  submitted_at: string;
  source_code?: string;
  source_code_length?: number;
  compile_message?: string | null;
  judge_message?: string | null;
  failed_testcase_order?: number | null;
  progress_current?: number | null;
  progress_total?: number | null;
  progress_percent?: number | null;
  runtime_ms?: number | null;
  memory_kb?: number | null;
  participant_team_id?: string;
  team_member_id?: string;
  team_name?: string | null;
  member_name?: string | null;
  member_email?: string | null;
};
export type TeamMember = {
  team_member_id?: string;
  role: "leader" | "member";
  name: string;
  email: string;
  active_sessions?: number;
  last_login_at?: string | null;
};
export type TeamMemberDraft = { team_member_id?: string; role?: "leader" | "member"; name: string; email: string };
export type ParticipantTeam = {
  participant_team_id: string;
  contest_id: string;
  division_id: string;
  team_name: string;
  status: string;
  members: TeamMember[];
  division?: Division | null;
  created_at: string;
};
export type ParticipantBulkImportResponse = {
  created: ParticipantTeam[];
  errors: { row: number; team_name: string; message: string }[];
};
export type Notice = { service_notice_id: string; title: string; summary: string; body: string; emergency: boolean; published_at: string };
export type ContestNotice = {
  contest_notice_id: string;
  title: string;
  body: string;
  pinned: boolean;
  emergency: boolean;
  visibility: "public" | "participants";
  published_at: string;
};
export type ContestAnswer = {
  contest_answer_id: string;
  body: string;
  visibility: "public" | "questioner";
  created_by_email?: string | null;
  created_at: string;
};
export type ContestQuestion = {
  contest_question_id: string;
  title: string;
  body: string;
  visibility: "public" | "private";
  team_name?: string | null;
  author_name?: string | null;
  created_at: string;
  answers: ContestAnswer[];
};
export type JudgeStatus = { active_node_count: number; total_running_jobs: number; total_queue_depth: number; allocation_policy: string };
export type AdminJudgeSubmissionEntry = {
  submission: Submission;
  contest?: { contest_id: string; title: string } | null;
  division?: { division_id: string; name: string } | null;
  problem?: { problem_id: string; problem_code: string; title: string; time_limit_ms: number; memory_limit_mb: number } | null;
  team?: { participant_team_id: string; team_name: string } | null;
  member?: { team_member_id: string; name: string; email: string } | null;
  judge_job?: { judge_job_id: string; status: string; queue_position: number; assigned_node_id?: string | null; created_at: string } | null;
  judge_node?: { judge_node_id: string; node_name: string; total_slots: number; free_slots: number; running_job_count: number; last_heartbeat_at: string; schedulable: boolean } | null;
  active_testcase_count: number;
};
export type AdminJudgeDashboard = {
  nodes: Array<{
    judge_node_id: string;
    node_name: string;
    total_slots: number;
    free_slots: number;
    running_job_count: number;
    last_heartbeat_at: string;
    schedulable: boolean;
    is_active: boolean;
    heartbeat_age_seconds: number;
  }>;
  queue: Array<{ judge_job_id: string; submission_id: string; contest_id: string; division_id: string; status: string; queue_position: number; assigned_node_id?: string | null; leased_at?: string | null; created_at: string }>;
  queue_stats?: { pending_count: number; running_count: number; succeeded_count: number };
};
export type ApiPageMeta = {
  limit: number;
  next_cursor: string | null;
  current_cursor?: string | null;
  total_count?: number | null;
};
export type ApiPagePayload<T> = {
  data: T;
  page: ApiPageMeta;
};
export type ApiState = {
  status: ApiStatus;
  contests: Contest[];
  contest?: Contest;
  divisions: Division[];
  notices: Notice[];
  problems: Record<string, Problem[]>;
  scoreboard: ScoreboardRow[];
  submissions: Submission[];
  judgeStatus?: JudgeStatus;
  adminDashboard?: { contest_count: number; pending_jobs: number; mail_queue_pending: number; judge_node_count: number; active_judge_node_count?: number };
  error?: string;
};
export type ParticipantSession = {
  accessToken: string;
  contestId: string;
  team: { team_name: string };
  member: { name: string; email: string };
  division: Division;
};
export type PublicVisibility = {
  problems: boolean;
  scoreboard: boolean;
  submissions: boolean;
};
export type StaffAccount = {
  email: string;
  display_name: string;
  is_service_master: boolean;
  contest_scopes: Record<string, string[]>;
};
export type StaffSession = {
  accessToken: string;
  refreshToken: string;
  staff: StaffAccount;
  defaultRedirect: string;
};
export type GeneralParticipantContest = {
  contest: Contest;
  team: ParticipantTeam;
  member: TeamMember;
  division: Division;
};
export type GeneralOperatorContest = {
  contest: Contest;
  scopes: string[];
};
export type GeneralSession = {
  accessToken: string;
  refreshToken: string;
  account: { email: string; display_name: string };
  participantContests: GeneralParticipantContest[];
  operatorContests: GeneralOperatorContest[];
  operatorSession?: StaffSession | null;
};
export type GeneralSessionApi = {
  access_token?: string;
  refresh_token?: string;
  account: { email: string; display_name: string };
  participant_contests: GeneralParticipantContest[];
  operator_contests: GeneralOperatorContest[];
  operator_session?: { access_token: string; refresh_token: string; staff: StaffAccount; default_redirect: string } | null;
};
export type OperatorDashboard = {
  contest: Contest;
  divisions: Division[];
  operators?: StaffAccount[];
  participant_count: number;
  submission_count: number;
  pending_jobs: number;
  participant_count_by_division: Record<string, number>;
};

export type MathJaxWindow = Window & typeof globalThis & {
  MathJax?: {
    typesetPromise?: (elements?: Element[]) => Promise<void>;
    startup?: { promise?: Promise<void> };
    tex?: unknown;
    svg?: unknown;
  };
  __zojMathJaxLoading?: Promise<void>;
};

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://judge.zerone01.kr/api";
export const OTP_VALID_SECONDS = 300;
export const PARTICIPANT_SESSION_KEY = "zoj.participantSession";
export const GENERAL_SESSION_KEY = "zoj.generalSession";
export const SESSION_SYNC_EVENT = "zoj:session-sync";
export const PROBLEM_META_PREFIX = "<!--ZOJ_META:";
export const CONTEST_STATUS_OPTIONS = ["schedule_tbd", "scheduled", "open", "running", "ended", "finalized", "archived"];
export const PROBLEM_STATEMENT_TEMPLATE = `# 문제 설명

문제 설명을 작성하세요.
`;
export const PROBLEM_INPUT_TEMPLATE = `입력 형식을 작성하세요.

`;
export const PROBLEM_OUTPUT_TEMPLATE = `출력 형식을 작성하세요.
`;
export const PROBLEM_NOTE_TEMPLATE = `필요한 추가 설명을 작성하세요.
`;
export const PACKAGE_FILE_ROLES: { value: PackageFileRole; label: string; detail: string }[] = [
  { value: "main-solution", label: "Main Solution", detail: "공식 출력 생성용 정답 코드" },
  { value: "validator", label: "Validator", detail: "입력 검증 프로그램" },
  { value: "generator", label: "Generator", detail: "입력 생성 프로그램" },
  { value: "checker", label: "Checker", detail: "정답 비교 프로그램" },
  { value: "brute-solution", label: "Brute Solution", detail: "작은 테스트 교차검증용" },
  { value: "wrong-solution", label: "Wrong Solution", detail: "저격 테스트 검증용 오답 코드" },
  { value: "manual-input", label: "Manual Input", detail: "sample/manual 입력 파일" },
  { value: "test-script", label: "Test Script", detail: "테스트 생성 recipe" },
  { value: "package-resource", label: "Package Resource", detail: "testlib.h 등 공유 include 파일" },
  { value: "interactor", label: "Interactor", detail: "인터랙티브 문제용 프로그램" }
];
export const TESTCASE_SUPPORT_FILE_ROLES: PackageFileRole[] = ["package-resource", "validator", "checker"];
export const TEST_SCRIPT_TEMPLATE = `# samples
manual sample1.in
manual sample2.in

# small random
gen_random 1 1 10
gen_random 5 1 10
gen_random 10 1 100

# edge
gen_min
gen_max
gen_same 100000 1
gen_same 100000 1000000000

# performance
gen_random 100000 1 1000000000
gen_reverse 100000
gen_sorted 100000
`;

export function sortProblemsByDisplayOrder(items: Problem[]) {
  return [...items].sort((a, b) => {
    const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
    if (orderDiff) return orderDiff;
    const codeDiff = a.problem_code.localeCompare(b.problem_code);
    if (codeDiff) return codeDiff;
    const titleDiff = a.title.localeCompare(b.title);
    if (titleDiff) return titleDiff;
    return a.problem_id.localeCompare(b.problem_id);
  });
}

export class ApiClientError extends Error {
  status: number;
  code: string;
  requestId?: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, requestId?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

export type ApiRawResponse = { response: Response; payload: any };

export let staffRefreshInFlight: Promise<string | null> | null = null;
export let generalRefreshInFlight: Promise<string | null> | null = null;
export let participantRefreshInFlight: Promise<string | null> | null = null;

export function emitSessionSync() {
  window.dispatchEvent(new Event(SESSION_SYNC_EVENT));
}

export function clearStoredSessionForFailedToken(token: string, path: string) {
  const general = loadStoredGeneralSession();
  let changed = false;
  if (general?.accessToken === token) {
    saveGeneralSession(null);
    changed = true;
  } else if (general?.operatorSession?.accessToken === token) {
    saveGeneralSession({ ...general, operatorSession: null });
    changed = true;
  }

  const participant = loadStoredParticipantSession();
  const contestId = parseContestId(path);
  if (participant?.accessToken === token && (!contestId || !participant.contestId || participant.contestId === contestId)) {
    saveParticipantSession(null);
    changed = true;
  }

  if (changed) emitSessionSync();
}

export function toApiError(response: Response, payload: any) {
  return new ApiClientError(
    response.status,
    payload?.error?.code ?? "request_failed",
    payload?.error?.message ?? `API ${response.status}`,
    payload?.error?.request_id ?? payload?.request_id,
    payload?.error?.details
  );
}

export async function apiFetchRaw(path: string, token?: string, init?: RequestInit): Promise<ApiRawResponse> {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    }
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

export function canAttemptAutoRefresh(path: string) {
  if (!path.startsWith("/")) return false;
  if (path === "/auth/staff/refresh" || path === "/auth/general/refresh") return false;
  if (path === "/auth/general/otp/request" || path === "/auth/general/otp/verify") return false;
  if (path === "/auth/staff/login" || path === "/auth/staff/otp/request" || path === "/auth/staff/otp/verify") return false;
  if (path === "/auth/staff/logout" || path === "/auth/general/logout") return false;
  return true;
}

export function parseContestId(path: string) {
  const match = path.match(/\/contests\/([^/]+)/);
  return match?.[1] ?? null;
}

export function preferredStoredTokenForRequest(path: string, token?: string): string | undefined {
  const general = loadStoredGeneralSession();
  if ((path.startsWith("/operator/") || path.startsWith("/admin/")) && general?.operatorSession?.accessToken) {
    return general.operatorSession.accessToken;
  }
  if ((path === "/auth/general/me" || path.startsWith("/auth/general/")) && general?.accessToken) {
    return general.accessToken;
  }
  const contestId = parseContestId(path);
  const participant = loadStoredParticipantSession();
  if (contestId && participant?.accessToken && (!participant.contestId || participant.contestId === contestId)) {
    return participant.accessToken;
  }
  return token;
}

export function storedReplacementTokenForRequest(token: string, path: string): string | null {
  const general = loadStoredGeneralSession();
  if ((path.startsWith("/operator/") || path.startsWith("/admin/")) && general?.operatorSession?.accessToken && general.operatorSession.accessToken !== token) {
    return general.operatorSession.accessToken;
  }
  if ((path === "/auth/general/me" || path.startsWith("/auth/general/")) && general?.accessToken && general.accessToken !== token) {
    return general.accessToken;
  }
  const contestId = parseContestId(path);
  const participant = loadStoredParticipantSession();
  if (contestId && participant?.accessToken && participant.accessToken !== token && (!participant.contestId || participant.contestId === contestId)) {
    return participant.accessToken;
  }
  if (general?.accessToken && general.accessToken !== token) {
    return general.accessToken;
  }
  return null;
}

export async function refreshOperatorAccessTokenViaGeneralSession(): Promise<string | null> {
  const general = loadStoredGeneralSession();
  if (!general?.accessToken) return null;
  let generalToken = general.accessToken;
  let result = await apiFetchRaw("/auth/general/me", generalToken);
  if (result.response.status === 401 && general.refreshToken) {
    const refreshedGeneral = await refreshGeneralAccessToken(generalToken);
    if (!refreshedGeneral) return null;
    generalToken = refreshedGeneral;
    result = await apiFetchRaw("/auth/general/me", generalToken);
  }
  if (!result.response.ok) return null;
  const next = mapGeneralSession(result.payload.data, loadStoredGeneralSession());
  saveGeneralSession(next);
  emitSessionSync();
  return next.operatorSession?.accessToken ?? null;
}

export async function refreshStaffAccessToken(token: string): Promise<string | null> {
  const general = loadStoredGeneralSession();
  if (general?.operatorSession?.accessToken === token) {
    if (general.accessToken === token) {
      return refreshGeneralAccessToken(token);
    }
    const operatorSession = general.operatorSession;
    if (!operatorSession.refreshToken) return null;
    if (!staffRefreshInFlight) {
      staffRefreshInFlight = (async () => {
        const { response, payload } = await apiFetchRaw("/auth/staff/refresh", undefined, {
          method: "POST",
          body: JSON.stringify({ refresh_token: operatorSession.refreshToken })
        });
        if (!response.ok) return null;
        const refreshed = mapStaffSession({
          ...operatorSession,
          ...payload.data,
          refresh_token: payload.data?.refresh_token ?? operatorSession.refreshToken,
          staff: payload.data?.staff ?? operatorSession.staff,
          default_redirect: payload.data?.default_redirect ?? operatorSession.defaultRedirect
        });
        const nextGeneral: GeneralSession = { ...general, operatorSession: refreshed };
        saveGeneralSession(nextGeneral);
        emitSessionSync();
        return refreshed.accessToken;
      })().finally(() => {
        staffRefreshInFlight = null;
      });
    }
    return staffRefreshInFlight;
  }
  return null;
}

export async function refreshGeneralAccessToken(token: string): Promise<string | null> {
  const general = loadStoredGeneralSession();
  if (!general || general.accessToken !== token || !general.refreshToken) return null;
  if (!generalRefreshInFlight) {
    generalRefreshInFlight = (async () => {
      const { response, payload } = await apiFetchRaw("/auth/general/refresh", undefined, {
        method: "POST",
        body: JSON.stringify({ refresh_token: general.refreshToken })
      });
      if (!response.ok) return null;
      const next = mapGeneralSession(payload.data, general);
      saveGeneralSession(next);
      emitSessionSync();
      return next.accessToken;
    })().finally(() => {
      generalRefreshInFlight = null;
    });
  }
  return generalRefreshInFlight;
}

export async function refreshParticipantAccessToken(token: string, path: string): Promise<string | null> {
  const participant = loadStoredParticipantSession();
  if (!participant || participant.accessToken !== token) return null;
  if (!participantRefreshInFlight) {
    participantRefreshInFlight = (async () => {
      const general = loadStoredGeneralSession();
      if (!general) return null;
      const contestId = participant.contestId || parseContestId(path);
      if (!contestId) return null;
      let generalToken = general.accessToken;
      let sessionResponse = await apiFetchRaw(`/auth/general/contests/${contestId}/participant-session`, generalToken, { method: "POST" });
      if (sessionResponse.response.status === 401) {
        const refreshedGeneral = await refreshGeneralAccessToken(generalToken);
        if (!refreshedGeneral) return null;
        generalToken = refreshedGeneral;
        sessionResponse = await apiFetchRaw(`/auth/general/contests/${contestId}/participant-session`, generalToken, { method: "POST" });
      }
      if (!sessionResponse.response.ok) return null;
      const data = sessionResponse.payload?.data;
      const next: ParticipantSession = {
        accessToken: data.access_token,
        contestId,
        team: data.team,
        member: data.member,
        division: data.division
      };
      saveParticipantSession(next);
      emitSessionSync();
      return next.accessToken;
    })().finally(() => {
      participantRefreshInFlight = null;
    });
  }
  return participantRefreshInFlight;
}

export async function tryRefreshTokenForRequest(token: string, path: string): Promise<string | null> {
  const replacement = storedReplacementTokenForRequest(token, path);
  if (replacement) return replacement;
  const refreshedStaff = await refreshStaffAccessToken(token);
  if (refreshedStaff) return refreshedStaff;
  if (path.startsWith("/operator/") || path.startsWith("/admin/")) {
    const refreshedOperator = await refreshOperatorAccessTokenViaGeneralSession();
    if (refreshedOperator) return refreshedOperator;
  }
  const refreshedGeneral = await refreshGeneralAccessToken(token);
  if (refreshedGeneral) return refreshedGeneral;
  const refreshedParticipant = await refreshParticipantAccessToken(token, path);
  if (refreshedParticipant) return refreshedParticipant;
  return null;
}

export function parseRoute(): RouteState {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { page: "home" };
  if (parts[0] === "contests" && parts.length === 1) return { page: "contests" };
  if (parts[0] === "notices") return { page: "service-notices" };
  if (parts[0] === "rules") return { page: "rules" };
  if (parts[0] === "help") return { page: "help" };
  if (parts[0] === "contact") return { page: "contact" };
  if (parts[0] === "contests" && parts[1] && parts[2] === "login") return { page: "participant-login", contestId: parts[1] };
  if (parts[0] === "contests" && parts[1] && parts[2] === "problems" && parts[3]) return { page: "problem", contestId: parts[1], problemId: parts[3] };
  if (parts[0] === "contests" && parts[1] && parts[2] === "problems") return { page: "problemset", contestId: parts[1] };
  if (parts[0] === "contests" && parts[1] && (parts[2] === "submissions" || parts[2] === "submission")) return { page: "submissions", contestId: parts[1] };
  if (parts[0] === "contests" && parts[1] && parts[2] === "scoreboard") return { page: "scoreboard", contestId: parts[1] };
  if (parts[0] === "contests" && parts[1] && parts[2] === "board") return { page: "board", contestId: parts[1] };
  if (parts[0] === "contests" && parts[1]) return { page: "contest", contestId: parts[1] };
  if (parts[0] === "judge-status") return { page: "judge-status" };
  if (parts[0] === "login") return { page: "operator-login" };
  if (parts[0] === "operator" && parts[1] === "login") return { page: "operator-login" };
  if (parts[0] === "admin" && parts[1] === "login") return { page: "operator-login" };
  if (parts[0] === "admin" && parts[1] === "contests") return { page: "admin-contests" };
  if (parts[0] === "admin" && parts[1] === "judge") return { page: "admin-judge" };
  if (parts[0] === "admin") return { page: "admin-home" };
  if (parts[0] === "operator" && parts[1] === "contests" && parts[2] && parts[3] === "settings") return { page: "operator-settings", contestId: parts[2] };
  if (parts[0] === "operator" && parts[1] === "contests" && parts[2] && parts[3] === "notices") return { page: "operator-settings", contestId: parts[2] };
  if (parts[0] === "operator" && parts[1] === "contests" && parts[2] && parts[3] === "staff") return { page: "operator-settings", contestId: parts[2] };
  if (parts[0] === "operator" && parts[1] === "contests" && parts[2] && parts[3] === "participants") return { page: "operator-participants", contestId: parts[2] };
  if (parts[0] === "operator" && parts[1] === "contests" && parts[2] && parts[3] === "problems") return { page: "operator-problems", contestId: parts[2] };
  if (parts[0] === "operator" && parts[1] === "contests" && parts[2]) return { page: "operator", contestId: parts[2] };
  if (parts[0] === "operator") return { page: "operator" };
  return { page: "home" };
}

export function readPageQuery(defaultPage: number = 1): number {
  const value = new URLSearchParams(window.location.search).get("page");
  if (!value) return defaultPage;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return defaultPage;
  return parsed;
}

export function routePath(route: RouteState) {
  if (route.page === "home") return "/";
  if (route.page === "contests") return "/contests";
  if (route.page === "service-notices") return "/notices";
  if (route.page === "rules") return "/rules";
  if (route.page === "help") return "/help";
  if (route.page === "contact") return "/contact";
  if (route.page === "participant-login") return `/contests/${route.contestId ?? "contest"}/login`;
  if (route.page === "contest") return `/contests/${route.contestId ?? "contest"}`;
  if (route.page === "problemset") return `/contests/${route.contestId ?? "contest"}/problems`;
  if (route.page === "problem") return `/contests/${route.contestId ?? "contest"}/problems/${route.problemId ?? "first"}`;
  if (route.page === "submissions") return `/contests/${route.contestId ?? "contest"}/submissions`;
  if (route.page === "scoreboard") return `/contests/${route.contestId ?? "contest"}/scoreboard`;
  if (route.page === "board") return `/contests/${route.contestId ?? "contest"}/board`;
  if (route.page === "judge-status") return "/judge-status";
  if (route.page === "operator-login") return "/login";
  if (route.page === "admin") return "/admin";
  if (route.page === "operator-settings") return route.contestId ? `/operator/contests/${route.contestId}/settings` : "/operator";
  if (route.page === "operator-participants") return route.contestId ? `/operator/contests/${route.contestId}/participants` : "/operator";
  if (route.page === "operator-problems") return route.contestId ? `/operator/contests/${route.contestId}/problems` : "/operator";
  if (route.page === "operator") return route.contestId ? `/operator/contests/${route.contestId}` : "/operator";
  if (route.page === "admin-home") return "/admin";
  if (route.page === "admin-contests") return "/admin/contests";
  if (route.page === "admin-judge") return "/admin/judge";
  return "/";
}

export function emptyContest(contestId?: string): Contest {
  const now = new Date().toISOString();
  return {
    contest_id: contestId ?? "",
    title: "대회",
    organization_name: "",
    overview: "",
    status: "schedule_tbd",
    start_at: now,
    end_at: now,
    freeze_at: now,
    problem_public_after_end: false,
    scoreboard_public_after_end: false,
    submission_public_after_end: false,
    emergency_notice: null
  };
}

export function emptyDivision(): Division {
  return { division_id: "", code: "", name: "유형 없음", description: "" };
}

export function isContestEnded(contest: Contest) {
  if (contest.status === "schedule_tbd") return false;
  return contest.status === "ended" || contest.status === "archived" || new Date(contest.end_at).getTime() <= Date.now();
}

export function isContestOperationLocked(contest: Contest) {
  if (contest.status === "schedule_tbd") return false;
  const now = Date.now();
  const inTimeWindow = new Date(contest.start_at).getTime() <= now && now < new Date(contest.end_at).getTime() && !["ended", "finalized", "archived"].includes(contest.status);
  return contest.status === "running" || inTimeWindow;
}

export function isScheduleTbd(contestOrStatus: Contest | string) {
  return (typeof contestOrStatus === "string" ? contestOrStatus : contestOrStatus.status) === "schedule_tbd";
}

export function contestStatusLabel(status: string) {
  if (status === "schedule_tbd") return "스케줄 미정";
  return status;
}

export function contestAccessPhase(contest: Contest) {
  if (isScheduleTbd(contest)) return "schedule_tbd";
  const now = Date.now();
  if (now < new Date(contest.start_at).getTime()) return "before";
  if (now >= new Date(contest.end_at).getTime() || ["ended", "finalized", "archived"].includes(contest.status)) return "ended";
  return "running";
}

export function canViewContestResource(contest: Contest, hasSessionAccess: boolean, publicAfterEnd: boolean) {
  if (hasSessionAccess) return true;
  return isContestEnded(contest) && publicAfterEnd;
}

export async function apiRequest<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  let currentToken = preferredStoredTokenForRequest(path, token);
  let result = await apiFetchRaw(path, currentToken, init);
  if (!result.response.ok && result.response.status === 401 && currentToken && canAttemptAutoRefresh(path)) {
    const refreshedToken = await tryRefreshTokenForRequest(currentToken, path);
    if (refreshedToken) {
      currentToken = refreshedToken;
      result = await apiFetchRaw(path, currentToken, init);
    }
  }
  if (!result.response.ok) {
    if (result.response.status === 401 && currentToken && canAttemptAutoRefresh(path)) {
      clearStoredSessionForFailedToken(currentToken, path);
    }
    throw toApiError(result.response, result.payload);
  }
  return result.payload.data as T;
}

export async function apiPageRequest<T>(path: string, token?: string, init?: RequestInit): Promise<ApiPagePayload<T>> {
  let currentToken = preferredStoredTokenForRequest(path, token);
  let result = await apiFetchRaw(path, currentToken, init);
  if (!result.response.ok && result.response.status === 401 && currentToken && canAttemptAutoRefresh(path)) {
    const refreshedToken = await tryRefreshTokenForRequest(currentToken, path);
    if (refreshedToken) {
      currentToken = refreshedToken;
      result = await apiFetchRaw(path, currentToken, init);
    }
  }
  if (!result.response.ok) {
    if (result.response.status === 401 && currentToken && canAttemptAutoRefresh(path)) {
      clearStoredSessionForFailedToken(currentToken, path);
    }
    throw toApiError(result.response, result.payload);
  }
  return {
    data: (result.payload.data ?? []) as T,
    page: (result.payload.page ?? { limit: 20, next_cursor: null, current_cursor: "0", total_count: 0 }) as ApiPageMeta,
  };
}

export function formatApiError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const requestId = error.requestId ? `, request_id: ${error.requestId}` : "";
    return `${fallback}: ${error.message} (${error.code}, HTTP ${error.status}${requestId})`;
  }
  if (error instanceof Error) return `${fallback}: ${error.message}`;
  return fallback;
}

export function formatParticipantTeamError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const field = typeof error.details?.field === "string" ? error.details.field : "";
    if (error.code === "validation_error" && field === "email_conflict") {
      if (error.message.startsWith("participant email already registered:")) {
        return `${error.message} (이미 다른 참가팀의 팀장/팀원으로 등록된 이메일입니다.)`;
      }
      if (error.message.startsWith("participant email cannot be operator/staff account:")) {
        return `${error.message} (운영자/서비스 관리자 계정 이메일은 참가팀으로 등록할 수 없습니다.)`;
      }
      return `${error.message} (팀장/팀원 이메일 중복 또는 권한 충돌이 있습니다.)`;
    }
    return formatApiError(error, fallback);
  }
  return fallback;
}

export function parseProblemDocument(rawStatement: string) {
  const match = rawStatement.match(/^<!--ZOJ_META:(.+?)-->\n?/s);
  if (!match) {
    return {
      statement: rawStatement,
      inputDescription: "",
      outputDescription: "",
      note: "",
      examples: [] as ProblemExample[]
    };
  }
  try {
    const meta = JSON.parse(match[1]) as Partial<ProblemDocument>;
    return {
      statement: rawStatement.slice(match[0].length),
      inputDescription: meta.inputDescription ?? "",
      outputDescription: meta.outputDescription ?? "",
      note: meta.note ?? "",
      examples: Array.isArray(meta.examples) ? meta.examples : []
    };
  } catch {
    return {
      statement: rawStatement,
      inputDescription: "",
      outputDescription: "",
      note: "",
      examples: [] as ProblemExample[]
    };
  }
}

export function serializeProblemDocument(document: ProblemDocument) {
  const statement = document.statement;
  const metaExamples = document.examples.filter((item) => item.input.trim() || item.output.trim() || item.note?.trim());
  const meta = {
    inputDescription: document.inputDescription,
    outputDescription: document.outputDescription,
    note: document.note,
    examples: metaExamples
  };
  const hasMeta = Boolean(
    meta.inputDescription.trim() ||
      meta.outputDescription.trim() ||
      meta.note.trim() ||
      meta.examples.length
  );
  if (!hasMeta) return statement;
  return `${PROBLEM_META_PREFIX}${JSON.stringify(meta)}-->\n${statement}`;
}

export function resolveAssetSource(url: string, assets: ProblemAsset[]) {
  const match = url.match(/^asset:\/\/(.+)$/);
  if (match) return assets.find((asset) => asset.asset_id === match[1])?.download_url ?? "";
  if (/^(https?:|data:|blob:|\/api\/storage\/objects\/)/.test(url)) return url;
  const cleanUrl = decodeURIComponent(url.split(/[?#]/)[0] ?? url).replace(/^\.?\//, "");
  const basename = cleanUrl.split("/").pop() ?? cleanUrl;
  const asset = assets.find((item) => {
    const storageKey = item.storage_key.replace(/^\.?\//, "");
    const storageName = storageKey.split("/").pop() ?? storageKey;
    return item.original_filename === cleanUrl || item.original_filename === basename || storageKey === cleanUrl || storageKey.endsWith(`/${cleanUrl}`) || storageName === basename;
  });
  return asset?.download_url ?? url;
}

export function packageFileRole(asset: ProblemAsset): PackageFileRole | null {
  const matched = PACKAGE_FILE_ROLES.find((role) => asset.storage_key.includes(`/package-files/${role.value}/`));
  return matched?.value ?? null;
}

export function fileStem(filename: string) {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  return base.replace(/\.[^.]+$/, "");
}

export function newTestcaseDraft(displayOrder: number): TestcaseDraft {
  return {
    id: `case-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    display_order: displayOrder,
    input_filename: "",
    output_filename: "",
    input_storage_key: "",
    output_storage_key: "",
    input_sha256: "",
    output_sha256: ""
  };
}

export function isOperatorPage(page: Page) {
  return page === "operator" || page === "operator-settings" || page === "operator-participants" || page === "operator-problems";
}

export function ensureMathJax() {
  const mathWindow = window as MathJaxWindow;
  if (mathWindow.MathJax?.typesetPromise) return Promise.resolve();
  if (mathWindow.__zojMathJaxLoading) return mathWindow.__zojMathJaxLoading;
  mathWindow.MathJax = {
    tex: {
      inlineMath: [["$", "$"], ["\\(", "\\)"]],
      displayMath: [["$$", "$$"], ["\\[", "\\]"]]
    },
    svg: { fontCache: "global" }
  };
  mathWindow.__zojMathJaxLoading = new Promise<void>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-zoj-mathjax="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js";
    script.async = true;
    script.dataset.zojMathjax = "true";
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
  });
  return mathWindow.__zojMathJaxLoading;
}

export function ensureMonaco() {
  const monacoWindow = window as MonacoWindow;
  if (monacoWindow.monaco?.editor) return Promise.resolve(monacoWindow.monaco);
  if (monacoWindow.__zojMonacoLoading) return monacoWindow.__zojMonacoLoading;
  monacoWindow.__zojMonacoLoading = new Promise<MonacoNamespace | null>((resolve) => {
    function boot() {
      const loader = monacoWindow.require;
      if (!loader) {
        resolve(null);
        return;
      }
      loader.config?.({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });
      loader(["vs/editor/editor.main"], () => resolve(monacoWindow.monaco ?? null), () => resolve(null));
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-zoj-monaco="true"]');
    if (existing) {
      existing.addEventListener("load", boot, { once: true });
      existing.addEventListener("error", () => resolve(null), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js";
    script.async = true;
    script.dataset.zojMonaco = "true";
    script.onload = boot;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return monacoWindow.__zojMonacoLoading;
}

export function monacoLanguage(language: string) {
  if (language === "c99") return "c";
  if (language === "cpp17") return "cpp";
  if (language === "python313") return "python";
  if (language === "java8") return "java";
  return "plaintext";
}

export function pageLabel(page: Page) {
  const labels: Record<Page, string> = {
    home: "서비스",
    contests: "대회 목록",
    "service-notices": "공지 안내",
    rules: "규정 안내",
    help: "도움말",
    contact: "문의",
    "participant-login": "일반 로그인",
    "operator-login": "일반 로그인",
    "judge-status": "채점상태",
    contest: "대회 개요",
    problemset: "문제집",
    problem: "문제",
    submissions: "제출",
    scoreboard: "스코어보드",
    board: "게시판",
    operator: "운영 홈",
    "operator-settings": "대회 설정",
    "operator-participants": "참가팀",
    "operator-problems": "문제 관리",
    admin: "관리자",
    "admin-home": "관리 홈",
    "admin-contests": "대회 관리",
    "admin-judge": "채점기 관리"
  };
  return labels[page];
}

export function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseTeamImportFile(text: string, divisions: Division[]) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = lines[0].includes("\t") ? "\t" : ",";
  const headers = splitDelimitedLine(lines[0], delimiter).map((header) => header.toLowerCase().replace(/\s+/g, "").replace(/_/g, ""));
  const findIndex = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const teamIndex = findIndex("teamname", "팀명");
  const divisionIndex = findIndex("division", "divisionname", "참가유형", "유형");
  const leaderNameIndex = findIndex("leadername", "팀장이름", "대표이름");
  const leaderEmailIndex = findIndex("leaderemail", "팀장메일", "팀장이메일", "대표메일", "대표이메일");
  const divisionByKey = new Map<string, string>();
  divisions.forEach((division) => {
    [division.division_id, division.code, division.name].forEach((key) => divisionByKey.set(key.toLowerCase(), division.division_id));
  });
  return lines.slice(1).map((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    const members: TeamMemberDraft[] = [];
    for (let index = 0; index < cells.length; index += 1) {
      const header = headers[index] ?? "";
      const memberMatch = header.match(/(?:member|팀원)(\d+)?(?:name|이름)$/);
      if (!memberMatch) continue;
      const emailHeaderA = header.replace(/(?:name|이름)$/, "email");
      const emailHeaderB = header.replace(/(?:name|이름)$/, "메일");
      const emailIndex = headers.findIndex((item) => item === emailHeaderA || item === emailHeaderB || item === header.replace("name", "email"));
      const name = cells[index]?.trim();
      const email = emailIndex >= 0 ? cells[emailIndex]?.trim() : "";
      if (name && email) members.push({ name, email });
    }
    const divisionKey = cells[divisionIndex]?.trim().toLowerCase() ?? "";
    return {
      team_name: cells[teamIndex]?.trim() ?? "",
      division_id: divisionByKey.get(divisionKey) ?? "",
      leader: { name: cells[leaderNameIndex]?.trim() ?? "", email: cells[leaderEmailIndex]?.trim() ?? "" },
      members
    };
  });
}

export async function sha256Hex(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function readRetryAfterSeconds(error: unknown) {
  if (!(error instanceof ApiClientError)) return 0;
  const value = error.details?.retry_after_seconds;
  return typeof value === "number" && value > 0 ? value : 0;
}

export function useCooldown(cooldownUntil: number) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setNow(Date.now());
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  return Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
}

export function useClockTick() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

export function useAutoRefresh(refresh: (() => Promise<void>) | (() => void), enabled = true, intervalMs = 15000) {
  useEffect(() => {
    if (!enabled) return;
    let pending = false;
    async function runRefresh() {
      if (pending) return;
      pending = true;
      try {
        await refresh();
      } finally {
        pending = false;
      }
    }
    const timer = window.setInterval(() => {
      runRefresh();
    }, intervalMs);
    function onFocus() {
      runRefresh();
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") runRefresh();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh, enabled, intervalMs]);
}

export function loadStoredParticipantSession(): ParticipantSession | null {
  try {
    const raw = window.localStorage.getItem(PARTICIPANT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as ParticipantSession) : null;
  } catch {
    window.localStorage.removeItem(PARTICIPANT_SESSION_KEY);
    return null;
  }
}

export function saveParticipantSession(session: ParticipantSession | null) {
  if (session) {
    window.localStorage.setItem(PARTICIPANT_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(PARTICIPANT_SESSION_KEY);
  }
}

export function mapStaffSession(data: { access_token: string; refresh_token: string; staff: StaffAccount; default_redirect: string }): StaffSession {
  const staff = data?.staff;
  if (!staff || typeof staff.email !== "string" || typeof staff.display_name !== "string" || typeof staff.is_service_master !== "boolean") {
    throw new Error("invalid staff session payload");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    staff: {
      email: staff.email,
      display_name: staff.display_name,
      is_service_master: staff.is_service_master,
      contest_scopes: (staff.contest_scopes ?? {}) as Record<string, string[]>
    },
    defaultRedirect: data.default_redirect
  };
}

export function isValidStaffSession(session: unknown): session is StaffSession {
  const candidate = session as Partial<StaffSession> | null;
  return Boolean(
    candidate &&
      typeof candidate.accessToken === "string" &&
      typeof candidate.refreshToken === "string" &&
      candidate.staff &&
      typeof candidate.staff.email === "string" &&
      typeof candidate.staff.display_name === "string" &&
      typeof candidate.staff.is_service_master === "boolean"
  );
}

export function mapGeneralSession(data: GeneralSessionApi, previous?: GeneralSession | null): GeneralSession {
  const accessToken = data.access_token ?? previous?.accessToken ?? "";
  const refreshToken = data.refresh_token ?? previous?.refreshToken ?? "";
  const legacyOperatorSession = data.operator_session ? mapStaffSession(data.operator_session) : (previous?.operatorSession ?? null);
  const operatorSession = legacyOperatorSession
    ? { ...legacyOperatorSession, accessToken, refreshToken }
    : null;
  return {
    accessToken,
    refreshToken,
    account: data.account,
    participantContests: data.participant_contests ?? [],
    operatorContests: data.operator_contests ?? [],
    operatorSession
  };
}

export function loadStoredGeneralSession(): GeneralSession | null {
  try {
    const raw = window.localStorage.getItem(GENERAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GeneralSession>;
    if (!parsed || typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string" || !parsed.account) {
      window.localStorage.removeItem(GENERAL_SESSION_KEY);
      return null;
    }
    let operatorSession: StaffSession | null | undefined = parsed.operatorSession ?? null;
    if (operatorSession && (!operatorSession.staff || typeof operatorSession.staff.is_service_master !== "boolean")) {
      operatorSession = null;
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      account: parsed.account,
      participantContests: parsed.participantContests ?? [],
      operatorContests: parsed.operatorContests ?? [],
      operatorSession
    } as GeneralSession;
  } catch {
    window.localStorage.removeItem(GENERAL_SESSION_KEY);
    return null;
  }
}

export function saveGeneralSession(session: GeneralSession | null) {
  if (session) {
    window.localStorage.setItem(GENERAL_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(GENERAL_SESSION_KEY);
  }
}

export function useApiData(selectedContestId?: string): ApiState {
  const [state, setState] = useState<ApiState>({
    status: "loading",
    contests: [],
    divisions: [],
    notices: [],
    problems: {},
    scoreboard: [],
    submissions: []
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [contests, notices, judgeStatus] = await Promise.all([
          apiRequest<Contest[]>("/public/contests"),
          apiRequest<Notice[]>("/public/service-notices"),
          apiRequest<JudgeStatus>("/public/judge-status")
        ]);
        let sortedContests = [...contests].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        const detailContestId = selectedContestId ?? sortedContests[0]?.contest_id;
        let detail: { contest: Contest; divisions: Division[] } | null = null;
        if (detailContestId) {
          try {
            detail = await apiRequest<{ contest: Contest; divisions: Division[] }>(`/public/contests/${detailContestId}`);
          } catch (error) {
            if (!(error instanceof ApiClientError && error.status === 404)) throw error;
          }
        }
        if (detail?.contest) {
          sortedContests = sortedContests.map((contest) => contest.contest_id === detail?.contest.contest_id ? detail.contest : contest);
        }
        if (!cancelled) {
          setState({
            status: "live",
            contests: sortedContests,
            contest: detail?.contest,
            divisions: detail?.divisions ?? [],
            notices,
            problems: {},
            scoreboard: [],
            submissions: [],
            judgeStatus
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            status: "offline",
            contests: [],
            contest: undefined,
            divisions: [],
            notices: [],
            problems: {},
            scoreboard: [],
            submissions: [],
            judgeStatus: undefined,
            adminDashboard: undefined,
            error: error instanceof Error ? error.message : "API unavailable"
          });
        }
      }
    }
    load();
    const judgeStatusTimer = window.setInterval(async () => {
      try {
        const judgeStatus = await apiRequest<JudgeStatus>("/public/judge-status");
        if (!cancelled) setState((current) => ({ ...current, judgeStatus }));
      } catch {
        // Keep the last visible judge status if a realtime refresh fails.
      }
    }, 1500);
    const contestDetailTimer = window.setInterval(async () => {
      const contestId = selectedContestId;
      if (!contestId) return;
      try {
        const detail = await apiRequest<{ contest: Contest; divisions: Division[] }>(`/public/contests/${contestId}`);
        if (!cancelled) {
          setState((current) => ({
            ...current,
            contest: detail.contest,
            divisions: detail.divisions,
            contests: current.contests.map((contest) => contest.contest_id === detail.contest.contest_id ? detail.contest : contest)
          }));
        }
      } catch {
        // Keep the last visible contest metadata if a refresh fails.
      }
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(judgeStatusTimer);
      window.clearInterval(contestDetailTimer);
    };
  }, [selectedContestId]);

  return state;
}


export function LoginShell({
  title,
  subtitle,
  children,
  onSubmit
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="loginPage">
      <form className="loginCard" onSubmit={onSubmit ?? ((event) => event.preventDefault())}>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {children}
      </form>
    </section>
  );
}

export function MetricStrip({ api }: { api: ApiState }) {
  return (
    <section className="metricStrip">
      <InfoCard icon={<Trophy />} title="공개 대회" value={String(api.contests.length)} detail="public" />
      <InfoCard icon={<Server />} title="채점 노드" value={String(api.judgeStatus?.active_node_count ?? 0)} detail="active" />
      <InfoCard icon={<Activity />} title="큐" value={String(api.judgeStatus?.total_queue_depth ?? 0)} detail="pending" />
      <InfoCard icon={<CheckCircle2 />} title="지원 언어" value="4" detail="C99/C++17/Python/Java" />
    </section>
  );
}

export function PageHeader({ badge, title, description }: { badge: string; title: string; description: string }) {
  return (
    <header className="pageHeader">
      <span className="eyebrow">{badge}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function PageNotice({ message, status }: { message?: string; status?: "loading" | "ready" | "error" | "idle" }) {
  if (!message) return null;
  const tone = status === "error" || /실패|못했습니다|오류|입력|필요|불가|차단|권한이 없어|없습니다/.test(message)
    ? "error"
    : /중입니다|진행|준비|불러오는/.test(message)
      ? "info"
      : "done";
  return (
    <section className={`pageNotice ${tone}`} role={tone === "error" ? "alert" : "status"}>
      {tone === "error" ? <AlertTriangle size={18} /> : tone === "done" ? <CheckCircle2 size={18} /> : <Activity size={18} />}
      <span>{message}</span>
    </section>
  );
}

export function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="panelTitle">{icon}<h2>{title}</h2></div>;
}

export function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="feature">{icon}<strong>{title}</strong><p>{text}</p></div>;
}

export function InfoCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return <article className="infoCard">{icon}<span>{title}</span><strong>{value}</strong><p>{detail}</p></article>;
}

export function PanelBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return <section className="panel"><PanelTitle icon={icon} title={title} /><List>{items.map((item) => <li key={item}><span>{item}</span></li>)}</List></section>;
}

export function List({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <ul className={className ? `cleanList ${className}` : "cleanList"}>{children}</ul>;
}

export function AuthoringStatementPreview({
  title,
  document,
  assets
}: {
  title: string;
  document: ProblemDocument;
  assets: ProblemAsset[];
}) {
  return (
    <div className="authoringPreviewContent">
      <h1>{title}</h1>
      <MarkdownPreview statement={document.statement} assets={assets} />
      {document.inputDescription.trim() && (
        <section className="statementSection">
          <h2>입력</h2>
          <MarkdownPreview statement={document.inputDescription} assets={assets} />
        </section>
      )}
      {document.outputDescription.trim() && (
        <section className="statementSection">
          <h2>출력</h2>
          <MarkdownPreview statement={document.outputDescription} assets={assets} />
        </section>
      )}
      <ExampleBox examples={document.examples} />
      {document.note.trim() && (
        <section className="statementSection">
          <h2>노트</h2>
          <MarkdownPreview statement={document.note} assets={assets} />
        </section>
      )}
    </div>
  );
}

export function MarkdownPreview({ statement, assets }: { statement: string; assets: ProblemAsset[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lines = statement.split("\n");
  const blocks: React.ReactNode[] = [];
  const paragraphBuffer: string[] = [];
  const listBuffer: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  function flushParagraph(key: string) {
    if (!paragraphBuffer.length) return;
    blocks.push(<p key={key}>{renderInlineMarkdown(paragraphBuffer.join(" "), assets, key)}</p>);
    paragraphBuffer.length = 0;
  }

  function flushList(key: string) {
    if (!listBuffer.length) return;
    blocks.push(<ul key={key}>{listBuffer.map((item, index) => <li key={`${key}-${index}`}>{renderInlineMarkdown(item, assets, `${key}-${index}`)}</li>)}</ul>);
    listBuffer.length = 0;
  }

  function flushCode(key: string) {
    if (!codeBuffer.length) return;
    blocks.push(<pre key={key}>{codeBuffer.join("\n")}</pre>);
    codeBuffer = [];
  }

  lines.forEach((rawLine, index) => {
    const trimmed = rawLine.trimEnd();
    if (trimmed.startsWith("```")) {
      flushParagraph(`p-${index}`);
      flushList(`l-${index}`);
      if (inCodeBlock) flushCode(`c-${index}`);
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      return;
    }
    const line = trimmed.trim();
    if (!line) {
      flushParagraph(`p-${index}`);
      flushList(`l-${index}`);
      return;
    }
    if (line.startsWith("# ")) {
      flushParagraph(`p-${index}`);
      flushList(`l-${index}`);
      blocks.push(<h2 key={`h1-${index}`}>{renderInlineMarkdown(line.slice(2), assets, `h1-${index}`)}</h2>);
      return;
    }
    if (line.startsWith("## ")) {
      flushParagraph(`p-${index}`);
      flushList(`l-${index}`);
      blocks.push(<h2 key={`h2-${index}`}>{renderInlineMarkdown(line.slice(3), assets, `h2-${index}`)}</h2>);
      return;
    }
    if (line.startsWith("### ")) {
      flushParagraph(`p-${index}`);
      flushList(`l-${index}`);
      blocks.push(<h3 key={`h3-${index}`}>{renderInlineMarkdown(line.slice(4), assets, `h3-${index}`)}</h3>);
      return;
    }
    const imageMatch = line.match(/^!\[(.*)\]\((.+)\)$/);
    if (imageMatch) {
      flushParagraph(`p-${index}`);
      flushList(`l-${index}`);
      const src = resolveAssetSource(imageMatch[2], assets);
      if (src) blocks.push(<img key={`img-${index}`} className="statementImage" src={src} alt={imageMatch[1]} />);
      return;
    }
    if (line.startsWith("- ")) {
      flushParagraph(`p-${index}`);
      listBuffer.push(line.slice(2));
      return;
    }
    flushList(`l-${index}`);
    paragraphBuffer.push(line);
  });

  flushParagraph("p-end");
  flushList("l-end");
  flushCode("c-end");

  useEffect(() => {
    let cancelled = false;
    async function typeset() {
      if (!containerRef.current) return;
      await ensureMathJax();
      const mathWindow = window as MathJaxWindow;
      if (!cancelled) {
        await mathWindow.MathJax?.typesetPromise?.([containerRef.current]);
      }
    }
    typeset();
    return () => {
      cancelled = true;
    };
  }, [statement, assets]);

  return (
    <div className="markdownPreview" ref={containerRef}>
      {blocks.length ? blocks : <p>문제 본문이 아직 없습니다.</p>}
    </div>
  );
}

export function renderInlineMarkdown(text: string, assets: ProblemAsset[], keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const imagePattern = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = imagePattern.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const src = resolveAssetSource(match[2], assets);
    nodes.push(src ? <img key={`${keyPrefix}-img-${match.index}`} className="statementImage inline" src={src} alt={match[1]} /> : match[0]);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes.length ? nodes : text;
}

export function ExampleBox({ examples }: { examples: ProblemExample[] }) {
  if (!examples.length) return null;
  return (
    <>
      {examples.map((example, index) => (
        <section className="exampleGrid" key={index}>
          <div>
            <div className="exampleHeader">
              예제 입력 {index + 1}
              <button className="iconButton" onClick={() => navigator.clipboard.writeText(example.input)}><Clipboard size={14} /></button>
            </div>
            <pre>{example.input}</pre>
          </div>
          <div>
            <div className="exampleHeader">
              예제 출력 {index + 1}
              <button className="iconButton" onClick={() => navigator.clipboard.writeText(example.output)}><Clipboard size={14} /></button>
            </div>
            <pre>{example.output}</pre>
          </div>
          {example.note?.trim() && <p className="exampleNote">{example.note}</p>}
        </section>
      ))}
    </>
  );
}

export function Segmented({ options, value, onChange, allLabel }: { options: Division[]; value: string; onChange: (value: string) => void; allLabel?: string }) {
  return (
    <div className="segmented">
      {allLabel && <button className={!value ? "active" : ""} onClick={() => onChange("")}>{allLabel}</button>}
      {options.map((option) => <button key={option.division_id} className={value === option.division_id ? "active" : ""} onClick={() => onChange(option.division_id)}>{option.name}</button>)}
    </div>
  );
}

export function DivisionLock({ division }: { division: Division }) {
  return (
    <div className="divisionLock">
      <Lock size={16} />
      <span>
        참가 유형 고정
        <strong>{division.name}</strong>
      </span>
      <small>팀 로그인 후 문제집, 스코어보드, 제출 현황은 등록된 유형만 표시됩니다.</small>
    </div>
  );
}

export function SettingToggle({ title, detail, checked, onToggle }: { title: string; detail: string; checked: boolean; onToggle: () => void }) {
  return (
    <button className={checked ? "settingToggle active" : "settingToggle"} onClick={onToggle}>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="toggleRail"><span /></span>
    </button>
  );
}

export function ResultCell({
  problemScore
}: {
  problemScore?: { attempts: number; wrong_attempts: number; solved: boolean };
}) {
  if (!problemScore) {
    return <span className="resultCell empty" aria-label="제출 없음" />;
  }
  if (problemScore.solved) {
    const suffix = problemScore.wrong_attempts > 0 ? `+${problemScore.wrong_attempts}` : "✓";
    return <span className="resultCell solved">{suffix}</span>;
  }
  if (problemScore.attempts <= 0) {
    return <span className="resultCell empty" aria-label="제출 없음" />;
  }
  return <span className="resultCell failed">-{problemScore.attempts}</span>;
}

export function ProblemSolveBadge({ status, problem }: { status?: Problem["solve_status"]; problem?: Problem }) {
  if (problem) {
    const solved = Math.max(0, problem.solved_team_count ?? 0);
    const total = Math.max(0, problem.total_team_count ?? 0);
    return <span className="problemSolveBadge accepted">해결 {solved}/{total}팀</span>;
  }
  if (status === "accepted") return <span className="problemSolveBadge accepted">정답</span>;
  if (status === "wrong") return <span className="problemSolveBadge wrong">오답</span>;
  return <span className="problemSolveBadge unsolved">미해결</span>;
}

export function isSubmissionPending(status?: string | null) {
  return ["waiting", "preparing", "judging"].includes(status ?? "");
}

export function isSubmissionTerminal(status?: string | null) {
  return Boolean(status) && !isSubmissionPending(status);
}

export function submissionStatusLabel(status?: string | null) {
  switch (status) {
    case "waiting":
      return "채점 대기 중";
    case "preparing":
      return "채점 준비 중";
    case "judging":
      return "채점 중";
    case "accepted":
      return "맞았습니다";
    case "wrong_answer":
      return "틀렸습니다";
    case "compile_error":
      return "컴파일 에러";
    case "runtime_error":
      return "런타임 에러";
    case "time_limit_exceeded":
      return "시간 초과";
    case "memory_limit_exceeded":
      return "메모리 초과";
    case "output_limit_exceeded":
      return "출력 초과";
    case "presentation_error":
    case "output_format_error":
      return "출력 형식 오류";
    case "system_error":
      return "시스템 에러";
    default:
      return status ?? "미제출";
  }
}

export function submissionStatusTone(status?: string | null) {
  switch (status) {
    case "accepted":
      return "success";
    case "waiting":
    case "preparing":
      return "pending";
    case "judging":
      return "running";
    case "wrong_answer":
    case "time_limit_exceeded":
    case "memory_limit_exceeded":
    case "output_limit_exceeded":
    case "presentation_error":
    case "output_format_error":
      return "danger";
    case "runtime_error":
      return "runtime";
    case "compile_error":
    case "system_error":
      return "neutral";
    default:
      return "neutral";
  }
}

export type SubmissionProgressState = {
  status?: string | null;
  progress_current?: number | null;
  progress_total?: number | null;
  progress_percent?: number | null;
};

export function submissionProgressPercent(submission?: SubmissionProgressState | null) {
  const status = submission?.status;
  const explicitPercent = submission?.progress_percent;
  if (isSubmissionPending(status) && typeof explicitPercent === "number") {
    return Math.max(0, Math.min(100, Math.round(explicitPercent)));
  }
  const current = submission?.progress_current;
  const total = submission?.progress_total;
  if (isSubmissionPending(status) && total && total > 0) {
    return Math.max(0, Math.min(100, Math.round(((current ?? 0) / total) * 100)));
  }
  switch (status) {
    case "waiting":
      return 0;
    case "preparing":
      return 35;
    case "judging":
      return 75;
    case "accepted":
    case "wrong_answer":
    case "compile_error":
    case "runtime_error":
    case "time_limit_exceeded":
    case "memory_limit_exceeded":
    case "output_limit_exceeded":
      return 100;
    default:
      return null;
  }
}

export function submissionProgressText(submission?: SubmissionProgressState | null) {
  const status = submission?.status;
  const current = submission?.progress_current;
  const total = submission?.progress_total;
  const percent = submissionProgressPercent(submission);
  if (!isSubmissionPending(status) || percent === null) return "";
  if (total && total > 0) return `${current ?? 0}/${total} · ${percent}%`;
  return `${percent}%`;
}

export function SubmissionStatusBadge({ submission, compact = false }: { submission?: SubmissionProgressState | null; compact?: boolean }) {
  const status = submission?.status;
  const tone = submissionStatusTone(status);
  const pending = isSubmissionPending(status);
  const progressText = submissionProgressText(submission);
  return (
    <span className={compact ? "submissionVerdict compact" : "submissionVerdict"}>
      <span className={`submissionVerdictPill ${tone}`}>
        {submissionStatusLabel(status)}
      </span>
      {pending && progressText && (
        <span className="submissionProgressWrap">
          <span className="submissionProgressLabel">{progressText}</span>
          <span className="submissionProgressBar" aria-hidden="true">
            <span className={tone} style={{ width: `${submissionProgressPercent(submission) ?? 0}%` }} />
          </span>
        </span>
      )}
    </span>
  );
}

export function DataTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <table>
      <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function SimplePagination({
  page,
  totalPages,
  onChange
}: {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
}) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const buttons = [];
  for (let index = start; index <= end; index += 1) buttons.push(index);
  return (
    <nav className="simplePagination" aria-label="pagination">
      <button className="secondary" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>이전</button>
      {buttons.map((value) => (
        <button key={value} className={value === page ? "active" : "secondary"} onClick={() => onChange(value)}>
          {value}
        </button>
      ))}
      <button className="secondary" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>다음</button>
    </nav>
  );
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatRelativeTime(value?: string) {
  if (!value) return "-";
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diffSeconds < 60) return `${diffSeconds}초 전`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

export function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function dateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function dateTimeLocalValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function dateTimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}

export function formatTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatContestMoment(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  const now = new Date();
  const time = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  if (isSameLocalDay(date, now)) return time;
  const day = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(date).replace(/\s/g, "");
  return `${day} ${time}`;
}

export function timeLeft(endAt: string) {
  const diff = Math.max(0, new Date(endAt).getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
}

export function contestRemainingLabel(contest: Contest) {
  const phase = contestAccessPhase(contest);
  if (phase === "schedule_tbd") return "일정 미정";
  if (phase === "before") return `시작까지 ${timeLeft(contest.start_at)}`;
  if (phase === "ended") return "종료됨";
  return `종료까지 ${timeLeft(contest.end_at)}`;
}

export function problemVisibilityMessage(contest: Contest, hasSessionAccess: boolean, publicAfterEnd: boolean) {
  if (hasSessionAccess || (isContestEnded(contest) && publicAfterEnd)) return undefined;
  const phase = contestAccessPhase(contest);
  if (phase === "schedule_tbd") return "대회 일정이 아직 확정되지 않아 문제집이 비공개 상태입니다.";
  if (phase === "before") return "대회 시작 전이라 문제집이 비공개 상태입니다.";
  if (phase === "ended") return "대회가 종료되어 문제집이 비공개 상태입니다. 운영자가 종료 후 문제 공개를 켜면 열람할 수 있습니다.";
  return "대회 중에는 참가팀 로그인 후 본인 참가 유형의 문제집만 볼 수 있습니다.";
}

export function participantProblemEmptyMessage(contest: Contest, hasSessionAccess: boolean, publicAfterEnd: boolean) {
  const phase = contestAccessPhase(contest);
  if (phase === "schedule_tbd") return "대회 일정이 아직 확정되지 않아 문제집이 공개되지 않았습니다.";
  if (phase === "before") return "대회 시작 전이라 문제집이 아직 공개되지 않았습니다.";
  if (phase === "ended" && !publicAfterEnd) return "대회가 종료되어 문제집이 비공개 상태입니다.";
  if (!hasSessionAccess) return "문제집을 보려면 참가팀 로그인이 필요합니다.";
  return undefined;
}

export function parseJudgeDetail(message?: string | null) {
  if (!message) return { caseFiles: "", inputText: "", expectedText: "", actualText: "" };
  const caseFiles = message.match(/^testcase\s+#\d+\s*\(([^)]+)\):/i)?.[1] ?? "";
  const inputText = message.match(/\[input\]\n([\s\S]*?)\n\[expected\]\n/)?.[1]?.trim() ?? "";
  const expectedText = message.match(/\[expected\]\n([\s\S]*?)\n\[actual\]\n/)?.[1]?.trim() ?? "";
  const actualText = message.match(/\[actual\]\n([\s\S]*)$/)?.[1]?.trim() ?? "";
  return { caseFiles, inputText, expectedText, actualText };
}

export function encodeStorageKey(storageKey: string) {
  return storageKey.split("/").map((part) => encodeURIComponent(part)).join("/");
}

export function isFrozen(contest: Contest) {
  const now = Date.now();
  return now >= new Date(contest.freeze_at).getTime() && now < new Date(contest.end_at).getTime();
}

export function freezeAnnouncement(contest: Contest) {
  if (isScheduleTbd(contest)) return "";
  const now = Date.now();
  const freezeAt = new Date(contest.freeze_at).getTime();
  const endAt = new Date(contest.end_at).getTime();
  if (now >= freezeAt && now < endAt) {
    return "스코어보드 프리즈가 시작되었습니다. 공개 스코어보드는 프리즈 시점 순위만 표시됩니다.";
  }
  const diffMinutes = Math.ceil((freezeAt - now) / 60000);
  if (diffMinutes <= 0 || diffMinutes > 30) return "";
  const threshold = diffMinutes <= 1 ? 1 : diffMinutes <= 5 ? 5 : diffMinutes <= 10 ? 10 : 30;
  return `스코어보드 프리즈 ${threshold}분 전입니다. 프리즈 이후 공개 스코어보드는 프리즈 시점 순위만 표시됩니다.`;
}

export function contestEndAnnouncement(contest: Contest) {
  if (isScheduleTbd(contest)) return "";
  const endAt = new Date(contest.end_at).getTime();
  if (Date.now() >= endAt || ["ended", "finalized", "archived"].includes(contest.status)) {
    return "대회가 종료되었습니다. 더 이상 제출할 수 없습니다.";
  }
  const diffMinutes = Math.ceil((endAt - Date.now()) / 60000);
  if (diffMinutes <= 0 || diffMinutes > 30) return "";
  const threshold = diffMinutes <= 1 ? 1 : diffMinutes <= 5 ? 5 : diffMinutes <= 10 ? 10 : 30;
  return `대회 종료 ${threshold}분 전입니다. 종료 후에는 제출할 수 없습니다.`;
}
