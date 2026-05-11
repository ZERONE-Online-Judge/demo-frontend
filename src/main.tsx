import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
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
  Users
  ,X
} from "lucide-react";
import "./styles.css";

type Page =
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
type RouteState = { page: Page; contestId?: string; problemId?: string };
type ApiStatus = "loading" | "live" | "offline";
type Contest = {
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
type Division = { division_id: string; code: string; name: string; description: string; display_order?: number };
type Problem = {
  problem_id: string;
  division_id?: string;
  problem_code: string;
  title: string;
  statement: string;
  time_limit_ms: number;
  memory_limit_mb: number;
  display_order?: number;
  max_score: number;
};
type ProblemAsset = {
  asset_id: string;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  asset_status: string;
  download_url?: string;
};
type PackageFileRole = "main-solution" | "brute-solution" | "wrong-solution" | "checker" | "validator" | "generator" | "manual-input" | "test-script" | "package-resource" | "interactor";
type AuthoringTab = "settings" | "statement" | "tests" | "judge" | "preview";
type ProblemExample = { input: string; output: string; note?: string };
type ProblemDocument = {
  statement: string;
  inputDescription: string;
  outputDescription: string;
  note: string;
  examples: ProblemExample[];
};
type MonacoEditorInstance = {
  getValue: () => string;
  setValue: (value: string) => void;
  dispose: () => void;
  layout: () => void;
  updateOptions: (options: Record<string, unknown>) => void;
  onDidChangeModelContent: (listener: () => void) => { dispose: () => void };
  getModel: () => unknown;
};
type MonacoNamespace = {
  editor: {
    create: (element: HTMLElement, options: Record<string, unknown>) => MonacoEditorInstance;
    setModelLanguage: (model: unknown, language: string) => void;
  };
};
type MonacoLoader = {
  config?: (options: Record<string, unknown>) => void;
  (deps: string[], onLoad: () => void, onError?: () => void): void;
};
type MonacoWindow = Window &
  typeof globalThis & {
    monaco?: MonacoNamespace;
    require?: MonacoLoader;
    __zojMonacoLoading?: Promise<MonacoNamespace | null>;
  };
type Testcase = {
  testcase_id: string;
  display_order: number;
  input_storage_key: string;
  output_storage_key: string;
  input_sha256: string;
  output_sha256: string;
};
type TestcaseSet = {
  testcase_set_id: string;
  version: number;
  is_active: boolean;
  testcases?: Testcase[];
};
type PackageSupportFileStatus = {
  role: PackageFileRole;
  label: string;
  required: boolean;
  count: number;
  latest_filename?: string | null;
  status: "ready" | "missing";
};
type ProblemPackageStatus = {
  ready: boolean;
  warnings: string[];
  support_files: PackageSupportFileStatus[];
  active_testcase_set?: TestcaseSet | null;
  active_testcase_count: number;
  testcase_set_count: number;
};
type TestcaseDraft = {
  id: string;
  display_order: number;
  input_filename: string;
  output_filename: string;
  input_storage_key: string;
  output_storage_key: string;
  input_sha256: string;
  output_sha256: string;
};
type ScoreboardRow = {
  rank: number;
  team_name: string;
  division: string | null;
  solved: number;
  score: number;
  submission_count: number;
  last_improved_at: string | null;
  problem_scores: {
    problem_code: string;
    score: number;
    max_score: number;
    attempts: number;
    wrong_attempts: number;
    solved: boolean;
    best_status: string | null;
  }[];
};
type ScoreboardResponse = { division: Division; frozen: boolean; rows: ScoreboardRow[] };
type OperatorScoreboardResponse = { frozen_public_view: boolean; operator_live_view: boolean; rows: (ScoreboardRow & { team_id?: string; visible_to_team?: boolean })[] };
type Submission = {
  submission_id: string;
  problem_id: string;
  division_id?: string;
  language: string;
  status: string;
  awarded_score: number | null;
  submitted_at: string;
  source_code?: string;
  compile_message?: string | null;
  judge_message?: string | null;
  failed_testcase_order?: number | null;
  progress_current?: number | null;
  progress_total?: number | null;
  participant_team_id?: string;
  team_member_id?: string;
  team_name?: string | null;
  member_name?: string | null;
  member_email?: string | null;
};
type TeamMember = {
  team_member_id?: string;
  role: "leader" | "member";
  name: string;
  email: string;
  active_sessions?: number;
  last_login_at?: string | null;
};
type TeamMemberDraft = { team_member_id?: string; role?: "leader" | "member"; name: string; email: string };
type ParticipantTeam = {
  participant_team_id: string;
  contest_id: string;
  division_id: string;
  team_name: string;
  status: string;
  members: TeamMember[];
  division?: Division | null;
  created_at: string;
};
type ParticipantBulkImportResponse = {
  created: ParticipantTeam[];
  errors: { row: number; team_name: string; message: string }[];
};
type Notice = { service_notice_id: string; title: string; summary: string; body: string; emergency: boolean; published_at: string };
type ContestNotice = {
  contest_notice_id: string;
  title: string;
  body: string;
  pinned: boolean;
  emergency: boolean;
  visibility: "public" | "participants";
  published_at: string;
};
type ContestAnswer = {
  contest_answer_id: string;
  body: string;
  visibility: "public" | "questioner";
  created_by_email?: string | null;
  created_at: string;
};
type ContestQuestion = {
  contest_question_id: string;
  title: string;
  body: string;
  visibility: "public" | "private";
  team_name?: string | null;
  author_name?: string | null;
  created_at: string;
  answers: ContestAnswer[];
};
type JudgeStatus = { active_node_count: number; total_running_jobs: number; total_queue_depth: number; allocation_policy: string };
type AdminJudgeSubmissionEntry = {
  submission: Submission;
  contest?: { contest_id: string; title: string } | null;
  division?: { division_id: string; name: string } | null;
  problem?: { problem_id: string; problem_code: string; title: string; time_limit_ms: number; memory_limit_mb: number; max_score: number } | null;
  team?: { participant_team_id: string; team_name: string } | null;
  member?: { team_member_id: string; name: string; email: string } | null;
  judge_job?: { judge_job_id: string; status: string; queue_position: number; assigned_node_id?: string | null; created_at: string } | null;
  judge_node?: { judge_node_id: string; node_name: string; total_slots: number; free_slots: number; running_job_count: number; last_heartbeat_at: string; schedulable: boolean } | null;
  active_testcase_count: number;
};
type AdminJudgeDashboard = {
  nodes: Array<{ judge_node_id: string; node_name: string; total_slots: number; free_slots: number; running_job_count: number; last_heartbeat_at: string; schedulable: boolean }>;
  queue: Array<{ judge_job_id: string; submission_id: string; contest_id: string; division_id: string; status: string; queue_position: number; assigned_node_id?: string | null; leased_at?: string | null; created_at: string }>;
};
type ApiState = {
  status: ApiStatus;
  contests: Contest[];
  contest?: Contest;
  divisions: Division[];
  notices: Notice[];
  problems: Record<string, Problem[]>;
  scoreboard: ScoreboardRow[];
  submissions: Submission[];
  judgeStatus?: JudgeStatus;
  adminDashboard?: { contest_count: number; pending_jobs: number; mail_queue_pending: number; judge_node_count: number };
  error?: string;
};
type ParticipantSession = {
  accessToken: string;
  contestId: string;
  team: { team_name: string };
  member: { name: string; email: string };
  division: Division;
};
type PublicVisibility = {
  problems: boolean;
  scoreboard: boolean;
  submissions: boolean;
};
type StaffAccount = {
  email: string;
  display_name: string;
  is_service_master: boolean;
  contest_scopes: Record<string, string[]>;
};
type StaffSession = {
  accessToken: string;
  refreshToken: string;
  staff: StaffAccount;
  defaultRedirect: string;
};
type GeneralParticipantContest = {
  contest: Contest;
  team: ParticipantTeam;
  member: TeamMember;
  division: Division;
};
type GeneralOperatorContest = {
  contest: Contest;
  scopes: string[];
};
type GeneralSession = {
  accessToken: string;
  refreshToken: string;
  account: { email: string; display_name: string };
  participantContests: GeneralParticipantContest[];
  operatorContests: GeneralOperatorContest[];
  operatorSession?: StaffSession | null;
};
type GeneralSessionApi = {
  access_token?: string;
  refresh_token?: string;
  account: { email: string; display_name: string };
  participant_contests: GeneralParticipantContest[];
  operator_contests: GeneralOperatorContest[];
  operator_session?: { access_token: string; refresh_token: string; staff: StaffAccount; default_redirect: string } | null;
};
type OperatorDashboard = {
  contest: Contest;
  divisions: Division[];
  operators?: StaffAccount[];
  participant_count: number;
  submission_count: number;
  pending_jobs: number;
  participant_count_by_division: Record<string, number>;
};

type MathJaxWindow = Window & typeof globalThis & {
  MathJax?: {
    typesetPromise?: (elements?: Element[]) => Promise<void>;
    startup?: { promise?: Promise<void> };
    tex?: unknown;
    svg?: unknown;
  };
  __zojMathJaxLoading?: Promise<void>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const OTP_VALID_SECONDS = 300;
const PARTICIPANT_SESSION_KEY = "zoj.participantSession";
const GENERAL_SESSION_KEY = "zoj.generalSession";
const SESSION_SYNC_EVENT = "zoj:session-sync";
const PROBLEM_META_PREFIX = "<!--ZOJ_META:";
const PROBLEM_STATEMENT_TEMPLATE = `# 문제 설명

문제 설명을 작성하세요.
`;
const PROBLEM_INPUT_TEMPLATE = `입력 형식을 작성하세요.

`;
const PROBLEM_OUTPUT_TEMPLATE = `출력 형식을 작성하세요.
`;
const PROBLEM_NOTE_TEMPLATE = `필요한 추가 설명을 작성하세요.
`;
const PACKAGE_FILE_ROLES: { value: PackageFileRole; label: string; detail: string }[] = [
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
const TESTCASE_SUPPORT_FILE_ROLES: PackageFileRole[] = ["package-resource", "validator", "checker"];
const TEST_SCRIPT_TEMPLATE = `# samples
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

class ApiClientError extends Error {
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

type ApiRawResponse = { response: Response; payload: any };

let staffRefreshInFlight: Promise<string | null> | null = null;
let generalRefreshInFlight: Promise<string | null> | null = null;
let participantRefreshInFlight: Promise<string | null> | null = null;

function emitSessionSync() {
  window.dispatchEvent(new Event(SESSION_SYNC_EVENT));
}

function toApiError(response: Response, payload: any) {
  return new ApiClientError(
    response.status,
    payload?.error?.code ?? "request_failed",
    payload?.error?.message ?? `API ${response.status}`,
    payload?.error?.request_id ?? payload?.request_id,
    payload?.error?.details
  );
}

async function apiFetchRaw(path: string, token?: string, init?: RequestInit): Promise<ApiRawResponse> {
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

function canAttemptAutoRefresh(path: string) {
  if (!path.startsWith("/")) return false;
  if (path === "/auth/staff/refresh" || path === "/auth/general/refresh") return false;
  if (path === "/auth/staff/login" || path === "/auth/general/otp/verify" || path === "/auth/staff/otp/verify" || path === "/auth/general/password/login" || path === "/auth/general/password/otp/verify" || path === "/auth/general/login-method") return false;
  if (path === "/auth/general/password/otp/request") return false;
  if (path === "/auth/general/otp/request" || path === "/auth/staff/otp/request") return false;
  if (path === "/auth/staff/logout" || path === "/auth/general/logout") return false;
  return true;
}

function parseContestId(path: string) {
  const match = path.match(/\/contests\/([^/]+)/);
  return match?.[1] ?? null;
}

async function refreshStaffAccessToken(token: string): Promise<string | null> {
  const general = loadStoredGeneralSession();
  if (general?.operatorSession?.accessToken === token) {
    const operatorSession = general.operatorSession;
    if (!operatorSession.refreshToken) return null;
    if (!staffRefreshInFlight) {
      staffRefreshInFlight = (async () => {
        const { response, payload } = await apiFetchRaw("/auth/staff/refresh", undefined, {
          method: "POST",
          body: JSON.stringify({ refresh_token: operatorSession.refreshToken })
        });
        if (!response.ok) return null;
        const refreshed = mapStaffSession(payload.data);
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

async function refreshGeneralAccessToken(token: string): Promise<string | null> {
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

async function refreshParticipantAccessToken(token: string, path: string): Promise<string | null> {
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

async function tryRefreshTokenForRequest(token: string, path: string): Promise<string | null> {
  const refreshedStaff = await refreshStaffAccessToken(token);
  if (refreshedStaff) return refreshedStaff;
  const refreshedGeneral = await refreshGeneralAccessToken(token);
  if (refreshedGeneral) return refreshedGeneral;
  const refreshedParticipant = await refreshParticipantAccessToken(token, path);
  if (refreshedParticipant) return refreshedParticipant;
  return null;
}

function parseRoute(): RouteState {
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
  if (parts[0] === "contests" && parts[1] && parts[2] === "submissions") return { page: "submissions", contestId: parts[1] };
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

function routePath(route: RouteState) {
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

function emptyContest(contestId?: string): Contest {
  const now = new Date().toISOString();
  return {
    contest_id: contestId ?? "",
    title: "대회",
    organization_name: "",
    overview: "",
    status: "scheduled",
    start_at: now,
    end_at: now,
    freeze_at: now,
    problem_public_after_end: false,
    scoreboard_public_after_end: false,
    submission_public_after_end: false,
    emergency_notice: null
  };
}

function emptyDivision(): Division {
  return { division_id: "", code: "", name: "유형 없음", description: "" };
}

function isContestEnded(contest: Contest) {
  return contest.status === "ended" || contest.status === "archived" || new Date(contest.end_at).getTime() <= Date.now();
}

function isContestOperationLocked(contest: Contest) {
  const now = Date.now();
  const inTimeWindow = new Date(contest.start_at).getTime() <= now && now < new Date(contest.end_at).getTime() && !["ended", "finalized", "archived"].includes(contest.status);
  return contest.status === "running" || inTimeWindow;
}

function canViewContestResource(contest: Contest, hasSessionAccess: boolean, publicAfterEnd: boolean) {
  if (hasSessionAccess) return true;
  return isContestEnded(contest) && publicAfterEnd;
}

async function apiRequest<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  let currentToken = token;
  let result = await apiFetchRaw(path, currentToken, init);
  if (!result.response.ok && result.response.status === 401 && currentToken && canAttemptAutoRefresh(path)) {
    const refreshedToken = await tryRefreshTokenForRequest(currentToken, path);
    if (refreshedToken) {
      currentToken = refreshedToken;
      result = await apiFetchRaw(path, currentToken, init);
    }
  }
  if (!result.response.ok) {
    throw toApiError(result.response, result.payload);
  }
  return result.payload.data as T;
}

function formatApiError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    const requestId = error.requestId ? `, request_id: ${error.requestId}` : "";
    return `${fallback}: ${error.message} (${error.code}, HTTP ${error.status}${requestId})`;
  }
  if (error instanceof Error) return `${fallback}: ${error.message}`;
  return fallback;
}

function formatParticipantTeamError(error: unknown, fallback: string) {
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

function parseProblemDocument(rawStatement: string) {
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

function serializeProblemDocument(document: ProblemDocument) {
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

function resolveAssetSource(url: string, assets: ProblemAsset[]) {
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

function packageFileRole(asset: ProblemAsset): PackageFileRole | null {
  const matched = PACKAGE_FILE_ROLES.find((role) => asset.storage_key.includes(`/package-files/${role.value}/`));
  return matched?.value ?? null;
}

function fileStem(filename: string) {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  return base.replace(/\.[^.]+$/, "");
}

function newTestcaseDraft(displayOrder: number): TestcaseDraft {
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

function isOperatorPage(page: Page) {
  return page === "operator" || page === "operator-settings" || page === "operator-participants" || page === "operator-problems";
}

function ensureMathJax() {
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

function ensureMonaco() {
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

function monacoLanguage(language: string) {
  if (language === "c99") return "c";
  if (language === "cpp17") return "cpp";
  if (language === "python313") return "python";
  if (language === "java8") return "java";
  return "plaintext";
}

function pageLabel(page: Page) {
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

function splitDelimitedLine(line: string, delimiter: string) {
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

function parseTeamImportFile(text: string, divisions: Division[]) {
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

async function sha256Hex(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readRetryAfterSeconds(error: unknown) {
  if (!(error instanceof ApiClientError)) return 0;
  const value = error.details?.retry_after_seconds;
  return typeof value === "number" && value > 0 ? value : 0;
}

function useCooldown(cooldownUntil: number) {
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

function useClockTick() {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return now;
}

function useAutoRefresh(refresh: (() => Promise<void>) | (() => void), enabled = true, intervalMs = 15000) {
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

function loadStoredParticipantSession(): ParticipantSession | null {
  try {
    const raw = window.localStorage.getItem(PARTICIPANT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as ParticipantSession) : null;
  } catch {
    window.localStorage.removeItem(PARTICIPANT_SESSION_KEY);
    return null;
  }
}

function saveParticipantSession(session: ParticipantSession | null) {
  if (session) {
    window.localStorage.setItem(PARTICIPANT_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(PARTICIPANT_SESSION_KEY);
  }
}

function mapStaffSession(data: { access_token: string; refresh_token: string; staff: StaffAccount; default_redirect: string }): StaffSession {
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

function mapGeneralSession(data: GeneralSessionApi, previous?: GeneralSession | null): GeneralSession {
  return {
    accessToken: data.access_token ?? previous?.accessToken ?? "",
    refreshToken: data.refresh_token ?? previous?.refreshToken ?? "",
    account: data.account,
    participantContests: data.participant_contests ?? [],
    operatorContests: data.operator_contests ?? [],
    operatorSession: data.operator_session ? mapStaffSession(data.operator_session) : (previous?.operatorSession ?? null)
  };
}

function loadStoredGeneralSession(): GeneralSession | null {
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

function saveGeneralSession(session: GeneralSession | null) {
  if (session) {
    window.localStorage.setItem(GENERAL_SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(GENERAL_SESSION_KEY);
  }
}

function useApiData(selectedContestId?: string): ApiState {
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
        const sortedContests = [...contests].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
        const detailContestId = selectedContestId ?? sortedContests[0]?.contest_id;
        const detail = detailContestId
          ? await apiRequest<{ contest: Contest; divisions: Division[] }>(`/public/contests/${detailContestId}`)
          : null;
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
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(judgeStatusTimer);
    };
  }, [selectedContestId]);

  return state;
}

type ShellFact = { label: string; value: string };
type ShellAction = { label: string; active?: boolean; onClick: () => void };

function AppShell({
  api,
  page,
  contest,
  division,
  participant,
  generalParticipant,
  generalSession,
  staffSession,
  contestId,
  shellFacts,
  shellActions,
  navigate,
  onStaffLogout,
  onGeneralLogout,
  onParticipantLogout,
  children
}: {
  api: ApiState;
  page: Page;
  contest?: Contest;
  division: Division;
  participant: ParticipantSession | null;
  generalParticipant: GeneralParticipantContest | null;
  generalSession: GeneralSession | null;
  staffSession: StaffSession | null;
  contestId?: string;
  shellFacts: ShellFact[];
  shellActions: ShellAction[];
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  onStaffLogout: () => void;
  onGeneralLogout: () => void;
  onParticipantLogout: () => void;
  children: React.ReactNode;
}) {
  const [noticeClosed, setNoticeClosed] = useState(false);
  const modeClass = staffSession
    ? "mode-operator"
    : contest
      ? "mode-participant"
      : "mode-service";
  const emergencyTexts = [
    contest?.emergency_notice?.trim() ?? "",
    contest ? freezeAnnouncement(contest) : "",
    contest ? contestEndAnnouncement(contest) : ""
  ].filter((text) => text.length > 0);

  useEffect(() => {
    setNoticeClosed(false);
  }, [contest?.contest_id]);

  void shellFacts;
  void shellActions;

  return (
    <main className={`publicShell unifiedShell ${modeClass}`}>
      <TopBar
        page={page}
        contest={contest}
        participant={participant}
        generalParticipant={generalParticipant}
        generalSession={generalSession}
        division={division}
        staffSession={staffSession}
        contestId={contestId}
        navigate={navigate}
        onStaffLogout={onStaffLogout}
        onGeneralLogout={onGeneralLogout}
        onParticipantLogout={onParticipantLogout}
      />
      {contest && emergencyTexts.length > 0 && !noticeClosed && (
        <section className="noticeTicker" role="status" aria-live="polite">
          <Megaphone size={16} />
          <div className="noticeTickerViewport">
            <div className="noticeTickerTrack">
              {emergencyTexts.map((text, index) => (
                <span key={`${index}-${text}`}>{text}</span>
              ))}
              {emergencyTexts.map((text, index) => (
                <span key={`clone-${index}-${text}`}>{text}</span>
              ))}
            </div>
          </div>
          <button type="button" className="noticeTickerClose" onClick={() => setNoticeClosed(true)} aria-label="공지 닫기">
            <X size={14} />
          </button>
        </section>
      )}
      <ApiBanner api={api} />
      <div className="publicContent unifiedContent">
        {children}
      </div>
    </main>
  );
}

function App() {
  const [route, setRoute] = useState<RouteState>(() => parseRoute());
  const api = useApiData(route.contestId);
  useClockTick();
  const [divisionId, setDivisionId] = useState("");
  const [problemId, setProblemId] = useState("");
  const [participant, setParticipantState] = useState<ParticipantSession | null>(() => loadStoredParticipantSession());
  const [participantProblems, setParticipantProblems] = useState<Record<string, Problem[]>>({});
  const [generalSession, setGeneralSessionState] = useState<GeneralSession | null>(() => loadStoredGeneralSession());
  const [generalSessionMessage, setGeneralSessionMessage] = useState("");
  const [publicVisibility, setPublicVisibility] = useState<PublicVisibility>({ problems: false, scoreboard: false, submissions: false });

  useEffect(() => {
    function syncSessionsFromStorage() {
      setGeneralSessionState(loadStoredGeneralSession());
      setParticipantState(loadStoredParticipantSession());
    }
    window.addEventListener(SESSION_SYNC_EVENT, syncSessionsFromStorage);
    return () => window.removeEventListener(SESSION_SYNC_EVENT, syncSessionsFromStorage);
  }, []);

  const page = route.page;
  const generalContests = useMemo(() => {
    const byId = new Map<string, Contest>();
    generalSession?.participantContests.forEach((entry) => byId.set(entry.contest.contest_id, entry.contest));
    generalSession?.operatorContests.forEach((entry) => byId.set(entry.contest.contest_id, entry.contest));
    return [...byId.values()];
  }, [generalSession]);
  const resolvedContest = useMemo(
    () => api.contests.find((contest) => contest.contest_id === route.contestId) ?? generalContests.find((contest) => contest.contest_id === route.contestId) ?? (api.contest && (!route.contestId || api.contest.contest_id === route.contestId) ? api.contest : undefined),
    [api.contests, generalContests, api.contest, route.contestId]
  );
  const selectedContest = resolvedContest ?? emptyContest(route.contestId);
  const operatorStaffSession = generalSession?.operatorSession ?? null;
  const activeParticipant = participant?.contestId === selectedContest.contest_id ? participant : null;
  const activeGeneralParticipant = generalSession?.participantContests.find((entry) => entry.contest.contest_id === selectedContest.contest_id) ?? null;
  const activeGeneralOperator = generalSession?.operatorContests.find((entry) => entry.contest.contest_id === selectedContest.contest_id) ?? null;
  const activeDivisionId = activeParticipant?.division.division_id ?? activeGeneralParticipant?.division.division_id ?? divisionId;
  const currentDivision = useMemo(
    () => api.divisions.find((division) => division.division_id === activeDivisionId) ?? activeParticipant?.division ?? activeGeneralParticipant?.division ?? api.divisions[0] ?? emptyDivision(),
    [api.divisions, activeDivisionId, activeParticipant, activeGeneralParticipant]
  );
  const currentProblems = participantProblems[currentDivision.division_id] ?? api.problems[currentDivision.division_id] ?? api.problems[currentDivision.code] ?? [];
  const currentProblem = currentProblems.find((item) => item.problem_id === problemId) ?? currentProblems[0];
  const contestScopedPages: Page[] = ["participant-login", "contest", "problemset", "problem", "submissions", "scoreboard", "board"];
  const isContestArea = contestScopedPages.includes(page) && Boolean(route.contestId);
  const operatorContestScoped = Boolean(activeGeneralOperator && isContestArea && page !== "participant-login");
  const activeStaffSession = operatorStaffSession && (isOperatorPage(page) || page === "admin" || page === "admin-home" || page === "admin-contests" || page === "admin-judge" || operatorContestScoped) ? operatorStaffSession : null;
  const hasParticipantAccess = Boolean(activeParticipant || activeGeneralParticipant);
  const hasContestSessionAccess = Boolean(activeParticipant || activeGeneralParticipant || activeGeneralOperator);
  const canViewProblems = canViewContestResource(selectedContest, hasContestSessionAccess, publicVisibility.problems);
  const canViewScoreboard = canViewContestResource(selectedContest, hasContestSessionAccess, publicVisibility.scoreboard);
  const canViewSubmissions = canViewContestResource(selectedContest, hasContestSessionAccess, publicVisibility.submissions);
  const shellFacts = (() => {
    if (isContestArea || page === "scoreboard" || page === "board" || page === "problem" || page === "problemset" || page === "submissions") {
      return [
        { label: "대회", value: selectedContest.title },
        { label: "유형", value: currentDivision.name },
        { label: "세션", value: activeParticipant ? "참가" : activeGeneralOperator ? "운영" : activeGeneralParticipant ? "참가" : "공개" }
      ];
    }
    if (page === "operator" || isOperatorPage(page)) {
      return [
        { label: "대회", value: route.contestId ? selectedContest.title : "대회 선택 필요" },
        { label: "모드", value: activeStaffSession?.staff.is_service_master ? "서비스 관리자" : "운영자" },
        { label: "권한", value: activeStaffSession?.staff.is_service_master ? "전체" : "제한" }
      ];
    }
    if (page === "admin" || page === "admin-home" || page === "admin-contests" || page === "admin-judge") {
      return [
        { label: "역할", value: "서비스 관리자" },
        { label: "대회", value: String(api.contests.length) },
        { label: "채점", value: String(api.judgeStatus?.active_node_count ?? 0) }
      ];
    }
    return [
      { label: "대회", value: String(api.contests.length) },
      { label: "공지", value: String(api.notices.length) },
      { label: "채점", value: String(api.judgeStatus?.active_node_count ?? 0) }
    ];
  })();
  const shellActions = (() => {
    if (page === "home") {
      return [
        { label: "대회 목록", active: false, onClick: () => navigate("contests") },
        { label: "채점 상태", active: false, onClick: () => navigate("judge-status") }
      ];
    }
    if (page === "contests") {
      return [
        { label: "홈", active: false, onClick: () => navigate("home") },
        { label: "채점 상태", active: false, onClick: () => navigate("judge-status") }
      ];
    }
    if (isContestArea) {
      return [
        { label: "개요", active: page === "contest", onClick: () => navigate("contest", { contestId: selectedContest.contest_id }) },
        { label: "문제집", active: page === "problemset" || page === "problem", onClick: () => navigate("problemset", { contestId: selectedContest.contest_id }) },
        { label: "스코어보드", active: page === "scoreboard", onClick: () => navigate("scoreboard", { contestId: selectedContest.contest_id }) }
      ];
    }
    if (page === "admin" || page === "admin-home" || page === "admin-contests" || page === "admin-judge" || page === "operator" || isOperatorPage(page)) {
      return [
        { label: "운영 홈", active: page === "operator", onClick: () => navigate("operator", { contestId: route.contestId }) },
        { label: "관리자", active: page === "admin-home" || page === "admin-contests" || page === "admin-judge" || page === "admin", onClick: () => navigate("admin-home") },
        { label: "대회 목록", active: false, onClick: () => navigate("contests") }
      ];
    }
    return [];
  })();

  useEffect(() => {
    if (activeParticipant) {
      if (divisionId !== activeParticipant.division.division_id) setDivisionId(activeParticipant.division.division_id);
      return;
    }
    if (activeGeneralParticipant) {
      if (divisionId !== activeGeneralParticipant.division.division_id) setDivisionId(activeGeneralParticipant.division.division_id);
      return;
    }
    if (!api.divisions.length) return;
    const preferred = api.divisions[0];
    if (!api.divisions.some((division) => division.division_id === divisionId)) setDivisionId(preferred.division_id);
  }, [activeParticipant, activeGeneralParticipant, api.divisions, divisionId]);

  useEffect(() => {
    if (currentProblem) setProblemId(currentProblem.problem_id);
  }, [currentDivision.division_id]);

  useEffect(() => {
    if (page === "participant-login" && route.contestId && generalSession) {
      const hasParticipant = generalSession.participantContests.some((entry) => entry.contest.contest_id === route.contestId);
      const hasOperator = generalSession.operatorContests.some((entry) => entry.contest.contest_id === route.contestId);
      navigate(hasOperator && !hasParticipant ? "operator" : "contest", { contestId: route.contestId });
    }
  }, [page, route.contestId, generalSession?.accessToken]);

  useEffect(() => {
    if (!isContestArea || !route.contestId || !generalSession) return;
    if (page !== "contest") return;
    const hasParticipant = Boolean(activeParticipant || activeGeneralParticipant);
    if (hasParticipant) return;
    if (!activeGeneralOperator) return;
    navigate("operator", { contestId: route.contestId });
  }, [isContestArea, route.contestId, generalSession?.accessToken, activeParticipant?.accessToken, activeGeneralParticipant?.contest.contest_id, activeGeneralOperator?.contest.contest_id, page]);

  useEffect(() => {
    if (!route.contestId || !canViewProblems || !["problemset", "problem", "contest"].includes(page)) return;
    let cancelled = false;
    async function loadContestProblems() {
      try {
        if (activeGeneralOperator && operatorStaffSession) {
          const data = await apiRequest<Problem[]>(`/operator/contests/${selectedContest.contest_id}/problems`, operatorStaffSession.accessToken);
          if (!cancelled) {
            const grouped = data.reduce<Record<string, Problem[]>>((groups, item) => {
              const key = item.division_id ?? "";
              if (!groups[key]) groups[key] = [];
              groups[key].push(item);
              return groups;
            }, {});
            setParticipantProblems((current) => ({ ...current, ...grouped }));
            const visible = grouped[currentDivision.division_id] ?? [];
            if (!problemId && visible[0]) setProblemId(visible[0].problem_id);
          }
          return;
        }
        const token = activeParticipant?.accessToken;
        const path = token
          ? `/contests/${selectedContest.contest_id}/problems`
          : `/contests/${selectedContest.contest_id}/divisions/${currentDivision.division_id}/problems`;
        const data = await apiRequest<Problem[]>(path, token);
        if (!cancelled) {
          setParticipantProblems((current) => ({ ...current, [currentDivision.division_id]: data }));
          if (!problemId && data[0]) setProblemId(data[0].problem_id);
        }
      } catch {
        if (!cancelled && activeParticipant) setParticipantProblems((current) => ({ ...current, [activeParticipant.division.division_id]: [] }));
      }
    }
    loadContestProblems();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    route.contestId,
    canViewProblems,
    selectedContest.contest_id,
    currentDivision.division_id,
    activeParticipant?.accessToken,
    activeGeneralOperator?.contest.contest_id,
    operatorStaffSession?.accessToken
  ]);

  useEffect(() => {
    if (route.problemId && route.problemId !== "first") setProblemId(route.problemId);
  }, [route.problemId]);

  useEffect(() => {
    const contest = api.contest ?? api.contests[0];
    if (!contest) return;
    setPublicVisibility({
      problems: contest.problem_public_after_end,
      scoreboard: contest.scoreboard_public_after_end,
      submissions: contest.submission_public_after_end
    });
  }, [api.contest, api.contests]);

  useEffect(() => {
    function onPopState() {
      const nextRoute = parseRoute();
      setRoute(nextRoute);
      if (nextRoute.problemId) setProblemId(nextRoute.problemId);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!generalSession) {
      setGeneralSessionMessage("");
      return;
    }
    const session = generalSession;
    let cancelled = false;
    async function validateGeneralSession() {
      try {
        const data = await apiRequest<GeneralSessionApi>("/auth/general/me", session.accessToken);
        if (!cancelled) {
          setGeneralSession(mapGeneralSession(data, session));
          setGeneralSessionMessage("");
        }
      } catch (error) {
        try {
          const refreshed = await apiRequest<GeneralSessionApi>("/auth/general/refresh", undefined, {
            method: "POST",
            body: JSON.stringify({ refresh_token: session.refreshToken })
          });
          if (!cancelled) {
            setGeneralSession(mapGeneralSession(refreshed, session));
            setGeneralSessionMessage("");
          }
          return;
        } catch {
          // Refresh failure means the persistent general session is no longer usable.
        }
        if (!cancelled) {
          setGeneralSession(null);
          setParticipant(null);
          setParticipantProblems({});
          setGeneralSessionMessage(formatApiError(error, "로그인 세션이 만료되었습니다. 다시 로그인하세요"));
        }
      }
    }
    validateGeneralSession();
    return () => {
      cancelled = true;
    };
  }, [generalSession?.accessToken]);

  useEffect(() => {
    if (!participant) return;
    const session = participant;
    let cancelled = false;
    async function validateParticipantSession() {
      try {
        const data = await apiRequest<{ team: ParticipantSession["team"]; member: ParticipantSession["member"]; division: Division }>(
          `/contests/${session.contestId}/participant-session/me`,
          session.accessToken
        );
        if (!cancelled) {
          setParticipant({
            ...session,
            team: data.team,
            member: data.member,
            division: data.division
          });
        }
      } catch {
        if (!cancelled) {
          setParticipant(null);
          setParticipantProblems({});
        }
      }
    }
    validateParticipantSession();
    return () => {
      cancelled = true;
    };
  }, [participant?.accessToken, participant?.contestId]);

  useEffect(() => {
    if (!generalSession || !activeGeneralParticipant || activeParticipant || !isContestArea || page === "participant-login") return;
    const session = generalSession;
    const contestId = selectedContest.contest_id;
    let cancelled = false;
    async function issueContestParticipantSession() {
      try {
        const data = await apiRequest<{ access_token: string; team: ParticipantSession["team"]; member: ParticipantSession["member"]; division: Division }>(
          `/auth/general/contests/${contestId}/participant-session`,
          session.accessToken,
          { method: "POST" }
        );
        if (!cancelled) {
          setParticipant({ accessToken: data.access_token, contestId, team: data.team, member: data.member, division: data.division });
          setDivisionId(data.division.division_id);
        }
      } catch (error) {
        if (!cancelled) setGeneralSessionMessage(formatApiError(error, "대회 참가 세션 생성 실패"));
      }
    }
    issueContestParticipantSession();
    return () => {
      cancelled = true;
    };
  }, [generalSession?.accessToken, activeGeneralParticipant?.contest.contest_id, activeParticipant?.accessToken, isContestArea, page, selectedContest.contest_id]);

  function navigate(nextPage: Page, options: { contestId?: string; problemId?: string } = {}) {
    const nextRoute: RouteState = {
      page: nextPage,
      contestId: options.contestId ?? route.contestId ?? selectedContest.contest_id,
      problemId: options.problemId
    };
    if (
      nextPage === "home" ||
      nextPage === "contests" ||
      nextPage === "service-notices" ||
      nextPage === "rules" ||
      nextPage === "help" ||
      nextPage === "contact" ||
      nextPage === "judge-status" ||
      nextPage === "operator-login" ||
      nextPage === "admin" ||
      nextPage === "admin-home" ||
      nextPage === "admin-contests" ||
      nextPage === "admin-judge"
    ) {
      delete nextRoute.contestId;
    }
    if (nextPage === "operator" && !options.contestId) {
      delete nextRoute.contestId;
    }
    const path = routePath(nextRoute);
    window.history.pushState(nextRoute, "", path);
    setRoute(nextRoute);
    if (options.problemId) setProblemId(options.problemId);
  }

  function setGeneralSession(session: GeneralSession | null) {
    setGeneralSessionState(session);
    saveGeneralSession(session);
  }

  function setParticipant(session: ParticipantSession | null) {
    setParticipantState(session);
    saveParticipantSession(session);
  }

  async function enterContestAsParticipant(contestId: string, sourceSession: GeneralSession | null = generalSession) {
    if (!sourceSession) {
      navigate("participant-login", { contestId });
      return;
    }
    const membership = sourceSession.participantContests.find((entry) => entry.contest.contest_id === contestId);
    const operatorScope = sourceSession.operatorContests.find((entry) => entry.contest.contest_id === contestId);
    if (!membership) {
      navigate(operatorScope ? "operator" : "contest", { contestId });
      return;
    }
    try {
      const data = await apiRequest<{ access_token: string; team: ParticipantSession["team"]; member: ParticipantSession["member"]; division: Division }>(
        `/auth/general/contests/${contestId}/participant-session`,
        sourceSession.accessToken,
        { method: "POST" }
      );
      setParticipant({ accessToken: data.access_token, contestId, team: data.team, member: data.member, division: data.division });
      setDivisionId(data.division.division_id);
      navigate("contest", { contestId });
    } catch (error) {
      setGeneralSessionMessage(formatApiError(error, "대회 참가 세션 생성 실패"));
      navigate("operator-login");
    }
  }

  async function completeGeneralLogin(session: GeneralSession, preferredContestId?: string) {
    setGeneralSession(session);
    setGeneralSessionMessage("");
    if (preferredContestId) {
      const hasParticipant = session.participantContests.some((entry) => entry.contest.contest_id === preferredContestId);
      const hasOperator = session.operatorContests.some((entry) => entry.contest.contest_id === preferredContestId);
      navigate(hasOperator && !hasParticipant ? "operator" : "contest", { contestId: preferredContestId });
      return;
    }
    if (session.participantContests.length === 0 && session.operatorContests.length === 1) {
      navigate("operator", { contestId: session.operatorContests[0].contest.contest_id });
      return;
    }
    if (session.participantContests.length === 1 && session.operatorContests.length === 0) {
      navigate("contest", { contestId: session.participantContests[0].contest.contest_id });
      return;
    }
    navigate("contests");
  }

  async function logoutGeneral() {
    try {
      if (generalSession) {
        await apiRequest("/auth/general/logout", generalSession.accessToken, {
          method: "POST",
          body: JSON.stringify({ refresh_token: generalSession.refreshToken })
        });
      }
    } finally {
      setGeneralSession(null);
      setParticipant(null);
      setParticipantProblems({});
      navigate("contests");
    }
  }

  return (
    <AppShell
      api={api}
      page={page}
      contest={isContestArea ? selectedContest : undefined}
      division={currentDivision}
      participant={activeParticipant}
      generalParticipant={activeGeneralParticipant}
      generalSession={generalSession}
      staffSession={activeStaffSession}
      contestId={route.contestId}
      shellFacts={shellFacts}
      shellActions={shellActions}
      navigate={navigate}
      onStaffLogout={logoutGeneral}
      onGeneralLogout={logoutGeneral}
      onParticipantLogout={() => {
        setParticipant(null);
        setParticipantProblems({});
        navigate("contest", { contestId: selectedContest.contest_id });
      }}
    >
      {page === "home" && <HomePage api={api} navigate={navigate} generalSession={generalSession} />}
      {page === "contests" && <ContestListPage api={api} navigate={navigate} generalSession={generalSession} enterContestAsParticipant={enterContestAsParticipant} />}
      {page === "service-notices" && <ServiceNoticePage api={api} />}
      {page === "rules" && <ServiceRulesPage />}
      {page === "help" && <ServiceHelpPage />}
      {page === "contact" && <ServiceContactPage />}
      {page === "participant-login" && (
        <GeneralLoginPage
          api={api}
          contest={selectedContest}
          navigate={navigate}
          onLogin={completeGeneralLogin}
          generalSession={generalSession}
          enterContestAsParticipant={enterContestAsParticipant}
          onLogout={logoutGeneral}
          message={generalSessionMessage}
        />
      )}
      {page === "operator-login" && <GeneralLoginPage navigate={navigate} onLogin={completeGeneralLogin} generalSession={generalSession} enterContestAsParticipant={enterContestAsParticipant} onLogout={logoutGeneral} message={generalSessionMessage} />}
      {page === "contest" && <ContestPage api={api} contest={selectedContest} participant={activeParticipant} generalParticipant={activeGeneralParticipant} generalSession={generalSession} navigate={navigate} />}
      {page === "problemset" && (
        canViewProblems ? (
          <ProblemSetPage
            api={api}
            division={currentDivision}
            problems={currentProblems}
            locked={Boolean(activeParticipant || activeGeneralParticipant)}
            setDivisionId={setDivisionId}
            openProblem={(id) => {
              setProblemId(id);
              navigate("problem", { contestId: selectedContest.contest_id, problemId: id });
            }}
          />
        ) : (
          <AccessGate contest={selectedContest} resource="문제집" navigate={navigate} />
        )
      )}
      {page === "problem" && (
        canViewProblems ? (
          <ProblemPage
            api={api}
            contest={selectedContest}
            participant={activeParticipant}
            generalParticipant={activeGeneralParticipant}
            generalSession={generalSession}
            problem={currentProblem}
            problems={currentProblems}
            submissions={api.submissions}
            staffSession={activeGeneralOperator ? operatorStaffSession : null}
            openProblem={(id) => {
              setProblemId(id);
              navigate("problem", { contestId: selectedContest.contest_id, problemId: id });
            }}
            openSubmissions={() => navigate("submissions", { contestId: selectedContest.contest_id })}
          />
        ) : (
          <AccessGate contest={selectedContest} resource="문제" navigate={navigate} />
        )
      )}
      {page === "submissions" && (canViewSubmissions ? <SubmissionsPage api={api} contest={selectedContest} participant={activeParticipant} division={currentDivision} setDivisionId={setDivisionId} staffSession={activeGeneralOperator ? operatorStaffSession : null} /> : <AccessGate contest={selectedContest} resource="제출 현황" navigate={navigate} />)}
      {page === "scoreboard" && (canViewScoreboard ? <ScoreboardPage api={api} contest={selectedContest} participant={activeParticipant} division={currentDivision} locked={Boolean(activeParticipant || activeGeneralParticipant)} staffSession={activeGeneralOperator ? operatorStaffSession : null} setDivisionId={setDivisionId} /> : <AccessGate contest={selectedContest} resource="스코어보드" navigate={navigate} />)}
      {page === "board" && <BoardPage api={api} contest={selectedContest} participant={activeParticipant} staffSession={activeGeneralOperator ? operatorStaffSession : null} />}
      {page === "judge-status" && <JudgeStatusPage api={api} />}
      {page === "operator" && (activeStaffSession ? <OperatorPage contestId={route.contestId} staffSession={activeStaffSession} setDivisionId={setDivisionId} navigate={navigate} onLogout={logoutGeneral} /> : <StaffAccessGate loginPage="operator-login" message={generalSessionMessage} navigate={navigate} />)}
      {page === "operator-settings" && (activeStaffSession ? <OperatorSettingsPage contestId={route.contestId} staffSession={activeStaffSession} navigate={navigate} /> : <StaffAccessGate loginPage="operator-login" message={generalSessionMessage} navigate={navigate} />)}
      {page === "operator-participants" && (activeStaffSession ? <OperatorParticipantsPage contestId={route.contestId} staffSession={activeStaffSession} navigate={navigate} /> : <StaffAccessGate loginPage="operator-login" message={generalSessionMessage} navigate={navigate} />)}
      {page === "operator-problems" && (activeStaffSession ? <OperatorProblemsPage contestId={route.contestId} staffSession={activeStaffSession} navigate={navigate} /> : <StaffAccessGate loginPage="operator-login" message={generalSessionMessage} navigate={navigate} />)}
      {(page === "admin" || page === "admin-home" || page === "admin-contests" || page === "admin-judge") && (
        activeStaffSession
          ? (
              activeStaffSession.staff.is_service_master
                ? (
                    <AdminPage
                      api={api}
                      staffSession={activeStaffSession}
                      navigate={navigate}
                      section={page === "admin-contests" ? "contests" : page === "admin-judge" ? "judge" : "home"}
                    />
                  )
                : <StaffAccessGate loginPage="operator-login" message="서비스 관리자 권한이 필요합니다." navigate={navigate} />
            )
          : <StaffAccessGate loginPage="operator-login" message={generalSessionMessage} navigate={navigate} />
      )}
    </AppShell>
  );
}

function TopBar({
  page,
  contest,
  participant,
  generalParticipant,
  generalSession,
  division,
  staffSession,
  contestId,
  navigate,
  onStaffLogout,
  onGeneralLogout,
  onParticipantLogout
}: {
  page: Page;
  contest?: Contest;
  participant: ParticipantSession | null;
  generalParticipant: GeneralParticipantContest | null;
  generalSession: GeneralSession | null;
  division: Division;
  staffSession: StaffSession | null;
  contestId?: string;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  onStaffLogout: () => void;
  onGeneralLogout: () => void;
  onParticipantLogout: () => void;
}) {
  if (staffSession) {
    return <StaffTopBar page={page} staffSession={staffSession} contestId={contestId} navigate={navigate} onStaffLogout={onStaffLogout} />;
  }
  if (contest) return <ContestTopBar page={page} contest={contest} participant={participant} generalParticipant={generalParticipant} generalSession={generalSession} division={division} navigate={navigate} onParticipantLogout={onParticipantLogout} onGeneralLogout={onGeneralLogout} />;
  return <ServiceTopBar page={page} navigate={navigate} generalSession={generalSession} onGeneralLogout={onGeneralLogout} />;
}

function ServiceTopBar({ page, navigate, generalSession, onGeneralLogout }: { page: Page; navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void; generalSession: GeneralSession | null; onGeneralLogout: () => void }) {
  const nav: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "home", label: "ZOJ홈", icon: <BookOpen size={16} /> },
    { page: "contests", label: "대회", icon: <Trophy size={16} /> },
    { page: "service-notices", label: "공지", icon: <Bell size={16} /> },
    { page: "rules", label: "규정", icon: <ShieldCheck size={16} /> },
    { page: "help", label: "도움말", icon: <HelpCircle size={16} /> },
    { page: "contact", label: "문의", icon: <MessageSquare size={16} /> },
    { page: "judge-status", label: "채점상태", icon: <Activity size={16} /> }
  ];
  return (
    <header className="topbar">
      <button className="brandButton" onClick={() => navigate("home")}>
        <span className="brandMark">Z</span>
        <span>
          <strong>Zerone Online Judge</strong>
          <small>contest platform</small>
        </span>
      </button>
      <nav>
        {nav.map((item) => (
          <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => navigate(item.page)}>
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
      <div className="topbarActions">
        {!generalSession ? (
          <>
            <button onClick={() => navigate("operator-login")}><Lock size={16} /> 로그인</button>
          </>
        ) : (
          <>
            <button className="secondary" onClick={() => navigate("contests")}><Trophy size={16} /> 내 대회</button>
            {generalSession.operatorSession?.staff.is_service_master && <button className="secondary" onClick={() => navigate("admin-home")}><ShieldCheck size={16} /> 관리자</button>}
            <div className="profileChip">
              <span className="profileAvatar">{generalSession.account.display_name.slice(0, 1).toUpperCase()}</span>
              <span>
                <strong>{generalSession.account.display_name}</strong>
                <small>{generalSession.account.email}</small>
              </span>
              <button className="textButton" onClick={onGeneralLogout}>로그아웃</button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function ContestTopBar({
  page,
  contest,
  participant,
  generalParticipant,
  generalSession,
  division,
  navigate,
  onParticipantLogout,
  onGeneralLogout
}: {
  page: Page;
  contest: Contest;
  participant: ParticipantSession | null;
  generalParticipant: GeneralParticipantContest | null;
  generalSession: GeneralSession | null;
  division: Division;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  onParticipantLogout: () => void;
  onGeneralLogout: () => void;
}) {
  const displayName = participant?.member.name ?? generalParticipant?.member.name ?? generalSession?.account.display_name ?? "로그인 필요";
  const displayDetail = participant
    ? `${participant.team.team_name} · ${participant.division.name}`
    : generalParticipant
      ? `${generalParticipant.team.team_name} · ${generalParticipant.division.name}`
      : generalSession
        ? generalSession.account.email
        : "이메일 인증";
  const globalNav: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "home", label: "ZOJ홈", icon: <BookOpen size={16} /> },
    { page: "contests", label: "대회목록", icon: <CalendarDays size={16} /> }
  ];
  const nav: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "contest", label: "개요", icon: <LayoutDashboard size={16} /> },
    { page: "problemset", label: "문제집", icon: <BookOpen size={16} /> },
    { page: "submissions", label: "채점 현황", icon: <History size={16} /> },
    { page: "scoreboard", label: "스코어보드", icon: <Trophy size={16} /> },
    { page: "board", label: "게시판", icon: <MessageSquare size={16} /> }
  ];
  return (
    <header className="topbar contestTopbar">
      <div className="contestBrandGroup">
        <button className="brandButton compactBrand" onClick={() => navigate("contests")}>
          <span className="brandMark">Z</span>
          <span>
            <strong>{contest.title}</strong>
            <small>{contest.organization_name} · {division.name}</small>
          </span>
        </button>
      </div>
      <nav className="contestNav">
        <div className="navGroup navGroupGlobal">
          {globalNav.map((item) => (
            <button key={item.page} className={page === item.page ? "active" : ""} onClick={() => navigate(item.page)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        <div className="navDivider" />
        <div className="navGroup navGroupContext">
          {nav.map((item) => (
            <button key={item.page} className={page === item.page || (page === "problem" && item.page === "problemset") ? "active" : ""} onClick={() => navigate(item.page, { contestId: contest.contest_id })}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>
      <div className="profileChip">
        <span className="profileAvatar">{displayName.slice(0, 1).toUpperCase()}</span>
        <span>
          <strong>{displayName}</strong>
          <small>{displayDetail}</small>
        </span>
        {!participant && !generalSession && (
          <button className="textButton" onClick={() => navigate("participant-login", { contestId: contest.contest_id })}>
            로그인
          </button>
        )}
        {participant && (
          <button className="textButton" onClick={onParticipantLogout}>
            로그아웃
          </button>
        )}
        {!participant && generalSession && (
          <button className="textButton" onClick={onGeneralLogout}>
            로그아웃
          </button>
        )}
      </div>
    </header>
  );
}

function StaffTopBar({
  page,
  staffSession,
  contestId,
  navigate,
  onStaffLogout
}: {
  page: Page;
  staffSession: StaffSession;
  contestId?: string;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  onStaffLogout: () => void;
}) {
  const isAdminPage = page === "admin" || page === "admin-home" || page === "admin-contests" || page === "admin-judge";
  if (staffSession.staff.is_service_master && isAdminPage) {
    return (
      <header className="topbar staffTopbar">
        <button className="brandButton compactBrand" onClick={() => navigate("admin-home")}>
          <span className="brandMark">Z</span>
          <span>
            <strong>서비스 관리자</strong>
            <small>service admin workspace</small>
          </span>
        </button>
        <nav className="staffNav">
          <div className="navGroup navGroupContext">
            <button className={page === "admin-home" || page === "admin" ? "active" : ""} onClick={() => navigate("admin-home")}>
              <LayoutDashboard size={16} /> 관리 홈
            </button>
            <button className={page === "admin-contests" ? "active" : ""} onClick={() => navigate("admin-contests")}>
              <CalendarDays size={16} /> 대회 관리
            </button>
            <button className={page === "admin-judge" ? "active" : ""} onClick={() => navigate("admin-judge")}>
              <Activity size={16} /> 채점기 관리
            </button>
          </div>
          <div className="navDivider" />
          <div className="navGroup navGroupGlobal">
            <button onClick={() => navigate("home")}>
              <BookOpen size={16} /> ZOJ홈
            </button>
            <button onClick={() => navigate("contests")}>
              <CalendarDays size={16} /> 대회 목록
            </button>
          </div>
        </nav>
        <div className="profileChip">
          <span className="sectionTag">{pageLabel(page === "admin" ? "admin-home" : page)}</span>
          <span className="profileAvatar">{staffSession.staff.display_name.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>{staffSession.staff.display_name}</strong>
            <small>{staffSession.staff.email}</small>
          </span>
          <button className="textButton" onClick={onStaffLogout}>로그아웃</button>
        </div>
      </header>
    );
  }

  const operatorContestNav: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "problemset", label: "문제집", icon: <BookOpen size={16} /> },
    { page: "submissions", label: "채점현황", icon: <History size={16} /> },
    { page: "scoreboard", label: "스코어보드", icon: <Trophy size={16} /> },
    { page: "board", label: "게시판", icon: <MessageSquare size={16} /> },
    { page: "operator-settings", label: "대회 운영", icon: <CalendarDays size={16} /> },
    { page: "operator-participants", label: "참가팀 설정", icon: <Users size={16} /> },
    { page: "operator-problems", label: "문제 설정", icon: <FileCode2 size={16} /> }
  ];

  const isContestViewPage = (target: Page) => page === target || (target === "problemset" && page === "problem");

  function navButton(target: Page, label: string, icon: React.ReactNode, needsContest = false) {
    const disabled = needsContest && !contestId;
    const navigateOptions = contestId ? { contestId } : undefined;
    const active = isContestViewPage(target);
    return (
      <button key={target} className={active ? "active" : ""} onClick={() => navigate(target, navigateOptions)} disabled={disabled}>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <header className="topbar staffTopbar">
      <button className="brandButton compactBrand" onClick={() => navigate("operator")}>
        <span className="brandMark">Z</span>
        <span>
          <strong>{staffSession.staff.is_service_master ? "서비스 관리자" : "대회 운영자"}</strong>
          <small>{contestId ? "contest workspace" : "operator workspace"}</small>
        </span>
      </button>
      <nav className="staffNav">
        {contestId ? (
          <>
            <div className="navGroup navGroupContext">
              <button className={page === "operator" ? "active" : ""} onClick={() => navigate("operator", { contestId })}>
                <LayoutDashboard size={16} /> 대회 개요
              </button>
              {operatorContestNav.map((item) => navButton(item.page, item.label, item.icon, true))}
            </div>
            <div className="navDivider" />
            <div className="navGroup navGroupGlobal">
              <button onClick={() => navigate("home")}>
                <BookOpen size={16} /> ZOJ홈
              </button>
              <button className={page === "operator" && !contestId ? "active" : ""} onClick={() => navigate("operator")}>
                <ShieldCheck size={16} /> 운영 대회 목록
              </button>
            </div>
          </>
        ) : (
          <div className="navGroup navGroupContext">
            <button onClick={() => navigate("home")}>
              <BookOpen size={16} /> ZOJ홈
            </button>
            <button className={page === "operator" ? "active" : ""} onClick={() => navigate("operator")}>
              <ShieldCheck size={16} /> 운영 대회 목록
            </button>
          </div>
        )}
      </nav>
      <div className="profileChip">
        <span className="sectionTag">{pageLabel(page)}</span>
        <span className="profileAvatar">{staffSession.staff.display_name.slice(0, 1).toUpperCase()}</span>
        <span>
          <strong>{staffSession.staff.display_name}</strong>
          <small>{staffSession.staff.email}</small>
        </span>
        <button className="textButton" onClick={onStaffLogout}>로그아웃</button>
      </div>
    </header>
  );
}

function ApiBanner({ api }: { api: ApiState }) {
  return (
    <div className={`apiBanner ${api.status}`}>
      <span className={`dot ${api.status === "live" ? "live" : ""}`} />
      {api.status === "loading" && "API 연결 확인 중"}
      {api.status === "live" && "서비스 연결 정상"}
      {api.status === "offline" && `일부 데이터를 불러오지 못했습니다${api.error ? ` - ${api.error}` : ""}`}
    </div>
  );
}

function HomePage({ api, navigate, generalSession }: { api: ApiState; navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void; generalSession: GeneralSession | null }) {
  const [selectedNoticeId, setSelectedNoticeId] = useState("");
  const selectedNotice = api.notices.find((notice) => notice.service_notice_id === selectedNoticeId) ?? api.notices[0] ?? null;
  const heroStats = [
    { label: "공개 대회", value: String(api.contests.length) },
    { label: "공지", value: String(api.notices.length) },
    { label: "채점 노드", value: String(api.judgeStatus?.active_node_count ?? 0) },
    { label: "대기 작업", value: String(api.judgeStatus?.total_queue_depth ?? 0) }
  ];
  return (
    <section className="homePage">
      <section className="homeHero">
        <div className="homeHeroCopy">
          <span className="eyebrow">online judge platform</span>
          <h1>Zerone Online Judge</h1>
          <p>{api.contest?.overview ?? "코딩 대회를 여는 스마트한 방법. 소규모 스터디부터 본선 대회까지, 문제 공개와 제출, 채점, 스코어보드를 한 화면에서 다룹니다."}</p>
          <div className="buttonRow">
            <button onClick={() => navigate("contests")}><Trophy size={16} /> 대회 목록</button>
            <button className="secondary" onClick={() => navigate("judge-status")}><Activity size={16} /> 채점 상태</button>
            <button className="secondary" onClick={() => navigate("operator-login")}><Lock size={16} /> {generalSession ? "내 대회 보기" : "로그인"}</button>
          </div>
        </div>
        <dl className="homeHeroStats" aria-label="서비스 현황">
          {heroStats.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="homeSection homeNoticeSection">
        <div className="homeSectionHeader">
          <div>
            <span className="sectionKicker">서비스 공지</span>
            <h2>플랫폼 안내를 먼저 확인하세요</h2>
          </div>
        </div>
        <div className="homeNoticeGrid">
          <div className="homeNoticeList" role="list" aria-label="공지 목록">
            {api.notices.length === 0 && (
              <article className="homeNoticeRow empty">
                <strong>등록된 공지가 없습니다.</strong>
                <span>공지사항이 올라오면 이 영역에 표시됩니다.</span>
              </article>
            )}
            {api.notices.map((notice) => {
              const active = selectedNotice?.service_notice_id === notice.service_notice_id;
              return (
                <button
                  key={notice.service_notice_id}
                  type="button"
                  role="listitem"
                  className={active ? "homeNoticeRow active" : "homeNoticeRow"}
                  onClick={() => setSelectedNoticeId(notice.service_notice_id)}
                  aria-pressed={active}
                >
                  <span className="homeNoticeRowBadge">{notice.emergency ? "긴급" : "공지"}</span>
                  <span className="homeNoticeRowBody">
                    <strong>{notice.title}</strong>
                    <span>{notice.summary}</span>
                  </span>
                  <time>{formatDate(notice.published_at)}</time>
                </button>
              );
            })}
          </div>
          <article className="homeNoticeDetail" aria-live="polite">
            {selectedNotice ? (
              <>
                <div className="homeNoticeDetailHeader">
                  <div>
                    <span className={selectedNotice.emergency ? "statusPill danger" : "statusPill"}>{selectedNotice.emergency ? "긴급 공지" : "공지"}</span>
                    <h3>{selectedNotice.title}</h3>
                    <small>{formatDate(selectedNotice.published_at)}</small>
                  </div>
                </div>
                <MarkdownPreview statement={selectedNotice.body} assets={[]} />
              </>
            ) : (
              <div className="homeNoticeEmpty">
                <span className="sectionKicker">공지 상세</span>
                <h3>선택한 공지가 여기에 표시됩니다.</h3>
                <p>좌측 목록에서 항목을 고르면 내용을 바로 확인할 수 있습니다.</p>
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="homeSection">
        <div className="homeSectionHeader">
          <div>
            <span className="sectionKicker">대회 목록</span>
            <h2>공개 대회를 한눈에</h2>
          </div>
          <button className="textButton" onClick={() => navigate("contests")}>
            전체 보기 <ChevronRight size={16} />
          </button>
        </div>
        <ContestCards contests={api.contests} navigate={navigate} compact />
      </section>
    </section>
  );
}

function ServiceNoticePage({ api }: { api: ApiState }) {
  const notices = useMemo(
    () => [...api.notices].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()),
    [api.notices]
  );
  const [selectedId, setSelectedId] = useState("");
  const selected = notices.find((item) => item.service_notice_id === selectedId) ?? notices[0] ?? null;

  useEffect(() => {
    if (!selectedId && notices[0]) setSelectedId(notices[0].service_notice_id);
  }, [selectedId, notices]);

  return (
    <section className="pageGrid">
      <PageHeader badge="notice" title="공지 안내" description="서비스 공지와 긴급 공지를 확인합니다." />
      <section className="boardStreamLayout serviceNoticeLayout">
        <div className="boardStreamColumn">
          <div className="boardThreadFeed">
            {notices.length === 0 && <div className="boardEmpty">등록된 공지가 없습니다.</div>}
            {notices.map((notice) => (
              <button
                key={notice.service_notice_id}
                type="button"
                className={selected?.service_notice_id === notice.service_notice_id ? "boardThreadCard active" : "boardThreadCard"}
                onClick={() => setSelectedId(notice.service_notice_id)}
              >
                <div className="boardThreadHeader">
                  <div className="boardAvatar">{notice.emergency ? "!" : "N"}</div>
                  <div>
                    <strong>{notice.title}</strong>
                    <span>{formatDate(notice.published_at)}</span>
                  </div>
                </div>
                <p>{notice.summary}</p>
              </button>
            ))}
          </div>
        </div>
        <article className="boardFocusPane">
          {selected ? (
            <>
              <div className="boardFocusHeader">
                <div>
                  <span className={selected.emergency ? "statusPill failed" : "statusPill active"}>{selected.emergency ? "긴급 공지" : "공지"}</span>
                  <h2>{selected.title}</h2>
                  <small>{formatDate(selected.published_at)}</small>
                </div>
              </div>
              <MarkdownPreview statement={selected.body} assets={[]} />
            </>
          ) : (
            <div className="boardEmpty">
              <strong>공지 없음</strong>
              <span>표시할 공지가 없습니다.</span>
            </div>
          )}
        </article>
      </section>
    </section>
  );
}

function ServiceRulesPage() {
  return (
    <section className="pageGrid">
      <PageHeader badge="rules" title="규정 안내" description="운영/참가 시 공통으로 적용되는 기본 규정입니다." />
      <section className="panel serviceDocPanel">
        <h3>기본 운영 규정</h3>
        <ul>
          <li>대회 시작 전/진행 중에는 비로그인 사용자에게 문제/제출/스코어보드를 공개하지 않습니다.</li>
          <li>참가팀은 팀당 1개 참가 유형에만 속하며, 유형별 문제/스코어보드는 완전히 분리됩니다.</li>
          <li>채점 결과는 완료 즉시 반영되며, 프리즈 이후 공개 스코어보드는 프리즈 시점 기준으로 고정됩니다.</li>
          <li>대회 종료 후 공개 범위(문제/제출/스코어보드)는 대회 설정에 따릅니다.</li>
          <li>운영 감사 로그는 삭제하지 않고 보존합니다.</li>
        </ul>
      </section>
    </section>
  );
}

function ServiceHelpPage() {
  return (
    <section className="pageGrid">
      <PageHeader badge="help" title="도움말" description="자주 사용하는 흐름만 간단히 정리했습니다." />
      <section className="panel serviceDocPanel">
        <h3>참가자</h3>
        <ul>
          <li>로그인 후 내 대회에서 참가 가능한 대회를 선택하면 바로 대회 개요로 이동합니다.</li>
          <li>문제집은 본인 참가 유형 기준으로만 표시됩니다.</li>
          <li>채점현황은 최근 제출 순으로 자동 갱신됩니다.</li>
        </ul>
        <h3>운영자</h3>
        <ul>
          <li>상단 `운영` 탭에서 대회 설정/참가팀/문제/공지/채점 현황을 관리합니다.</li>
          <li>운영 중 시간 변경 시 자동 긴급 공지가 생성됩니다.</li>
          <li>운영자 상세 채점 화면에서 실패 테스트, 로그, 리소스 사용량을 확인할 수 있습니다.</li>
        </ul>
      </section>
    </section>
  );
}

function ServiceContactPage() {
  return (
    <section className="pageGrid">
      <PageHeader badge="contact" title="문의" description="서비스 운영 문의 채널입니다." />
      <section className="panel serviceDocPanel">
        <h3>문의 채널</h3>
        <ul>
          <li>대회 운영 이슈: 대회 게시판의 비공개 질문으로 접수</li>
          <li>계정/권한 이슈: 서비스 관리자 메일로 접수</li>
          <li>장애/긴급 상황: 서비스 긴급공지 확인 후 운영자에게 즉시 전달</li>
        </ul>
      </section>
    </section>
  );
}

function ContestListPage({
  api,
  navigate,
  generalSession,
  enterContestAsParticipant
}: {
  api: ApiState;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  generalSession: GeneralSession | null;
  enterContestAsParticipant: (contestId: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<"all" | "mine">(generalSession ? "mine" : "all");
  const [localContests, setLocalContests] = useState<Contest[]>([]);
  const [refreshMessage, setRefreshMessage] = useState("");
  useEffect(() => {
    setLocalContests(api.contests);
  }, [api.contests]);
  const refreshContests = useCallback(async (silent = false) => {
    if (!silent) setRefreshMessage("대회 목록을 새로고침하고 있습니다.");
    try {
      const data = await apiRequest<Contest[]>("/public/contests");
      setLocalContests(data);
      if (!silent) setRefreshMessage("대회 목록을 갱신했습니다.");
    } catch (error) {
      setRefreshMessage(formatApiError(error, "대회 목록 갱신 실패"));
    }
  }, []);
  useAutoRefresh(() => refreshContests(true), true, 20000);
  const sorted = [...localContests].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  const myContests = useMemo(() => {
    if (!generalSession) return [];
    const byId = new Map<string, Contest>();
    generalSession.participantContests.forEach((entry) => byId.set(entry.contest.contest_id, entry.contest));
    generalSession.operatorContests.forEach((entry) => byId.set(entry.contest.contest_id, entry.contest));
    return [...byId.values()].sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }, [generalSession]);
  const visibleContests = tab === "mine" ? myContests : sorted;
  return (
    <section className="pageGrid">
      <PageHeader badge="contests" title="대회 목록" description="개최일 기준으로 정렬된 공개 대회입니다." />
      {refreshMessage && <p className="panelNote">{refreshMessage}</p>}
      {!generalSession && (
        <section className="panel">
          <PanelTitle icon={<Lock />} title="로그인" />
          <div className="buttonRow">
            <button onClick={() => navigate("operator-login")}><Lock size={16} /> 로그인</button>
          </div>
        </section>
      )}
      <div className="segmented">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>전체 대회</button>
        <button className={tab === "mine" ? "active" : ""} onClick={() => setTab("mine")} disabled={!generalSession}>내 대회</button>
      </div>
      <ContestCards contests={visibleContests} navigate={navigate} generalSession={generalSession} enterContestAsParticipant={enterContestAsParticipant} />
    </section>
  );
}

function ContestCards({
  contests,
  navigate,
  compact = false,
  generalSession = null,
  enterContestAsParticipant
}: {
  contests: Contest[];
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  compact?: boolean;
  generalSession?: GeneralSession | null;
  enterContestAsParticipant?: (contestId: string) => Promise<void>;
}) {
  function openContest(contestId: string, nextPage: Page) {
    navigate(nextPage, { contestId });
  }

  return (
    <div className={compact ? "contestCards compact" : "contestCards"}>
      {!contests.length && (
        <article className="contestCard empty">
          <div>
            <span className="statusPill">empty</span>
            <h2>공개 대회 없음</h2>
            <p>공개 상태의 대회가 등록되면 개최일 기준으로 이 목록에 표시됩니다.</p>
          </div>
        </article>
      )}
      {contests.map((contest) => (
        (() => {
          const participantEntry = generalSession?.participantContests.find((entry) => entry.contest.contest_id === contest.contest_id);
          const operatorEntry = generalSession?.operatorContests.find((entry) => entry.contest.contest_id === contest.contest_id);
          const primaryPage: Page = operatorEntry && !participantEntry ? "operator" : "contest";
          return (
            <article className="contestCard" key={contest.contest_id}>
              <div className="contestCardHeader">
                <span className={`statusPill ${contest.status}`}>{contest.status}</span>
                <h2>{contest.title}</h2>
                <p>{contest.overview}</p>
              </div>
              <dl className="contestMeta">
                <div><dt>개최기관</dt><dd>{contest.organization_name}</dd></div>
                <div><dt>개최일</dt><dd>{formatDate(contest.start_at)}</dd></div>
                <div><dt>참가 유형</dt><dd>필수, 팀당 1개</dd></div>
              </dl>
              <div className="buttonRow contestCardActions">
                <button onClick={() => openContest(contest.contest_id, primaryPage)}>
                  {primaryPage === "operator" ? "운영 페이지" : "상세 보기"} <ChevronRight size={16} />
                </button>
                {participantEntry || generalSession ? (
                  <button className="secondary" onClick={() => openContest(contest.contest_id, primaryPage)}>
                    {primaryPage === "operator" ? <ShieldCheck size={16} /> : <Trophy size={16} />}
                    {primaryPage === "operator" ? "운영 콘솔" : "대회 개요"}
                  </button>
                ) : (
                  <button className="secondary" onClick={() => openContest(contest.contest_id, "participant-login")}><Mail size={16} /> 참가팀 로그인</button>
                )}
              </div>
            </article>
          );
        })()
      ))}
    </div>
  );
}

function GeneralLoginPage({
  contest,
  navigate,
  onLogin,
  generalSession,
  enterContestAsParticipant,
  onLogout,
  message: sessionMessage = ""
}: {
  api?: ApiState;
  contest?: Contest;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  onLogin: (session: GeneralSession, preferredContestId?: string) => Promise<void>;
  generalSession: GeneralSession | null;
  enterContestAsParticipant: (contestId: string) => Promise<void>;
  onLogout: () => void;
  message?: string;
}) {
  const [email, setEmail] = useState("");
  const [loginMethod, setLoginMethod] = useState<"otp" | "password" | null>(null);
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [otpRequested, setOtpRequested] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState(0);
  const otpRef = useRef<HTMLInputElement | null>(null);
  const cooldownSeconds = useCooldown(cooldownUntil);
  const otpExpiresSeconds = useCooldown(otpExpiresAt);

  function formatSeconds(value: number) {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  async function detectLoginMethod(autoRequestOtp = false) {
    try {
      const data = await apiRequest<{ method: "otp" | "password" }>(
        "/auth/general/login-method",
        undefined,
        { method: "POST", body: JSON.stringify({ email }) }
      );
      setLoginMethod(data.method);
      setOtpRequested(false);
      setOtp("");
      setPassword("");
      setMessage(data.method === "password" ? "비밀번호 로그인 대상 계정입니다." : "");
      if (data.method === "otp" && autoRequestOtp) {
        await requestOtp();
        return;
      }
      if (data.method === "otp") {
        requestAnimationFrame(() => otpRef.current?.focus());
      }
    } catch (error) {
      setMessage(formatApiError(error, "로그인 방식 확인 실패"));
    }
  }

  async function requestOtp() {
    try {
      await apiRequest<{ cooldown_seconds?: number }>(
        "/auth/general/otp/request",
        undefined,
        { method: "POST", body: JSON.stringify({ email }) }
      );
      setCooldownUntil(Date.now() + 10 * 1000);
      setOtpRequested(true);
      setOtpExpiresAt(Date.now() + OTP_VALID_SECONDS * 1000);
      setMessage("인증번호가 이메일로 발송되었습니다. 인증번호 유효시간은 5분입니다.");
      requestAnimationFrame(() => otpRef.current?.focus());
    } catch (error) {
      const retryAfter = readRetryAfterSeconds(error);
      if (retryAfter > 0) {
        setCooldownUntil(Date.now() + retryAfter * 1000);
      }
      setMessage(formatApiError(error, "인증번호 발송 실패"));
    }
  }

  async function verifyOtp() {
    setMessage("로그인 중입니다.");
    try {
      const data = await apiRequest<GeneralSessionApi>(
        "/auth/general/otp/verify",
        undefined,
        { method: "POST", body: JSON.stringify({ email, otp_code: otp }) }
      );
      await onLogin(mapGeneralSession(data), contest?.contest_id);
    } catch (error) {
      setMessage(formatApiError(error, "로그인 실패"));
    }
  }

  async function loginWithPassword() {
    setMessage("인증번호를 발송하고 있습니다.");
    try {
      await apiRequest<{ cooldown_seconds?: number }>(
        "/auth/general/password/otp/request",
        undefined,
        { method: "POST", body: JSON.stringify({ email, password }) }
      );
      setCooldownUntil(Date.now() + 10 * 1000);
      setOtpRequested(true);
      setOtpExpiresAt(Date.now() + OTP_VALID_SECONDS * 1000);
      setMessage("인증번호가 이메일로 발송되었습니다. 인증번호 유효시간은 5분입니다.");
      requestAnimationFrame(() => otpRef.current?.focus());
    } catch (error) {
      const retryAfter = readRetryAfterSeconds(error);
      if (retryAfter > 0) {
        setCooldownUntil(Date.now() + retryAfter * 1000);
      }
      setMessage(formatApiError(error, "인증번호 발송 실패"));
    }
  }

  async function verifyPasswordOtp() {
    setMessage("로그인 중입니다.");
    try {
      const data = await apiRequest<GeneralSessionApi>(
        "/auth/general/password/otp/verify",
        undefined,
        { method: "POST", body: JSON.stringify({ email, password, otp_code: otp }) }
      );
      await onLogin(mapGeneralSession(data), contest?.contest_id);
    } catch (error) {
      setMessage(formatApiError(error, "로그인 실패"));
    }
  }

  function submitParticipantLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginMethod) {
      detectLoginMethod(true);
      return;
    }
    if (loginMethod === "password") {
      if (otpRequested) {
        verifyPasswordOtp();
      } else {
        loginWithPassword();
      }
      return;
    }
    if (otpRequested) {
      verifyOtp();
    } else {
      requestOtp();
    }
  }

  if (generalSession) {
    const participantEntry = contest ? generalSession.participantContests.find((entry) => entry.contest.contest_id === contest.contest_id) : null;
    const operatorEntry = contest ? generalSession.operatorContests.find((entry) => entry.contest.contest_id === contest.contest_id) : null;
    return (
      <LoginShell title="이미 로그인됨" subtitle="현재 세션을 사용 중입니다.">
        {contest && (
          <div className="selectedContestBox">
            <strong>{contest.title}</strong>
            <span>{contest.organization_name} · {formatDate(contest.start_at)}</span>
            <span>{participantEntry ? `${participantEntry.team.team_name} · ${participantEntry.division.name}` : operatorEntry ? "대회 운영 권한 있음" : "이 계정은 이 대회 참가/운영 권한이 없습니다."}</span>
          </div>
        )}
        <div className="selectedContestBox">
          <strong>{generalSession.account.display_name}</strong>
          <span>{generalSession.account.email}</span>
          <span>참가 {generalSession.participantContests.length}개 · 운영 {generalSession.operatorContests.length}개</span>
        </div>
        <div className="buttonRow">
          {contest && participantEntry && (
            <button type="button" onClick={() => navigate("contest", { contestId: contest.contest_id })}><Trophy size={16} /> 대회 개요</button>
          )}
          {contest && operatorEntry && (
            <button type="button" className="secondary" onClick={() => navigate("operator", { contestId: contest.contest_id })}><ShieldCheck size={16} /> 운영 페이지</button>
          )}
          <button type="button" className="secondary" onClick={() => navigate("contests")}><CalendarDays size={16} /> 내 대회</button>
          <button type="button" className="textButton" onClick={onLogout}>로그아웃</button>
        </div>
      </LoginShell>
    );
  }

  return (
    <LoginShell title="로그인" subtitle="이메일 입력 후 OTP 또는 비밀번호로 로그인합니다." onSubmit={submitParticipantLogin}>
      {contest && (
        <div className="selectedContestBox">
          <strong>{contest.title}</strong>
          <span>{contest.organization_name} · {formatDate(contest.start_at)}</span>
          <span>참가자는 등록된 유형으로, 운영자는 운영 권한 대회로 이동합니다.</span>
        </div>
      )}
      <label>이메일</label>
      <input
        value={email}
        disabled={otpRequested}
        placeholder="등록된 이메일"
        onChange={(event) => {
          setEmail(event.target.value);
          setLoginMethod(null);
          setOtpRequested(false);
          setOtp("");
          setPassword("");
          setMessage("");
          setOtpExpiresAt(0);
        }}
      />
      {!loginMethod && (
        <button type="submit" disabled={!email.trim()}>
          <Lock size={16} /> 다음
        </button>
      )}
      {loginMethod === "password" && (
        <>
          <label>비밀번호</label>
          <input
            type="password"
            value={password}
            disabled={otpRequested}
            placeholder="비밀번호"
            onChange={(event) => {
              setPassword(event.target.value);
              setOtpRequested(false);
              setOtp("");
              setCooldownUntil(0);
              setOtpExpiresAt(0);
            }}
          />
          <button type={otpRequested ? "button" : "submit"} onClick={otpRequested ? loginWithPassword : undefined} disabled={!email.trim() || !password.trim() || cooldownSeconds > 0}>
            <Mail size={16} /> {cooldownSeconds > 0 ? `재전송 ${cooldownSeconds}초` : "인증번호 받기"}
          </button>
          {otpRequested && (
            <>
              <label>인증번호</label>
              <input ref={otpRef} value={otp} placeholder="인증번호" onChange={(event) => setOtp(event.target.value)} />
              <button type="submit" disabled={otpExpiresSeconds <= 0}><ShieldCheck size={16} /> 로그인</button>
              <p className="panelNote">인증번호 유효시간: {otpExpiresSeconds > 0 ? formatSeconds(otpExpiresSeconds) : "만료 (재전송 필요)"}</p>
            </>
          )}
          <div className="buttonRow">
            <button type="button" className="secondary" onClick={() => { setLoginMethod(null); setOtpRequested(false); setOtp(""); setOtpExpiresAt(0); setCooldownUntil(0); }}>이메일 다시 입력</button>
          </div>
        </>
      )}
      {loginMethod === "otp" && (
        <>
          <button type={otpRequested ? "button" : "submit"} onClick={otpRequested ? requestOtp : undefined} disabled={!email.trim() || cooldownSeconds > 0}>
            <Mail size={16} /> {cooldownSeconds > 0 ? `재전송 ${cooldownSeconds}초` : "인증번호 받기"}
          </button>
          {otpRequested && (
            <>
              <label>인증번호</label>
              <input ref={otpRef} value={otp} placeholder="인증번호" onChange={(event) => setOtp(event.target.value)} />
              <button type="submit" className="secondary" disabled={otpExpiresSeconds <= 0}><Lock size={16} /> 로그인</button>
              <p className="panelNote">인증번호 유효시간: {otpExpiresSeconds > 0 ? formatSeconds(otpExpiresSeconds) : "만료 (재전송 필요)"}</p>
            </>
          )}
          <button type="button" className="textButton" onClick={() => { setLoginMethod(null); setOtpRequested(false); setOtp(""); setOtpExpiresAt(0); setCooldownUntil(0); }}>이메일 다시 입력</button>
        </>
      )}
      {message && <p className="formMessage">{message}</p>}
      {sessionMessage && <p className="formMessage error">{sessionMessage}</p>}
    </LoginShell>
  );
}

function StaffAccessGate({
  loginPage,
  message,
  navigate
}: {
  loginPage: "operator-login";
  message?: string;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  return (
    <section className="pageGrid">
      <section className="accessGate panel">
        <Lock size={34} />
        <h1>로그인이 필요합니다</h1>
        <p>운영 화면은 로그인한 계정의 권한 범위에서만 접근할 수 있습니다.</p>
        {message && <p className="submitMessage error">{message}</p>}
        <button onClick={() => navigate(loginPage)}>
          <Lock size={16} />
          로그인
        </button>
      </section>
    </section>
  );
}

function StaffContestGate({ navigate }: { navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void }) {
  return (
    <section className="accessGate panel">
      <Lock size={34} />
      <h1>운영할 대회를 먼저 선택하세요</h1>
      <p>운영자 화면은 공개 대회 목록과 분리되어 있습니다. 로그인한 계정에 배정된 대회 목록에서 이동해야 합니다.</p>
      <button onClick={() => navigate("operator")}><CalendarDays size={16} /> 운영 권한 대회 보기</button>
    </section>
  );
}

function ContestPage({
  contest,
  participant,
  generalParticipant,
  generalSession,
  navigate
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  generalParticipant: GeneralParticipantContest | null;
  generalSession: GeneralSession | null;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const operatorContest = Boolean(generalSession?.operatorContests.some((entry) => entry.contest.contest_id === contest.contest_id));
  const memberName = participant?.member.name ?? generalParticipant?.member.name ?? generalSession?.account.display_name ?? "로그인 필요";
  const memberEmail = participant?.member.email ?? generalParticipant?.member.email ?? generalSession?.account.email ?? "이메일 인증 필요";
  const teamName = participant?.team.team_name ?? generalParticipant?.team.team_name ?? (operatorContest ? "운영 권한" : "로그인 필요");
  const divisionName = participant?.division.name ?? generalParticipant?.division.name ?? (operatorContest ? "운영자" : "등록된 참가 유형");
  return (
    <section className="pageGrid contestWorkspace">
      <section className="contestHero">
        <div className="contestHeroMain">
          <span className="sectionKicker">{contest.status}</span>
          <h1>{contest.title}</h1>
          <p>{contest.overview}</p>
          <div className="contestHeroMeta">
            <span>{contest.organization_name}</span>
            <span>{formatDate(contest.start_at)}</span>
            <span>{timeLeft(contest.end_at)} left</span>
            <span>{divisionName}</span>
          </div>
        </div>
        <aside className="contestHeroAside">
          <InfoCard icon={<Users />} title="내 정보" value={memberName} detail={memberEmail} />
          <InfoCard icon={<Trophy />} title="팀 정보" value={teamName} detail={divisionName} />
          <InfoCard icon={<Timer />} title="남은 시간" value={timeLeft(contest.end_at)} detail={`freeze ${formatTime(contest.freeze_at)}`} />
        </aside>
      </section>
    </section>
  );
}

function AccessGate({ contest, resource, navigate }: { contest: Contest; resource: string; navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void }) {
  const ended = isContestEnded(contest);
  return (
    <section className="pageGrid">
      <section className="accessGate panel">
        <Lock size={34} />
        <span className="eyebrow">restricted</span>
        <h1>{resource} 접근 제한</h1>
        <p>
          비로그인 상태에서는 대회 전과 대회 중에 {resource}을 볼 수 없습니다.
          {ended ? " 대회 종료 후에도 운영자가 공개 설정을 켠 항목만 공개됩니다." : " 참가팀 로그인 후 본인 참가 유형 기준으로만 접근할 수 있습니다."}
        </p>
        <div className="buttonRow">
          <button onClick={() => navigate("participant-login", { contestId: contest.contest_id })}>
            <Mail size={16} />
            참가팀 로그인
          </button>
          <button className="secondary" onClick={() => navigate("contest", { contestId: contest.contest_id })}>
            대회 개요
          </button>
        </div>
      </section>
    </section>
  );
}

function ProblemSetPage({
  api,
  division,
  problems,
  locked,
  setDivisionId,
  openProblem
}: {
  api: ApiState;
  division: Division;
  problems: Problem[];
  locked: boolean;
  setDivisionId: (id: string) => void;
  openProblem: (id: string) => void;
}) {
  const pageSize = 12;
  const [pageIndex, setPageIndex] = useState(1);
  useEffect(() => {
    setPageIndex(1);
  }, [division.division_id, problems.length]);
  const totalPages = Math.max(1, Math.ceil(problems.length / pageSize));
  const safePage = Math.min(pageIndex, totalPages);
  const pageItems = problems.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <section className="pageGrid">
      <PageHeader badge={division.name} title="문제집" description="본인 참가 유형 문제만 표시됩니다." />
      {locked ? (
        <DivisionLock division={division} />
      ) : (
        <Segmented options={api.divisions} value={division.division_id} onChange={setDivisionId} />
      )}
      <section className="problemList">
        {!problems.length && (
          <section className="panel emptyState">
            <PanelTitle icon={<BookOpen />} title="등록된 문제가 없습니다" />
            <p>이 참가 유형에는 아직 문제가 등록되지 않았습니다.</p>
          </section>
        )}
        {pageItems.map((problem) => (
          <button className="problemRow" key={problem.problem_id} onClick={() => openProblem(problem.problem_id)}>
            <span className="problemCode">{problem.problem_code}</span>
            <strong>{problem.title}</strong>
            <span>{problem.time_limit_ms / 1000}s</span>
            <span>{problem.memory_limit_mb}MB</span>
            <span>{problem.max_score}점</span>
            <ChevronRight size={16} />
          </button>
        ))}
        {problems.length > 0 && (
          <SimplePagination page={safePage} totalPages={totalPages} onChange={setPageIndex} />
        )}
      </section>
    </section>
  );
}

function CodeEditor({
  value,
  language,
  onChange,
  disabled
}: {
  value: string;
  language: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<MonacoEditorInstance | null>(null);
  const valueRef = useRef(value);
  const languageRef = useRef(language);
  const disabledRef = useRef(disabled);
  const [monacoReady, setMonacoReady] = useState(false);

  valueRef.current = value;
  languageRef.current = language;
  disabledRef.current = disabled;

  useEffect(() => {
    let cancelled = false;
    let disposable: { dispose: () => void } | null = null;
    ensureMonaco().then((monaco) => {
      if (cancelled || !monaco || !containerRef.current || editorRef.current) return;
      const editor = monaco.editor.create(containerRef.current, {
        value: valueRef.current,
        language: monacoLanguage(languageRef.current),
        theme: "vs",
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 22,
        tabSize: 2,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        renderWhitespace: "selection",
        readOnly: Boolean(disabledRef.current)
      });
      disposable = editor.onDidChangeModelContent(() => onChange(editor.getValue()));
      editorRef.current = editor;
      setMonacoReady(true);
    });
    return () => {
      cancelled = true;
      disposable?.dispose();
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) editor.setValue(value);
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = (window as MonacoWindow).monaco;
    if (editor && monaco) monaco.editor.setModelLanguage(editor.getModel(), monacoLanguage(language));
  }, [language]);

  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: Boolean(disabled) });
  }, [disabled]);

  return (
    <div className={monacoReady ? "monacoShell ready" : "monacoShell"}>
      <div className="monacoMount" ref={containerRef} />
      {!monacoReady && (
        <textarea
          className="codeEditor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          placeholder="여기에 소스 코드를 붙여넣으세요."
        />
      )}
    </div>
  );
}

function ProblemPage({
  api,
  contest,
  participant,
  generalParticipant,
  generalSession,
  problem,
  problems,
  submissions,
  staffSession,
  openProblem,
  openSubmissions
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  generalParticipant: GeneralParticipantContest | null;
  generalSession: GeneralSession | null;
  problem?: Problem;
  problems: Problem[];
  submissions: Submission[];
  staffSession?: StaffSession | null;
  openProblem: (id: string) => void;
  openSubmissions: () => void;
}) {
  const now = useClockTick();
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState("cpp17");
  const [workspaceMode, setWorkspaceMode] = useState<"split" | "statement" | "submit">("split");
  const [localSubmission, setLocalSubmission] = useState<Submission | null>(null);
  const [problemSubmissions, setProblemSubmissions] = useState<Submission[]>([]);
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "waiting" | "done" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [assets, setAssets] = useState<ProblemAsset[]>([]);
  const [packageStatus, setPackageStatus] = useState<ProblemPackageStatus | null>(null);
  const [fallbackParticipant, setFallbackParticipant] = useState<ParticipantSession | null>(null);
  const activeProblem = problem ?? null;
  const activeProblemId = activeProblem?.problem_id ?? "";
  const activeParticipant = participant ?? fallbackParticipant;
  const operatorContest = Boolean(generalSession?.operatorContests.some((entry) => entry.contest.contest_id === contest.contest_id));
  const latest = localSubmission ?? problemSubmissions[0] ?? submissions.find((item) => item.problem_id === activeProblemId);
  const document = parseProblemDocument(activeProblem?.statement ?? "");
  const contestStarted = new Date(contest.start_at).getTime() <= now;
  const contestEnded = contest.status === "ended" || contest.status === "archived" || new Date(contest.end_at).getTime() <= now;
  const contestRunning = contest.status === "running" && contestStarted && !contestEnded;
  const submitBusy = submitState === "submitting" || submitState === "waiting";
  const sourceReady = source.trim().length > 0;
  const showSubmitPanel = !staffSession;
  const submitDisabledReason = !generalSession
    ? "일반 로그인 후 제출할 수 있습니다."
    : !activeParticipant && operatorContest
      ? "운영/서비스 관리자 계정은 제출할 수 없습니다."
    : !activeParticipant && generalParticipant
      ? "참가 세션 준비 중입니다. 잠시만 기다려주세요."
      : !activeParticipant
        ? "이 계정은 이 대회 참가팀으로 등록되어 있지 않습니다."
    : !contestStarted
      ? "대회 시작 전입니다."
      : contestEnded
        ? "대회가 종료되었습니다."
        : contest.status !== "running"
          ? `현재 대회 상태는 ${contest.status}입니다.`
          : !sourceReady
            ? "소스 코드를 입력하세요."
            : "";
  const canSubmit = Boolean(activeParticipant && activeProblem && contestRunning && sourceReady && !submitBusy);

  useEffect(() => {
    setFallbackParticipant(null);
  }, [contest.contest_id]);

  useEffect(() => {
    if (participant || fallbackParticipant || !generalSession || !generalParticipant) return;
    if (generalParticipant.contest.contest_id !== contest.contest_id) return;
    const session = generalSession;
    let cancelled = false;
    async function issueFallbackParticipantSession() {
      try {
        const data = await apiRequest<{ access_token: string; team: ParticipantSession["team"]; member: ParticipantSession["member"]; division: Division }>(
          `/auth/general/contests/${contest.contest_id}/participant-session`,
          session.accessToken,
          { method: "POST" }
        );
        if (!cancelled) {
          setFallbackParticipant({
            accessToken: data.access_token,
            contestId: contest.contest_id,
            team: data.team,
            member: data.member,
            division: data.division
          });
        }
      } catch {
        if (!cancelled) setFallbackParticipant(null);
      }
    }
    issueFallbackParticipantSession();
    return () => {
      cancelled = true;
    };
  }, [
    participant?.accessToken,
    fallbackParticipant?.accessToken,
    generalSession?.accessToken,
    generalParticipant?.contest.contest_id,
    contest.contest_id
  ]);

  useEffect(() => {
    let cancelled = false;
    async function loadAssets() {
      if (!activeProblem) {
        setAssets([]);
        setPackageStatus(null);
        return;
      }
      try {
        if (staffSession) {
          const [data, status] = await Promise.all([
            apiRequest<ProblemAsset[]>(
              `/operator/contests/${contest.contest_id}/problems/${activeProblem.problem_id}/assets`,
              staffSession.accessToken
            ),
            apiRequest<ProblemPackageStatus>(
              `/operator/contests/${contest.contest_id}/problems/${activeProblem.problem_id}/package-status`,
              staffSession.accessToken
            )
          ]);
          if (!cancelled) {
            setAssets(data.filter((asset) => !packageFileRole(asset)));
            setPackageStatus(status);
          }
          return;
        }
        const data = await apiRequest<ProblemAsset[]>(
          `/contests/${contest.contest_id}/problems/${activeProblem.problem_id}/assets`,
          activeParticipant?.accessToken
        );
        if (!cancelled) {
          setAssets(data);
          setPackageStatus(null);
        }
      } catch {
        if (!cancelled) {
          setAssets([]);
          setPackageStatus(null);
        }
      }
    }
    loadAssets();
    return () => {
      cancelled = true;
    };
  }, [activeProblem?.problem_id, contest.contest_id, activeParticipant?.accessToken, staffSession?.accessToken]);

  useEffect(() => {
    let cancelled = false;
    async function loadProblemSubmissions() {
      if (!activeParticipant || !activeProblemId) {
        setProblemSubmissions([]);
        return;
      }
      try {
        const data = await apiRequest<Submission[]>(`/contests/${contest.contest_id}/submissions`, activeParticipant.accessToken);
        if (!cancelled) {
          setProblemSubmissions(data.filter((item) => item.problem_id === activeProblemId).sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()));
        }
      } catch {
        if (!cancelled) setProblemSubmissions([]);
      }
    }
    loadProblemSubmissions();
    return () => {
      cancelled = true;
    };
  }, [activeProblemId, contest.contest_id, activeParticipant?.accessToken]);

  if (!activeProblem) {
    return (
      <section className="pageGrid">
        <PageHeader badge="problem" title="문제" description="현재 참가 유형에 등록된 문제가 없습니다." />
        <section className="panel emptyState">
          <PanelTitle icon={<FileCode2 />} title="문제가 없습니다" />
          <p>대회 운영자가 이 참가 유형에 문제를 등록하면 이 화면에 표시됩니다.</p>
        </section>
      </section>
    );
  }
  const historyRows = problemSubmissions.map((item) => [
    item.submission_id.slice(0, 8),
    formatTime(item.submitted_at),
    item.language,
    <SubmissionStatusBadge submission={item} compact />,
    item.awarded_score ?? "-",
    item.source_code ? `${item.source_code.length} B` : "-"
  ]);

  async function submitCode() {
    if (!canSubmit) {
      setSubmitState("error");
      setSubmitMessage(submitDisabledReason || "현재 제출할 수 없습니다.");
      return;
    }
    if (!activeParticipant) return;
    setSubmitState("submitting");
    setSubmitMessage("제출을 전송하고 있습니다.");
    try {
      const created = await apiRequest<Submission>(
        `/contests/${contest.contest_id}/problems/${activeProblemId}/submissions`,
        activeParticipant.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ language, source_code: source })
        }
      );
      setLocalSubmission(created);
      setProblemSubmissions((items) => [created, ...items.filter((item) => item.submission_id !== created.submission_id)]);
      setSubmitState("waiting");
      setSubmitMessage("채점 대기 중 · 0%");
      let judged = created;
      for (let attempt = 0; attempt < 24; attempt += 1) {
        judged = await apiRequest<Submission>(
          `/contests/${contest.contest_id}/submissions/${created.submission_id}/status:wait?wait_seconds=2&poll_interval_seconds=0.25`,
          activeParticipant.accessToken
        );
        setLocalSubmission(judged);
        setProblemSubmissions((items) => [judged, ...items.filter((item) => item.submission_id !== judged.submission_id)]);
        const progressText = submissionProgressText(judged);
        if (isSubmissionTerminal(judged.status)) {
          setSubmitState("done");
          setSubmitMessage(`채점 완료 · ${submissionStatusLabel(judged.status)}`);
          return;
        }
        setSubmitState("waiting");
        setSubmitMessage(`${submissionStatusLabel(judged.status)}${progressText ? ` · ${progressText}` : ""}`);
      }
      setSubmitState("waiting");
      setSubmitMessage(`${submissionStatusLabel(judged.status)}${submissionProgressText(judged) ? ` · ${submissionProgressText(judged)}` : ""} · 채점 현황에서 계속 확인하세요.`);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "제출에 실패했습니다.");
    }
  }

  return (
    <section className={`problemLayout ${workspaceMode === "statement" ? "focusStatement" : workspaceMode === "submit" ? "focusSubmit" : ""} ${showSubmitPanel ? "" : "readonlyProblemLayout"}`}>
      <div className="problemWorkspaceBar">
        <div className="viewSwitch" aria-label="문제 제출 화면 배치">
          <button className={workspaceMode === "split" ? "active" : ""} onClick={() => setWorkspaceMode("split")}>{showSubmitPanel ? "문제 + 제출" : "문제"}</button>
          <button className={workspaceMode === "statement" ? "active" : ""} onClick={() => setWorkspaceMode("statement")}>문제만</button>
          {showSubmitPanel && <button className={workspaceMode === "submit" ? "active" : ""} onClick={() => setWorkspaceMode("submit")}>제출만</button>}
        </div>
        {showSubmitPanel && (
          <div className={canSubmit ? "submitAvailability available" : "submitAvailability blocked"}>
            <span>{canSubmit ? "제출 가능" : "제출 불가"}</span>
            <strong>{canSubmit ? `남은 시간 ${timeLeft(contest.end_at)}` : submitDisabledReason}</strong>
          </div>
        )}
      </div>
      <aside className="problemNav">
        <PanelTitle icon={<Search />} title="문제 이동" />
        {problems.map((item) => (
          <button
            key={item.problem_id}
            className={item.problem_id === activeProblem.problem_id ? "active" : ""}
            onClick={() => openProblem(item.problem_id)}
          >
            {item.problem_code}. {item.title}
          </button>
        ))}
      </aside>
      <article className="statementPanel">
        <h1>{activeProblem.title}</h1>
        <div className="limitBar">
          <span>시간 {activeProblem.time_limit_ms / 1000}s</span>
          <span>메모리 {activeProblem.memory_limit_mb}MB</span>
          <span>점수 {activeProblem.max_score}</span>
        </div>
        {staffSession && packageStatus && !packageStatus.ready && (
          <section className="problemHealthBanner">
            <AlertTriangle size={18} />
            <span>{packageStatus.warnings.join(" ")}</span>
          </section>
        )}
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
      </article>
      {showSubmitPanel && (
      <aside className="submitPanel">
        <PanelTitle icon={<FileCode2 />} title="제출" />
        <select value={language} onChange={(event) => setLanguage(event.target.value)}>
          <option value="c99">C99</option>
          <option value="cpp17">C++17</option>
          <option value="python313">Python 3.13</option>
          <option value="java8">Java 8</option>
        </select>
        <CodeEditor value={source} language={language} onChange={setSource} disabled={submitBusy} />
        <div className={canSubmit ? "submitStatusBox available" : "submitStatusBox blocked"}>
          <strong>{canSubmit ? "제출 대기" : "제출 비활성화"}</strong>
          <span>{canSubmit ? "현재 대회 시간이 유효합니다." : submitDisabledReason}</span>
        </div>
        <button onClick={submitCode} disabled={!canSubmit}>
          <Code2 size={16} />
          {submitBusy ? "채점 대기" : "제출"}
        </button>
        {submitMessage && <p className={`submitMessage ${submitState}`}>{submitMessage}</p>}
        {localSubmission && (
          <button className="secondaryButton" onClick={openSubmissions}>
            <History size={16} />
            채점 현황으로 이동
          </button>
        )}
        <dl className="submissionMeta">
          <div><dt>제출 번호</dt><dd>{latest?.submission_id.slice(0, 8) ?? "-"}</dd></div>
          <div><dt>제출 시간</dt><dd>{formatTime(latest?.submitted_at)}</dd></div>
          <div><dt>채점 결과</dt><dd>{latest ? <SubmissionStatusBadge submission={latest} /> : "미제출"}</dd></div>
          <div><dt>코드 길이</dt><dd>{source.length} B</dd></div>
          <div><dt>남은 시간</dt><dd>{timeLeft(contest.end_at)}</dd></div>
        </dl>
        <section className="problemSubmissionHistory">
          <PanelTitle icon={<History />} title="이 문제 제출 기록" />
          {historyRows.length ? (
            <DataTable columns={["번호", "시간", "언어", "결과", "점수", "길이"]} rows={historyRows} />
          ) : (
            <p className="mutedText">아직 이 문제에 제출한 기록이 없습니다.</p>
          )}
        </section>
      </aside>
      )}
    </section>
  );
}

function SubmissionsPage({
  api,
  contest,
  participant,
  division,
  setDivisionId,
  staffSession
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  division: Division;
  setDivisionId: (id: string) => void;
  staffSession?: StaffSession | null;
}) {
  useClockTick();
  const [items, setItems] = useState<Submission[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 20;
  const problemMap = useMemo(
    () => new Map((api.problems[division.division_id] ?? api.problems[division.code] ?? Object.values(api.problems).flat()).map((problem) => [problem.problem_id, problem])),
    [api.problems, division]
  );
  const filteredItems = useMemo(
    () => (staffSession ? items.filter((item) => !item.division_id || item.division_id === division.division_id) : items),
    [items, staffSession, division.division_id]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadSubmissions() {
      if (!participant) {
        if (!staffSession) {
          setItems([]);
          setStatus("idle");
          setMessage("참가팀 로그인 후 자기 팀 제출만 표시됩니다.");
          return;
        }
        setStatus("loading");
        setMessage("제출 목록을 불러오는 중입니다.");
        try {
          const data = await apiRequest<Submission[]>(`/operator/contests/${contest.contest_id}/submissions`, staffSession.accessToken);
          if (!cancelled) {
            setItems(data);
            setStatus("ready");
            setMessage("운영자 권한으로 전체 제출을 표시 중입니다.");
          }
        } catch (error) {
          if (!cancelled) {
            setItems(api.submissions);
            setStatus("error");
            setMessage(formatApiError(error, "제출 목록을 불러오지 못했습니다"));
          }
        }
        return;
      }
      setStatus("loading");
      setMessage("제출 목록을 불러오는 중입니다.");
      try {
        const data = await apiRequest<Submission[]>(`/contests/${contest.contest_id}/submissions`, participant.accessToken);
        if (!cancelled) {
          setItems(data);
          setStatus("ready");
          setMessage("자기 팀 제출만 표시 중입니다.");
        }
      } catch (error) {
        if (!cancelled) {
          setItems(api.submissions);
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "제출 목록을 불러오지 못했습니다.");
        }
      }
    }
    loadSubmissions();
    return () => {
      cancelled = true;
    };
  }, [api.submissions, contest.contest_id, participant, staffSession?.accessToken]);

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedSubmissionId("");
      return;
    }
    if (!filteredItems.some((item) => item.submission_id === selectedSubmissionId)) {
      setSelectedSubmissionId(filteredItems[0].submission_id);
    }
  }, [filteredItems, selectedSubmissionId]);
  useEffect(() => {
    setPageIndex(1);
  }, [participant?.team.team_name, staffSession?.staff.email, contest.contest_id, division.division_id]);

  const solvedCount = filteredItems.filter((item) => item.status === "accepted").length;
  const judgingCount = filteredItems.filter((item) => ["waiting", "preparing", "judging"].includes(item.status)).length;
  const selectedSubmission = filteredItems.find((item) => item.submission_id === selectedSubmissionId) ?? filteredItems[0] ?? null;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(pageIndex, totalPages);
  const pagedItems = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <section className="pageGrid">
      <PageHeader badge="submissions" title="채점 현황" description="대회 중에는 로그인한 참가팀의 제출만 확인합니다." />
      {staffSession ? (
        <Segmented options={api.divisions} value={division.division_id} onChange={setDivisionId} />
      ) : (
        <DivisionLock division={division} />
      )}
      <section className="summaryGrid">
        <InfoCard icon={<Users />} title="범위" value={participant?.team.team_name ?? (staffSession ? "전체 제출" : "로그인 필요")} detail={participant?.division.name ?? (staffSession ? "운영자" : "참가자 인증")} />
        <InfoCard icon={<FileCode2 />} title="제출" value={String(filteredItems.length)} detail="current list" />
        <InfoCard icon={<CheckCircle2 />} title="Accepted" value={String(solvedCount)} detail="accepted submissions" />
        <InfoCard icon={<Activity />} title="채점 중" value={String(judgingCount)} detail="waiting/preparing/judging" />
      </section>
      {message && <p className={`submitMessage ${status === "error" ? "error" : status === "ready" ? "done" : ""}`}>{message}</p>}
      <section className="panel">
        <div className="panel">
        <DataTable
          columns={staffSession ? ["제출 번호", "팀", "문제", "언어", "상태", "점수", "제출 시간", "상세"] : ["제출 번호", "문제", "언어", "상태", "점수", "제출 시간", "코드 길이", "재채점"]}
          rows={pagedItems.map((item) => {
            const problem = problemMap.get(item.problem_id);
            if (staffSession) {
              return [
                item.submission_id.slice(0, 8),
                item.team_name ?? item.participant_team_id?.slice(0, 8) ?? "-",
                problem ? `${problem.problem_code}. ${problem.title}` : item.problem_id.slice(0, 8),
                item.language,
                <SubmissionStatusBadge submission={item} compact />,
                item.awarded_score ?? "-",
                <time title={formatDate(item.submitted_at)}>{formatRelativeTime(item.submitted_at)}</time>,
                <button className="textButton" onClick={() => { setSelectedSubmissionId(item.submission_id); setSubmissionModalOpen(true); }}>상세</button>
              ];
            }
            return [
              item.submission_id.slice(0, 8),
              problem ? `${problem.problem_code}. ${problem.title}` : item.problem_id.slice(0, 8),
              item.language,
              <SubmissionStatusBadge submission={item} compact />,
              item.awarded_score ?? "-",
              <time title={formatDate(item.submitted_at)}>{formatRelativeTime(item.submitted_at)}</time>,
              item.source_code ? `${item.source_code.length} B` : "-",
              "재채점 없음"
            ];
          })}
        />
        {filteredItems.length > 0 && <SimplePagination page={safePage} totalPages={totalPages} onChange={setPageIndex} />}
        </div>
        {staffSession && submissionModalOpen && selectedSubmission && (
          <div className="modalOverlay" onClick={() => setSubmissionModalOpen(false)}>
          <aside className="panel submissionInspector modalPanel" onClick={(event) => event.stopPropagation()}>
            <div className="panelTitleRow">
              <PanelTitle icon={<FileCode2 />} title="제출 상세" />
              <div className="tableActions">
                <SubmissionStatusBadge submission={selectedSubmission} compact />
                <button className="secondary" onClick={() => setSubmissionModalOpen(false)}>닫기</button>
              </div>
            </div>
            <dl className="submissionDetailMeta">
              <div><dt>제출 번호</dt><dd>{selectedSubmission.submission_id}</dd></div>
              <div><dt>팀</dt><dd>{selectedSubmission.team_name ?? "-"}</dd></div>
              <div><dt>제출자</dt><dd>{selectedSubmission.member_name ?? selectedSubmission.member_email ?? "-"}</dd></div>
              <div><dt>문제</dt><dd>{problemMap.get(selectedSubmission.problem_id)?.title ?? selectedSubmission.problem_id}</dd></div>
              <div><dt>언어</dt><dd>{selectedSubmission.language}</dd></div>
              <div><dt>점수</dt><dd>{selectedSubmission.awarded_score ?? "-"}</dd></div>
              <div><dt>실패 케이스</dt><dd>{selectedSubmission.failed_testcase_order ? `#${selectedSubmission.failed_testcase_order}` : "-"}</dd></div>
              <div><dt>제출 시각</dt><dd>{formatDate(selectedSubmission.submitted_at)}</dd></div>
            </dl>
            {(selectedSubmission.compile_message || selectedSubmission.judge_message) && (
              <section className="submissionDetailSection">
                <h3>채점 메시지</h3>
                {selectedSubmission.compile_message && (
                  <div className="submissionLogBlock">
                    <strong>컴파일 로그</strong>
                    <pre>{selectedSubmission.compile_message}</pre>
                  </div>
                )}
                {selectedSubmission.judge_message && (
                  <div className="submissionLogBlock">
                    <strong>판정 상세</strong>
                    <pre>{selectedSubmission.judge_message}</pre>
                  </div>
                )}
              </section>
            )}
            <section className="submissionDetailSection">
              <h3>제출 코드</h3>
              <pre className="sourcePreview">{selectedSubmission.source_code || ""}</pre>
            </section>
          </aside>
          </div>
        )}
      </section>
    </section>
  );
}

function ScoreboardPage({
  api,
  contest,
  participant,
  division,
  locked,
  staffSession,
  setDivisionId
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  division: Division;
  locked: boolean;
  staffSession?: StaffSession | null;
  setDivisionId: (id: string) => void;
}) {
  const [liveRows, setLiveRows] = useState<ScoreboardRow[]>([]);
  const [frozen, setFrozen] = useState(false);
  const [message, setMessage] = useState("");
  const canSelectDivision = Boolean(staffSession) || !locked;
  const fallbackRowsForDivision = api.scoreboard.filter((row) => !row.division || row.division === division.name);
  const rows = liveRows.length ? liveRows : fallbackRowsForDivision;
  const problemCodes = Array.from(new Set(rows.flatMap((row) => row.problem_scores.map((score) => score.problem_code)))).sort();
  const freezeWarning = freezeAnnouncement(contest);
  const endWarning = contestEndAnnouncement(contest);

  useEffect(() => {
    let cancelled = false;
    async function loadOnce(waitSeconds: number) {
      const path = staffSession
        ? `/operator/contests/${contest.contest_id}/divisions/${division.division_id}/scoreboard/internal`
        : participant
        ? `/contests/${contest.contest_id}/scoreboard${waitSeconds ? ":wait" : ""}?wait_seconds=${waitSeconds}`
        : `/contests/${contest.contest_id}/divisions/${division.division_id}/scoreboard${waitSeconds ? ":wait" : ""}?wait_seconds=${waitSeconds}`;
      try {
        const data = await apiRequest<ScoreboardResponse | OperatorScoreboardResponse>(path, staffSession?.accessToken ?? participant?.accessToken);
        if (!cancelled) {
          setLiveRows(data.rows);
          const nextFrozen = "frozen" in data ? data.frozen : data.frozen_public_view;
          setFrozen(nextFrozen);
          setMessage(staffSession ? "운영자 내부 스코어보드 갱신 중입니다." : nextFrozen ? "스코어보드는 프리즈 시점 기준으로 표시됩니다." : "실시간 스코어보드 갱신 중입니다.");
        }
      } catch (error) {
        if (!cancelled) setMessage(formatApiError(error, "스코어보드 갱신 실패"));
      }
    }
    async function loop() {
      await loadOnce(0);
      while (!cancelled && !staffSession) {
        await loadOnce(2);
      }
      if (!cancelled && staffSession) {
        const timer = window.setInterval(() => loadOnce(0), 2000);
        while (!cancelled) await new Promise((resolve) => window.setTimeout(resolve, 1000));
        window.clearInterval(timer);
      }
    }
    loop();
    return () => {
      cancelled = true;
    };
  }, [contest.contest_id, division.division_id, participant?.accessToken, staffSession?.accessToken]);

  return (
    <section className="pageGrid">
      <PageHeader badge="scoreboard" title="스코어보드" description={!canSelectDivision ? `로그인한 팀의 ${division.name} 참가 유형 순위만 표시합니다.` : `${division.name} 유형 기준 순위입니다.`} />
      {canSelectDivision ? (
        <Segmented options={api.divisions} value={division.division_id} onChange={setDivisionId} />
      ) : (
        <DivisionLock division={division} />
      )}
      {endWarning && (
        <section className="emergencyBox">
          <Timer size={18} />
          <span>{endWarning}</span>
        </section>
      )}
      {freezeWarning && (
        <section className="emergencyBox">
          <AlertTriangle size={18} />
          <span>{freezeWarning}</span>
        </section>
      )}
      <section className="summaryGrid">
        <InfoCard icon={<Timer />} title="남은 시간" value={timeLeft(contest.end_at)} detail={`freeze ${formatTime(contest.freeze_at)}`} />
        <InfoCard icon={<Lock />} title="프리징" value={frozen || isFrozen(contest) ? "ON" : "OFF"} detail="프리즈 시점 순위 노출" />
        <InfoCard icon={<Users />} title="팀 수" value={String(rows.length)} detail={division.name} />
        <InfoCard icon={<Activity />} title="큐" value={String(api.judgeStatus?.total_queue_depth ?? 0)} detail="pending jobs" />
      </section>
      {message && <p className={`submitMessage ${message.includes("실패") ? "error" : "done"}`}>{message}</p>}
      <p className="panelNote">문제 칸 표기: +(1트 정답), +n(정답 전 오답 n회), -n(오답 n회, 미해결). 오른쪽 작은 숫자는 현재 점수입니다.</p>
      <section className="panel">
        <table className="scoreboardTable">
          <thead>
            <tr>
              <th>순위</th>
              <th>팀명</th>
              <th>해결</th>
              <th>점수</th>
              <th>시도</th>
              {problemCodes.map((code) => <th key={code}>{code}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team_name}>
                <td>{row.rank}</td>
                <td><strong>{row.team_name}</strong></td>
                <td>{row.solved}</td>
                <td>{row.score}</td>
                <td>{row.submission_count}</td>
                {problemCodes.map((code) => {
                  const score = row.problem_scores.find((item) => item.problem_code === code);
                  return <td key={code}><ResultCell problemScore={score} /></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

function BoardPage({ api, contest, participant, staffSession }: { api: ApiState; contest: Contest; participant: ParticipantSession | null; staffSession?: StaffSession | null }) {
  const [notices, setNotices] = useState<ContestNotice[]>([]);
  const [questions, setQuestions] = useState<ContestQuestion[]>([]);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"notices" | "questions">("questions");
  const [noticeComposerOpen, setNoticeComposerOpen] = useState(false);
  const [questionComposerOpen, setQuestionComposerOpen] = useState(false);
  const [openAnswerComposer, setOpenAnswerComposer] = useState<string | null>(null);
  const [selectedNoticeId, setSelectedNoticeId] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeEmergency, setNoticeEmergency] = useState(false);
  const [noticeVisibility, setNoticeVisibility] = useState<"public" | "participants">("public");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [questionVisibility, setQuestionVisibility] = useState<"public" | "private">("public");
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [answerVisibility, setAnswerVisibility] = useState<Record<string, "public" | "questioner">>({});

  async function loadBoard() {
    try {
      const token = staffSession?.accessToken ?? participant?.accessToken;
      const noticePath = staffSession ? `/operator/contests/${contest.contest_id}/notices` : `/contests/${contest.contest_id}/notices`;
      const boardPath = staffSession ? `/operator/contests/${contest.contest_id}/boards` : `/contests/${contest.contest_id}/boards`;
      const [nextNotices, nextQuestions] = await Promise.all([
        apiRequest<ContestNotice[]>(noticePath, token),
        apiRequest<ContestQuestion[]>(boardPath, token)
      ]);
      const sortedNotices = [...nextNotices].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
      const sortedQuestions = [...nextQuestions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setNotices(sortedNotices);
      setQuestions(sortedQuestions);
      setSelectedNoticeId((current) => current && sortedNotices.some((notice) => notice.contest_notice_id === current) ? current : sortedNotices[0]?.contest_notice_id ?? "");
      setSelectedQuestionId((current) => current && sortedQuestions.some((question) => question.contest_question_id === current) ? current : sortedQuestions[0]?.contest_question_id ?? "");
      setMessage("");
    } catch (error) {
      setMessage(formatApiError(error, "게시판을 불러오지 못했습니다"));
    }
  }

  useEffect(() => {
    loadBoard();
  }, [contest.contest_id, participant?.accessToken, staffSession?.accessToken]);
  useAutoRefresh(() => loadBoard(), true, 10000);

  async function createNotice() {
    if (!staffSession) return;
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      setMessage("공지 제목과 본문을 입력하세요.");
      return;
    }
    try {
      const notice = await apiRequest<ContestNotice>(`/operator/contests/${contest.contest_id}/notices`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          title: noticeTitle,
          body: noticeBody,
          pinned: noticePinned,
          emergency: noticeEmergency,
          visibility: noticeVisibility
        })
      });
      setNotices((current) => [notice, ...current]);
      setSelectedNoticeId(notice.contest_notice_id);
      setNoticeTitle("");
      setNoticeBody("");
      setNoticePinned(false);
      setNoticeEmergency(false);
      setNoticeVisibility("public");
      setNoticeComposerOpen(false);
      setMessage("공지 등록 완료");
    } catch (error) {
      setMessage(formatApiError(error, "공지 등록 실패"));
    }
  }

  async function createQuestion() {
    if (!participant) {
      setMessage("질문 작성은 참가팀 로그인이 필요합니다.");
      return;
    }
    if (!questionTitle.trim() || !questionBody.trim()) {
      setMessage("질문 제목과 내용을 입력하세요.");
      return;
    }
    try {
      const question = await apiRequest<ContestQuestion>(`/contests/${contest.contest_id}/boards`, participant.accessToken, {
        method: "POST",
        body: JSON.stringify({ title: questionTitle, body: questionBody, visibility: questionVisibility })
      });
      setQuestions((current) => [question, ...current]);
      setSelectedQuestionId(question.contest_question_id);
      setQuestionTitle("");
      setQuestionBody("");
      setQuestionVisibility("public");
      setQuestionComposerOpen(false);
      setMessage("질문 등록 완료");
    } catch (error) {
      setMessage(formatApiError(error, "질문 등록 실패"));
    }
  }

  async function createAnswer(questionId: string) {
    if (!staffSession) return;
    if (!(answerDrafts[questionId] ?? "").trim()) {
      setMessage("답변 내용을 입력하세요.");
      return;
    }
    try {
      const answer = await apiRequest<ContestAnswer>(`/operator/contests/${contest.contest_id}/boards/${questionId}/answers`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({ body: answerDrafts[questionId] ?? "", visibility: answerVisibility[questionId] ?? "public" })
      });
      setQuestions((current) =>
        current.map((question) =>
          question.contest_question_id === questionId ? { ...question, answers: [...question.answers, answer] } : question
        )
      );
      setAnswerDrafts((current) => ({ ...current, [questionId]: "" }));
      setAnswerVisibility((current) => ({ ...current, [questionId]: "public" }));
      setOpenAnswerComposer(null);
      setMessage("답변 등록 완료");
    } catch (error) {
      setMessage(formatApiError(error, "답변 등록 실패"));
    }
  }

  const selectedNotice = notices.find((notice) => notice.contest_notice_id === selectedNoticeId) ?? notices[0] ?? null;
  const selectedQuestion = questions.find((question) => question.contest_question_id === selectedQuestionId) ?? questions[0] ?? null;
  const noticeCount = notices.length;
  const questionCount = questions.length;
  const answerCount = questions.reduce((total, question) => total + question.answers.length, 0);

  return (
    <section className="pageGrid">
      <PageHeader badge="board" title="대회 공지와 질문 게시판" description="서비스 공지는 홈에서, 대회 공지와 질문은 대회 단위로 분리합니다." />
      {!!notices.length && (
        <section className="panel boardNoticeSummary">
          <PanelTitle icon={<Megaphone />} title="최근 공지" />
          <div className="boardNoticeSummaryList">
            {notices.slice(0, 3).map((notice) => (
              <button key={notice.contest_notice_id} className="textButton" onClick={() => { setMode("notices"); setSelectedNoticeId(notice.contest_notice_id); }}>
                <span>{notice.emergency ? "[긴급] " : ""}{notice.title}</span>
                <time>{formatDate(notice.published_at)}</time>
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="segmented boardTabs">
        <button className={mode === "notices" ? "active" : ""} onClick={() => setMode("notices")}>공지 {noticeCount}</button>
        <button className={mode === "questions" ? "active" : ""} onClick={() => setMode("questions")}>질문 {questionCount}</button>
      </div>
      <section className="summaryGrid">
        <InfoCard icon={<Bell />} title="공지" value={String(noticeCount)} detail="운영자 게시" />
        <InfoCard icon={<MessageSquare />} title="질문" value={String(questionCount)} detail="참가팀 질문" />
        <InfoCard icon={<ShieldCheck />} title="답변" value={String(answerCount)} detail="운영자 응답" />
        <InfoCard icon={<Lock />} title="권한" value={staffSession ? "운영/참가" : participant ? "참가" : "읽기"} detail="세션 기반" />
      </section>
      {message && <p className={`submitMessage ${message.includes("실패") || message.includes("못했습니다") ? "error" : "done"}`}>{message}</p>}
      {mode === "notices" ? (
        <section className="boardStreamLayout">
          <div className="boardStreamColumn">
            <div className="panelTitleRow">
              <PanelTitle icon={<Bell />} title="대회 공지" />
              <div className="tableActions">
                {staffSession && <button onClick={() => setNoticeComposerOpen((open) => !open)}><Megaphone size={16} /> 공지 작성</button>}
              </div>
            </div>
            {noticeComposerOpen && staffSession && (
              <section className="boardComposerCard compact">
                <div className="fieldGrid">
                  <label><span>제목</span><input value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} autoFocus /></label>
                  <label><span>노출 범위</span><select value={noticeVisibility} onChange={(event) => setNoticeVisibility(event.target.value as "public" | "participants")}><option value="public">전체 공개</option><option value="participants">참가자만</option></select></label>
                  <label className="checkboxLine"><input type="checkbox" checked={noticePinned} onChange={(event) => setNoticePinned(event.target.checked)} /> 상단 고정</label>
                  <label className="checkboxLine"><input type="checkbox" checked={noticeEmergency} onChange={(event) => setNoticeEmergency(event.target.checked)} /> 긴급 공지</label>
                </div>
                <textarea value={noticeBody} placeholder="공지 내용을 입력하세요." onChange={(event) => setNoticeBody(event.target.value)} />
                <div className="buttonRow">
                  <button onClick={createNotice}><Plus size={16} /> 등록</button>
                  <button className="secondary" onClick={() => setNoticeComposerOpen(false)}>취소</button>
                </div>
              </section>
            )}
            <div className="boardThreadFeed">
              {notices.length ? notices.map((notice) => {
                const active = selectedNotice?.contest_notice_id === notice.contest_notice_id;
                return (
                  <button
                    key={notice.contest_notice_id}
                    type="button"
                    className={active ? "boardThreadCard active" : notice.emergency ? "boardThreadCard emergency" : "boardThreadCard"}
                    onClick={() => setSelectedNoticeId(notice.contest_notice_id)}
                  >
                    <div className="boardThreadHeader">
                      <div className="boardAvatar">A</div>
                      <div>
                        <strong>{notice.title}</strong>
                        <span>{formatDate(notice.published_at)}</span>
                      </div>
                    </div>
                    <p>{notice.body.replace(/\s+/g, " ").trim()}</p>
                    <div className="boardThreadMeta">
                      {notice.pinned && <span className="statusPill active">상단</span>}
                      {notice.emergency && <span className="statusPill failed">긴급</span>}
                      <span className="statusPill scheduled">{notice.visibility === "participants" ? "참가자" : "공개"}</span>
                    </div>
                  </button>
                );
              }) : <div className="boardEmpty">등록된 공지가 없습니다.</div>}
            </div>
          </div>
          <article className="boardFocusPane">
            {selectedNotice ? (
              <>
                <div className="boardFocusHeader">
                  <div>
                    <span className={selectedNotice.emergency ? "statusPill failed" : "statusPill active"}>{selectedNotice.emergency ? "긴급 공지" : "공지"}</span>
                    <h2>{selectedNotice.title}</h2>
                    <small>{formatDate(selectedNotice.published_at)}</small>
                  </div>
                </div>
                <MarkdownPreview statement={selectedNotice.body} assets={[]} />
              </>
            ) : (
              <div className="boardEmpty">
                <strong>공지 선택</strong>
                <span>왼쪽 스트림에서 공지를 선택하세요.</span>
              </div>
            )}
          </article>
        </section>
      ) : (
        <section className="boardStreamLayout">
          <div className="boardStreamColumn">
            <div className="panelTitleRow">
              <PanelTitle icon={<MessageSquare />} title="질문 게시판" />
              <div className="tableActions">
                {participant ? (
                  <button onClick={() => setQuestionComposerOpen((open) => !open)}><Plus size={16} /> 질문 작성</button>
                ) : (
                  <span className="panelNote">참가팀 로그인 후 질문 작성 가능</span>
                )}
              </div>
            </div>
            {questionComposerOpen && participant && (
              <section className="boardComposerCard compact">
                <div className="fieldGrid">
                  <label><span>제목</span><input value={questionTitle} onChange={(event) => setQuestionTitle(event.target.value)} autoFocus /></label>
                  <label><span>공개 여부</span><select value={questionVisibility} onChange={(event) => setQuestionVisibility(event.target.value as "public" | "private")}><option value="public">공개 질문</option><option value="private">비공개 질문</option></select></label>
                </div>
                <textarea value={questionBody} placeholder="질문 내용을 입력하세요." onChange={(event) => setQuestionBody(event.target.value)} />
                <div className="buttonRow">
                  <button onClick={createQuestion}><Plus size={16} /> 등록</button>
                  <button className="secondary" onClick={() => setQuestionComposerOpen(false)}>취소</button>
                </div>
              </section>
            )}
            <div className="boardThreadFeed">
              {questions.length ? questions.map((question) => {
                const active = selectedQuestion?.contest_question_id === question.contest_question_id;
                return (
                  <button
                    key={question.contest_question_id}
                    type="button"
                    className={active ? "boardThreadCard active" : "boardThreadCard"}
                    onClick={() => setSelectedQuestionId(question.contest_question_id)}
                  >
                    <div className="boardThreadHeader">
                      <div className="boardAvatar">{(question.team_name ?? "T").slice(0, 1).toUpperCase()}</div>
                      <div>
                        <strong>{question.title}</strong>
                        <span>{question.team_name ?? "팀"} · {formatDate(question.created_at)}</span>
                      </div>
                    </div>
                    <p>{question.body.replace(/\s+/g, " ").trim()}</p>
                    <div className="boardThreadMeta">
                      <span className="statusPill scheduled">{question.visibility === "private" ? "비공개" : "공개"}</span>
                      <span className="statusPill">{question.answers.length} replies</span>
                    </div>
                  </button>
                );
              }) : <div className="boardEmpty">등록된 질문이 없습니다.</div>}
            </div>
          </div>
          <article className="boardFocusPane">
            {selectedQuestion ? (
              <>
                <div className="boardFocusHeader">
                  <div>
                    <span className="statusPill scheduled">{selectedQuestion.visibility === "private" ? "비공개" : "공개"}</span>
                    <h2>{selectedQuestion.title}</h2>
                    <small>{selectedQuestion.team_name ?? "팀"} · {formatDate(selectedQuestion.created_at)}</small>
                  </div>
                  {staffSession && (
                    <button className="secondary" onClick={() => setOpenAnswerComposer(openAnswerComposer === selectedQuestion.contest_question_id ? null : selectedQuestion.contest_question_id)}>
                      답변
                    </button>
                  )}
                </div>
                <MarkdownPreview statement={selectedQuestion.body} assets={[]} />
                <section className="boardReplyStream">
                  {selectedQuestion.answers.map((answer) => (
                    <article className="boardReplyCard" key={answer.contest_answer_id}>
                      <div className="boardThreadHeader compact">
                        <div className="boardAvatar reply">O</div>
                        <div>
                          <strong>운영자 답변</strong>
                          <span>{formatDate(answer.created_at)}</span>
                        </div>
                        <span className="statusPill active">{answer.visibility === "questioner" ? "질문자만" : "전체 공개"}</span>
                      </div>
                      <MarkdownPreview statement={answer.body} assets={[]} />
                    </article>
                  ))}
                  {!selectedQuestion.answers.length && <div className="boardEmpty">아직 답변이 없습니다.</div>}
                </section>
                {staffSession && openAnswerComposer === selectedQuestion.contest_question_id && (
                  <section className="boardComposerCard compact">
                    <div className="fieldGrid compact">
                      <label><span>답변 공개</span><select value={answerVisibility[selectedQuestion.contest_question_id] ?? "public"} onChange={(event) => setAnswerVisibility((current) => ({ ...current, [selectedQuestion.contest_question_id]: event.target.value as "public" | "questioner" }))}>
                        <option value="public">전체 공개</option>
                        <option value="questioner">질문자만</option>
                      </select></label>
                    </div>
                    <textarea placeholder="답변 내용을 입력하세요." value={answerDrafts[selectedQuestion.contest_question_id] ?? ""} onChange={(event) => setAnswerDrafts((current) => ({ ...current, [selectedQuestion.contest_question_id]: event.target.value }))} />
                    <div className="buttonRow">
                      <button onClick={() => createAnswer(selectedQuestion.contest_question_id)}>답변 등록</button>
                      <button className="secondary" onClick={() => setOpenAnswerComposer(null)}>취소</button>
                    </div>
                  </section>
                )}
              </>
            ) : (
              <div className="boardEmpty">
                <strong>질문 선택</strong>
                <span>왼쪽 스트림에서 질문을 선택하세요.</span>
              </div>
            )}
          </article>
        </section>
      )}
    </section>
  );
}

function JudgeStatusPage({ api }: { api: ApiState }) {
  return (
    <section className="pageGrid">
      <PageHeader badge="judge" title="채점상태" description="채점 노드, 실행 중 job, 대기열을 확인합니다." />
      <section className="summaryGrid">
        <InfoCard icon={<Server />} title="노드" value={String(api.judgeStatus?.active_node_count ?? 0)} detail="active" />
        <InfoCard icon={<Activity />} title="실행 중" value={String(api.judgeStatus?.total_running_jobs ?? 0)} detail="running jobs" />
        <InfoCard icon={<Gauge />} title="대기열" value={String(api.judgeStatus?.total_queue_depth ?? 0)} detail="pending jobs" />
        <InfoCard icon={<Database />} title="할당 방식" value="internal claim" detail={api.judgeStatus?.allocation_policy ?? "FIFO"} />
      </section>
    </section>
  );
}

function OperatorPage({
  contestId,
  staffSession,
  setDivisionId,
  navigate,
  onLogout
}: {
  contestId?: string;
  staffSession: StaffSession;
  setDivisionId: (id: string) => void;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  onLogout: () => void;
}) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [message, setMessage] = useState("");

  const loadOperatorHome = useCallback(async (silent = false) => {
    if (!silent) setMessage("운영 권한 대회 정보를 불러오는 중입니다.");
    try {
      if (!contestId) {
        const data = await apiRequest<Contest[]>("/operator/contests", staffSession.accessToken);
        setContests(data);
        setDashboard(null);
        if (!silent) setMessage(data.length ? "" : "할당된 대회가 없습니다.");
        return;
      }
      const data = await apiRequest<OperatorDashboard>(`/operator/contests/${contestId}/dashboard`, staffSession.accessToken);
      setDashboard(data);
      if (!silent) setMessage("");
    } catch (error) {
      if (contestId && error instanceof ApiClientError && error.code === "scope_denied") {
        setDashboard(null);
        navigate("operator");
        setMessage("이 대회 권한이 없어 운영자 대회 목록으로 이동합니다.");
        return;
      }
      setMessage(formatApiError(error, "운영자 정보를 불러오지 못했습니다"));
    }
  }, [contestId, staffSession.accessToken, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!contestId) {
          const data = await apiRequest<Contest[]>("/operator/contests", staffSession.accessToken);
          if (!cancelled) {
            setContests(data);
            setDashboard(null);
            setMessage(data.length ? "" : "할당된 대회가 없습니다.");
          }
          return;
        }
        const data = await apiRequest<OperatorDashboard>(`/operator/contests/${contestId}/dashboard`, staffSession.accessToken);
        if (!cancelled) {
          setDashboard(data);
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          if (contestId && error instanceof ApiClientError && error.code === "scope_denied") {
            setDashboard(null);
            navigate("operator");
            setMessage("이 대회 권한이 없어 운영자 대회 목록으로 이동합니다.");
            return;
          }
          setMessage(formatApiError(error, "운영자 정보를 불러오지 못했습니다"));
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadOperatorHome]);
  useAutoRefresh(() => loadOperatorHome(true), true, 15000);

  if (!contestId) {
    return (
      <section className="pageGrid operatorWorkspace">
        <section className="operatorHero">
          <div className="operatorHeroMain">
            <span className="sectionKicker">operator</span>
            <h1>운영 권한 대회</h1>
            <p>본인에게 할당된 대회를 정리된 카드로 확인하고, 필요한 콘솔로 바로 이동합니다.</p>
          </div>
          <div className="operatorHeroMeta">
            <InfoCard icon={<LayoutDashboard />} title="할당 대회" value={String(contests.length)} detail="operator scope" />
            <InfoCard icon={<ShieldCheck />} title="세션" value={staffSession.staff.display_name} detail={staffSession.staff.email} />
          </div>
        </section>
        {message && <p className="submitMessage error">{message}</p>}
        <section className="contestCards operatorContestDeck">
          {contests.map((contest) => (
            <article className="contestCard" key={contest.contest_id}>
              <div>
                <span className={`statusPill ${contest.status}`}>{contest.status}</span>
                <h2>{contest.title}</h2>
                <p>{contest.overview}</p>
              </div>
              <dl>
                <div><dt>개최기관</dt><dd>{contest.organization_name}</dd></div>
                <div><dt>오픈일</dt><dd>{formatDate(contest.start_at)}</dd></div>
                <div><dt>접근 방식</dt><dd>운영자 전용</dd></div>
              </dl>
              <div className="buttonRow">
                <button onClick={() => navigate("operator", { contestId: contest.contest_id })}>운영 콘솔 <ChevronRight size={16} /></button>
              </div>
            </article>
          ))}
        {!contests.length && (
          <article className="contestCard empty">
            <div>
              <span className="statusPill">empty</span>
              <h2>할당된 대회 없음</h2>
              <p>서비스 마스터가 대회 생성 후 운영자 이메일을 배정하면 이 목록에 나타납니다.</p>
            </div>
          </article>
        )}
      </section>
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid operatorWorkspace">
        <section className="operatorHero">
          <div className="operatorHeroMain">
            <span className="sectionKicker">operator</span>
            <h1>대회 운영자 콘솔</h1>
            <p>운영 대회 정보를 불러오는 중입니다.</p>
          </div>
        </section>
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }

  const contest = dashboard.contest;
  const divisions = dashboard.divisions;
  const now = Date.now();
  const startAtMs = new Date(contest.start_at).getTime();
  const freezeAtMs = new Date(contest.freeze_at).getTime();
  const endAtMs = new Date(contest.end_at).getTime();
  const openRemaining = startAtMs > now ? `${timeLeft(contest.start_at)} 남음` : "오픈됨";
  const freezeRemaining = freezeAtMs > now ? `${timeLeft(contest.freeze_at)} 남음` : now < endAtMs ? "프리즈 진행 중" : "종료됨";
  const endRemaining = endAtMs > now ? `${timeLeft(contest.end_at)} 남음` : "종료됨";
  const contestRemaining = startAtMs > now
    ? `시작까지 ${timeLeft(contest.start_at)}`
    : endAtMs > now
      ? `마감까지 ${timeLeft(contest.end_at)}`
      : "대회 종료";
  return (
    <section className="pageGrid operatorWorkspace">
      <section className="operatorHero">
        <div className="operatorHeroMain">
          <span className="sectionKicker">operator</span>
          <h1>{contest.title}</h1>
          <p>{contest.organization_name} 운영 콘솔입니다. 설정, 참가팀, 문제, 공지를 한 화면에서 관리합니다.</p>
          <div className="contestHeroMeta">
            <span>{contest.status}</span>
            <span>오픈 {formatDate(contest.start_at)}</span>
            <span>프리즈 {formatDate(contest.freeze_at)}</span>
            <span>마감 {formatDate(contest.end_at)}</span>
            <span>{contestRemaining}</span>
            <span>{divisions.length} divisions</span>
          </div>
        </div>
        <div className="operatorHeroMeta">
          <InfoCard icon={<Clock3 />} title="오픈 시간" value={formatDate(contest.start_at)} detail={openRemaining} />
          <InfoCard icon={<Timer />} title="프리즈 시간" value={formatDate(contest.freeze_at)} detail={freezeRemaining} />
          <InfoCard icon={<CalendarDays />} title="마감 시간" value={formatDate(contest.end_at)} detail={endRemaining} />
          <InfoCard icon={<Gauge />} title="남은 시간" value={contestRemaining} detail={contest.status} />
          <InfoCard icon={<Users />} title="참가팀" value={String(dashboard.participant_count)} detail="division separated" />
          <InfoCard icon={<FileCode2 />} title="제출" value={String(dashboard.submission_count)} detail="all teams" />
          <InfoCard icon={<Activity />} title="대기열" value={String(dashboard.pending_jobs)} detail="pending" />
          <InfoCard icon={<Lock />} title="재채점" value="불가" detail="all controls off" />
        </div>
      </section>
      {message && <p className="submitMessage error">{message}</p>}
    </section>
  );
}

function OperatorSettingsPage({
  contestId,
  staffSession,
  navigate
}: {
  contestId?: string;
  staffSession: StaffSession;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [publicVisibility, setPublicVisibility] = useState<PublicVisibility>({ problems: false, scoreboard: false, submissions: false });
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [overview, setOverview] = useState("");
  const [contestStatus, setContestStatus] = useState("scheduled");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [freezeAt, setFreezeAt] = useState("");
  const [divisionName, setDivisionName] = useState("");
  const [divisionDescription, setDivisionDescription] = useState("");
  const [editingDivisionId, setEditingDivisionId] = useState("");
  const [operators, setOperators] = useState<StaffAccount[]>([]);
  const [operatorEmail, setOperatorEmail] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [editingOperatorEmail, setEditingOperatorEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      if (!contestId) return;
      try {
        const [data, operatorItems] = await Promise.all([
          apiRequest<OperatorDashboard>(`/operator/contests/${contestId}/dashboard`, staffSession.accessToken),
          apiRequest<StaffAccount[]>(`/operator/contests/${contestId}/operators`, staffSession.accessToken),
        ]);
        if (!cancelled) {
          setDashboard(data);
          setDivisions([...data.divisions].sort((a, b) => a.name.localeCompare(b.name)));
          setOperators([...operatorItems].sort((a, b) => a.email.localeCompare(b.email)));
          setPublicVisibility({
            problems: data.contest.problem_public_after_end,
            scoreboard: data.contest.scoreboard_public_after_end,
            submissions: data.contest.submission_public_after_end
          });
          setTitle(data.contest.title);
          setOrganizationName(data.contest.organization_name);
          setOverview(data.contest.overview);
          setContestStatus(data.contest.status);
          setStartAt(dateTimeLocalValue(data.contest.start_at));
          setEndAt(dateTimeLocalValue(data.contest.end_at));
          setFreezeAt(dateTimeLocalValue(data.contest.freeze_at));
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) setMessage(formatApiError(error, "대회 설정을 불러오지 못했습니다"));
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [contestId, staffSession.accessToken]);

  if (!contestId) {
    return (
      <section className="pageGrid">
        <StaffContestGate navigate={navigate} />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="settings" title="대회 설정" description="대회 설정을 불러오는 중입니다." />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }

  const contest = dashboard.contest;
  const operationLocked = isContestOperationLocked(contest);

  function syncContestForm(next: Contest) {
    setContestStatus(next.status);
    setStartAt(dateTimeLocalValue(next.start_at));
    setEndAt(dateTimeLocalValue(next.end_at));
    setFreezeAt(dateTimeLocalValue(next.freeze_at));
    setPublicVisibility({
      problems: next.problem_public_after_end,
      scoreboard: next.scoreboard_public_after_end,
      submissions: next.submission_public_after_end
    });
  }

  async function saveContestSettings() {
    setMessage("대회 설정을 저장하고 있습니다.");
    try {
      const timeChanged =
        dateTimeLocalToIso(startAt) !== contest.start_at ||
        dateTimeLocalToIso(endAt) !== contest.end_at ||
        dateTimeLocalToIso(freezeAt) !== contest.freeze_at;
      if (operationLocked && timeChanged && !window.confirm("대회 운영 중 시간 변경은 참가자에게 긴급공지로 자동 안내됩니다. 변경하시겠습니까?")) {
        setMessage("시간 변경을 취소했습니다.");
        return;
      }
      const body = operationLocked
        ? {
            start_at: dateTimeLocalToIso(startAt),
            end_at: dateTimeLocalToIso(endAt),
            freeze_at: dateTimeLocalToIso(freezeAt)
          }
        : {
            title,
            organization_name: organizationName,
            overview,
            status: contestStatus,
            start_at: dateTimeLocalToIso(startAt),
            end_at: dateTimeLocalToIso(endAt),
            freeze_at: dateTimeLocalToIso(freezeAt),
            problem_public_after_end: publicVisibility.problems,
            scoreboard_public_after_end: publicVisibility.scoreboard,
            submission_public_after_end: publicVisibility.submissions
          };
      const updated = await apiRequest<Contest>(`/operator/contests/${contest.contest_id}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      setDashboard((current) => (current ? { ...current, contest: updated } : current));
      syncContestForm(updated);
      setMessage(operationLocked ? "대회 시간이 저장되었습니다. 시간 변경은 긴급공지로 자동 안내됩니다." : "대회 설정이 저장되었습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "대회 설정 저장 실패"));
    }
  }

  async function updatePublicVisibility(key: keyof PublicVisibility) {
    if (operationLocked) {
      setMessage("대회 중에는 종료 후 공개 설정을 변경할 수 없습니다.");
      return;
    }
    const next = { ...publicVisibility, [key]: !publicVisibility[key] };
    setPublicVisibility(next);
  }

  async function openScoreboardAfterEnd() {
    const next = { ...publicVisibility, scoreboard: true };
    setPublicVisibility(next);
    try {
      const updated = await apiRequest<Contest>(`/operator/contests/${contest.contest_id}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({ scoreboard_public_after_end: true })
      });
      setDashboard((current) => (current ? { ...current, contest: updated } : current));
      syncContestForm(updated);
      setMessage("종료 후 스코어보드를 공개했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "스코어보드 공개 실패"));
    }
  }

  function applyDivisionEditor(division?: Division | null) {
    if (!division) {
      setEditingDivisionId("");
      setDivisionName("");
      setDivisionDescription("");
      return;
    }
    setEditingDivisionId(division.division_id);
    setDivisionName(division.name);
    setDivisionDescription(division.description);
  }

  async function saveDivision() {
    if (operationLocked) {
      setMessage("대회 중에는 참가 유형을 추가하거나 수정할 수 없습니다.");
      return;
    }
    setMessage(editingDivisionId ? "참가 유형을 수정하고 있습니다." : "참가 유형을 추가하고 있습니다.");
    try {
      const payload = {
        name: divisionName,
        description: divisionDescription
      };
      const saved = editingDivisionId
        ? await apiRequest<Division>(`/operator/contests/${contest.contest_id}/divisions/${editingDivisionId}`, staffSession.accessToken, {
            method: "PATCH",
            body: JSON.stringify(payload)
          })
        : await apiRequest<Division>(`/operator/contests/${contest.contest_id}/divisions`, staffSession.accessToken, {
            method: "POST",
            body: JSON.stringify(payload)
          });
      const next = editingDivisionId ? divisions.map((item) => (item.division_id === saved.division_id ? saved : item)) : [...divisions, saved];
      const sorted = [...next].sort((a, b) => a.name.localeCompare(b.name));
      setDivisions(sorted);
      setDashboard((current) => (current ? { ...current, divisions: sorted } : current));
      applyDivisionEditor(null);
      setMessage(editingDivisionId ? "참가 유형을 수정했습니다." : "참가 유형을 추가했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "참가 유형 저장 실패"));
    }
  }

  async function freezeNow() {
    const nowIso = new Date().toISOString();
    const now = dateTimeLocalValue(nowIso);
    setFreezeAt(now);
    try {
      const updated = await apiRequest<Contest>(`/operator/contests/${contest.contest_id}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({ freeze_at: nowIso })
      });
      setDashboard((current) => (current ? { ...current, contest: updated } : current));
      syncContestForm(updated);
      setMessage("스코어보드 프리즈 시각을 현재 시각으로 반영했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "프리즈 반영 실패"));
    }
  }

  function setFreezeBeforeEnd(minutes: number) {
    const end = new Date(dateTimeLocalToIso(endAt));
    setFreezeAt(dateTimeLocalValue(new Date(end.getTime() - minutes * 60000).toISOString()));
  }

  function moveContestEnd(minutes: number) {
    const end = new Date(dateTimeLocalToIso(endAt));
    setEndAt(dateTimeLocalValue(new Date(end.getTime() + minutes * 60000).toISOString()));
  }

  async function startContestNow() {
    if (operationLocked) {
      setMessage("대회 중에는 상태와 시작 시각을 변경할 수 없습니다.");
      return;
    }
    const nowIso = new Date().toISOString();
    const now = dateTimeLocalValue(nowIso);
    setContestStatus("running");
    setStartAt(now);
    try {
      const updated = await apiRequest<Contest>(`/operator/contests/${contest.contest_id}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({ status: "running", start_at: nowIso })
      });
      setDashboard((current) => (current ? { ...current, contest: updated } : current));
      syncContestForm(updated);
      setMessage("대회 상태와 시작 시각을 즉시 반영했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "즉시 시작 반영 실패"));
    }
  }

  function resetOperatorEditor() {
    setEditingOperatorEmail("");
    setOperatorEmail("");
    setOperatorName("");
  }

  function openOperatorEditor(operator: StaffAccount) {
    setEditingOperatorEmail(operator.email);
    setOperatorEmail(operator.email);
    setOperatorName(operator.display_name);
  }

  async function saveOperator() {
    if (!operatorEmail.trim()) {
      setMessage("운영자 이메일을 입력하세요.");
      return;
    }
    setMessage(editingOperatorEmail ? "운영자를 수정하고 있습니다." : "운영자를 추가하고 있습니다.");
    try {
      const saved = editingOperatorEmail
        ? await apiRequest<StaffAccount>(`/operator/contests/${contest.contest_id}/operators/${encodeURIComponent(editingOperatorEmail)}`, staffSession.accessToken, {
            method: "PATCH",
            body: JSON.stringify({ display_name: operatorName.trim() || operatorEmail.trim() })
          })
        : await apiRequest<StaffAccount>(`/operator/contests/${contest.contest_id}/operators`, staffSession.accessToken, {
            method: "POST",
            body: JSON.stringify({ email: operatorEmail.trim(), display_name: operatorName.trim() || operatorEmail.trim() })
          });
      setOperators((current) => [...current.filter((item) => item.email !== saved.email), saved].sort((a, b) => a.email.localeCompare(b.email)));
      resetOperatorEditor();
      setMessage(editingOperatorEmail ? "운영자를 수정했습니다." : "운영자를 추가했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "운영자 저장 실패"));
    }
  }

  async function removeOperator(operator: StaffAccount) {
    if (!window.confirm(`${operator.email} 운영자 권한을 제거할까요?`)) return;
    setMessage("운영자를 제거하고 있습니다.");
    try {
      await apiRequest(`/operator/contests/${contest.contest_id}/operators/${encodeURIComponent(operator.email)}`, staffSession.accessToken, { method: "DELETE" });
      setOperators((current) => current.filter((item) => item.email !== operator.email));
      if (editingOperatorEmail === operator.email) resetOperatorEditor();
      setMessage("운영자 권한을 제거했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "운영자 제거 실패"));
    }
  }

  return (
    <section className="pageGrid">
      <PageHeader badge="settings" title="대회 설정" description="기본 정보, 일정, 참가 유형, 종료 후 공개 정책을 관리합니다." />
      <section className="summaryGrid">
        <InfoCard icon={<CalendarDays />} title="상태" value={contest.status} detail="scheduled/running/ended" />
        <InfoCard icon={<Timer />} title="남은 시간" value={timeLeft(contest.end_at)} detail={`freeze ${formatTime(contest.freeze_at)}`} />
        <InfoCard icon={<Users />} title="참가 유형" value={String(divisions.length)} detail="team requires exactly one" />
        <InfoCard icon={<Lock />} title="공개 설정" value={publicVisibility.scoreboard ? "ON" : "OFF"} detail="종료 후 공개" />
      </section>
      {operationLocked && (
        <section className="emergencyBox">
          <Lock size={18} />
          <span>대회 진행 중입니다. 참가 유형, 참가팀, 문제와 테스트케이스 변경은 잠깁니다. 운영 시간은 변경 가능하며 저장 시 긴급공지로 자동 안내됩니다.</span>
        </section>
      )}
      <section className="settingsGrid">
        <section className="panel">
          <PanelTitle icon={<CalendarDays />} title="기본 정보와 일정" />
          <div className="fieldGrid">
            <label><span>대회명</span><input value={title} disabled={operationLocked} onChange={(event) => setTitle(event.target.value)} /></label>
            <label><span>개최기관</span><input value={organizationName} disabled={operationLocked} onChange={(event) => setOrganizationName(event.target.value)} /></label>
            <label><span>대회 상태</span><select value={contestStatus} disabled={operationLocked} onChange={(event) => setContestStatus(event.target.value)}><option value="scheduled">scheduled</option><option value="open">open</option><option value="running">running</option><option value="ended">ended</option><option value="finalized">finalized</option><option value="archived">archived</option></select></label>
            <label><span>시작 시각</span><input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} /></label>
            <label><span>종료 시각</span><input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} /></label>
            <label><span>프리즈 시작</span><input type="datetime-local" value={freezeAt} onChange={(event) => setFreezeAt(event.target.value)} /></label>
          </div>
          <div className="timeQuickGrid">
            <button className="secondary" disabled={operationLocked} onClick={startContestNow}>지금 시작</button>
            <button className="secondary" onClick={() => moveContestEnd(10)}>종료 +10분</button>
            <button className="secondary" onClick={() => moveContestEnd(30)}>종료 +30분</button>
            <button className="secondary" onClick={() => setFreezeBeforeEnd(60)}>프리즈 종료 1시간 전</button>
            <button className="secondary" onClick={() => setFreezeBeforeEnd(30)}>프리즈 종료 30분 전</button>
            <button className="secondary" onClick={freezeNow}>지금 프리즈</button>
          </div>
          <label className="wideField"><span>대회 설명</span><textarea value={overview} disabled={operationLocked} onChange={(event) => setOverview(event.target.value)} /></label>
          <div className="buttonRow">
            <button onClick={saveContestSettings}><Pencil size={16} /> {operationLocked ? "시간 저장" : "설정 저장"}</button>
            <button className="secondary" onClick={() => navigate("board", { contestId })}><Megaphone size={16} /> 게시판 이동</button>
          </div>
        </section>
        <section className="panel">
          <PanelTitle icon={<Trophy />} title="참가 유형" />
          <div className="fieldGrid">
            <label><span>이름</span><input value={divisionName} disabled={operationLocked} placeholder="Advanced" onChange={(event) => setDivisionName(event.target.value)} /></label>
            <label><span>설명</span><input value={divisionDescription} disabled={operationLocked} placeholder="심화 유형" onChange={(event) => setDivisionDescription(event.target.value)} /></label>
          </div>
          <div className="buttonRow">
            <button onClick={saveDivision} disabled={operationLocked}>{editingDivisionId ? "유형 수정" : "유형 추가"}</button>
            {editingDivisionId && <button className="secondary" disabled={operationLocked} onClick={() => applyDivisionEditor(null)}>새 유형으로 전환</button>}
          </div>
          <DataTable
            columns={["이름", "설명", "관리"]}
            rows={[...divisions].sort((a, b) => a.name.localeCompare(b.name)).map((division) => [
              division.name,
              division.description,
              <button className="textButton" disabled={operationLocked} onClick={() => applyDivisionEditor(division)}>편집</button>
            ])}
          />
        </section>
        <section className="panel">
          <PanelTitle icon={<ShieldCheck />} title="운영자 설정" />
          <div className="fieldGrid">
            <label><span>이메일</span><input value={operatorEmail} disabled={Boolean(editingOperatorEmail)} placeholder="operator@example.com" onChange={(event) => setOperatorEmail(event.target.value)} /></label>
            <label><span>표시 이름</span><input value={operatorName} placeholder="이름 또는 역할" onChange={(event) => setOperatorName(event.target.value)} /></label>
          </div>
          <div className="buttonRow">
            <button onClick={saveOperator}>{editingOperatorEmail ? <Pencil size={16} /> : <Plus size={16} />} {editingOperatorEmail ? "운영자 수정" : "운영자 추가"}</button>
            {editingOperatorEmail && <button className="secondary" onClick={resetOperatorEditor}>새 운영자</button>}
          </div>
          <DataTable
            columns={["이름", "이메일", "권한", "관리"]}
            rows={operators.map((operator) => [
              operator.display_name,
              operator.email,
              "contest.*",
              <span className="tableActions">
                <button className="textButton" onClick={() => openOperatorEditor(operator)}>편집</button>
                <button className="textButton dangerText" disabled={operator.email === staffSession.staff.email || operators.length <= 1} onClick={() => removeOperator(operator)}>제거</button>
              </span>
            ])}
          />
        </section>
      </section>
      <section className="panel">
        <PanelTitle icon={<Lock />} title="종료 후 공개 설정" />
        <div className="settingList">
          <SettingToggle title="문제 공개" detail="종료 후 비로그인 문제 열람 허용" checked={publicVisibility.problems} onToggle={() => updatePublicVisibility("problems")} />
          <SettingToggle title="스코어보드 공개" detail="종료 후 공개 스코어보드 열람 허용" checked={publicVisibility.scoreboard} onToggle={() => updatePublicVisibility("scoreboard")} />
          <SettingToggle title="제출 현황 공개" detail="종료 후 제출 목록 열람 허용, 소스코드는 별도 권한 필요" checked={publicVisibility.submissions} onToggle={() => updatePublicVisibility("submissions")} />
        </div>
        {isContestEnded(contest) && !publicVisibility.scoreboard && (
          <div className="buttonRow">
            <button onClick={openScoreboardAfterEnd}><Trophy size={16} /> 스코어보드 공개</button>
          </div>
        )}
        {message && <p className="submitMessage done">{message}</p>}
        <div className="policyStrip">
          <span>현재 상태: {contestStatus}</span>
          <span>{isContestEnded(contest) ? "종료 후 공개 정책 적용 가능" : "비로그인 공개 차단 중"}</span>
        </div>
      </section>
    </section>
  );
}

function OperatorNoticesPage({
  contestId,
  staffSession,
  navigate
}: {
  contestId?: string;
  staffSession: StaffSession;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [notices, setNotices] = useState<ContestNotice[]>([]);
  const [message, setMessage] = useState("");
  const [emergencyNotice, setEmergencyNotice] = useState("");
  const [selectedNoticeId, setSelectedNoticeId] = useState("");
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeBody, setNoticeBody] = useState("");
  const [noticeVisibility, setNoticeVisibility] = useState<"public" | "participants">("participants");
  const [noticePinned, setNoticePinned] = useState(false);
  const [noticeEmergency, setNoticeEmergency] = useState(false);

  const loadNotices = useCallback(async (silent = false) => {
    if (!contestId) return;
    if (!silent) setMessage("공지 정보를 불러오는 중입니다.");
    try {
      const [context, items] = await Promise.all([
        apiRequest<OperatorDashboard>(`/operator/contests/${contestId}/dashboard`, staffSession.accessToken),
        apiRequest<ContestNotice[]>(`/operator/contests/${contestId}/notices`, staffSession.accessToken)
      ]);
      setDashboard(context);
      setEmergencyNotice(context.contest.emergency_notice ?? "");
      setNotices(items);
      setSelectedNoticeId((current) => current && items.some((item) => item.contest_notice_id === current) ? current : items[0]?.contest_notice_id ?? "");
      if (!silent) setMessage("");
    } catch (error) {
      setMessage(formatApiError(error, "공지 정보를 불러오지 못했습니다"));
    }
  }, [contestId, staffSession.accessToken]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);
  useAutoRefresh(() => loadNotices(true), Boolean(contestId), 15000);

  if (!contestId) {
    return (
      <section className="pageGrid">
        <StaffContestGate navigate={navigate} />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="notices" title="공지" description="공지 정보를 불러오는 중입니다." />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }

  const selectedNotice = notices.find((notice) => notice.contest_notice_id === selectedNoticeId) ?? null;

  function resetNoticeEditor() {
    setSelectedNoticeId("");
    setNoticeTitle("");
    setNoticeBody("");
    setNoticeVisibility("participants");
    setNoticePinned(false);
    setNoticeEmergency(false);
  }

  function openNoticeEditor(notice: ContestNotice) {
    setSelectedNoticeId(notice.contest_notice_id);
    setNoticeTitle(notice.title);
    setNoticeBody(notice.body);
    setNoticeVisibility(notice.visibility);
    setNoticePinned(notice.pinned);
    setNoticeEmergency(notice.emergency);
  }

  async function saveEmergencyNotice() {
    setMessage("긴급공지를 저장하고 있습니다.");
    try {
      const updated = await apiRequest<Contest>(`/operator/contests/${contestId}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({ emergency_notice: emergencyNotice || null })
      });
      setDashboard((current) => current ? { ...current, contest: updated } : current);
      setMessage("긴급공지를 저장했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "긴급공지 저장 실패"));
    }
  }

  async function saveNotice() {
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      setMessage("공지 제목과 본문을 입력하세요.");
      return;
    }
    setMessage(selectedNoticeId ? "공지를 수정하고 있습니다." : "공지를 작성하고 있습니다.");
    try {
      const payload = {
        title: noticeTitle,
        body: noticeBody,
        visibility: noticeVisibility,
        pinned: noticePinned,
        emergency: noticeEmergency
      };
      const saved = selectedNoticeId
        ? await apiRequest<ContestNotice>(`/operator/contests/${contestId}/notices/${selectedNoticeId}`, staffSession.accessToken, {
            method: "PATCH",
            body: JSON.stringify(payload)
          })
        : await apiRequest<ContestNotice>(`/operator/contests/${contestId}/notices`, staffSession.accessToken, {
            method: "POST",
            body: JSON.stringify(payload)
          });
      setNotices((current) => [saved, ...current.filter((item) => item.contest_notice_id !== saved.contest_notice_id)]);
      setSelectedNoticeId(saved.contest_notice_id);
      setMessage(selectedNoticeId ? "공지를 수정했습니다." : "공지를 작성했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "공지 저장 실패"));
    }
  }

  return (
    <section className="pageGrid">
      <PageHeader badge="notices" title="공지" description="긴급공지와 대회 공지를 관리합니다." />
      <section className="settingsGrid">
        <section className="panel">
          <PanelTitle icon={<AlertTriangle />} title="긴급공지" />
          <label className="wideField">
            <span>최근 1개 노출</span>
            <textarea value={emergencyNotice} placeholder="긴급하게 참가자에게 보여줄 안내" onChange={(event) => setEmergencyNotice(event.target.value)} />
          </label>
          <div className="buttonRow">
            <button onClick={saveEmergencyNotice}><Bell size={16} /> 긴급공지 저장</button>
            <button className="secondary" onClick={() => navigate("board", { contestId })}><MessageSquare size={16} /> 게시판 보기</button>
          </div>
        </section>
        <section className="panel">
          <PanelTitle icon={<Megaphone />} title={selectedNoticeId ? "공지 수정" : "공지 작성"} />
          <div className="fieldGrid">
            <label><span>제목</span><input value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} /></label>
            <label><span>공개 범위</span><select value={noticeVisibility} onChange={(event) => setNoticeVisibility(event.target.value as "public" | "participants")}><option value="public">public</option><option value="participants">participants</option></select></label>
            <label className="checkboxLine"><input type="checkbox" checked={noticePinned} onChange={(event) => setNoticePinned(event.target.checked)} /> 상단 고정</label>
            <label className="checkboxLine"><input type="checkbox" checked={noticeEmergency} onChange={(event) => setNoticeEmergency(event.target.checked)} /> 긴급 표시</label>
          </div>
          <label className="wideField"><span>본문</span><textarea value={noticeBody} onChange={(event) => setNoticeBody(event.target.value)} /></label>
          <div className="buttonRow">
            <button onClick={saveNotice}><Pencil size={16} /> {selectedNoticeId ? "공지 수정" : "공지 작성"}</button>
            <button className="secondary" onClick={resetNoticeEditor}>새 공지</button>
          </div>
          {message && <p className={message.includes("실패") || message.includes("입력") ? "submitMessage error" : "submitMessage done"}>{message}</p>}
        </section>
      </section>
      <section className="boardSplit">
        <section className="panel">
          <div className="panelTitleRow">
            <PanelTitle icon={<Megaphone />} title="공지 목록" />
          </div>
          <div className="noticeList clickList">
            {notices.map((notice) => (
              <article className={selectedNotice?.contest_notice_id === notice.contest_notice_id ? "noticeItem active" : notice.emergency ? "noticeItem emergency" : "noticeItem"} key={notice.contest_notice_id} onClick={() => openNoticeEditor(notice)}>
                <div className="boardItemHeader">
                  <h3>{notice.title}</h3>
                  <span className={`statusPill ${notice.visibility}`}>{notice.visibility}</span>
                </div>
                <p className="panelNote">{formatDate(notice.published_at)} · {notice.pinned ? "pinned" : "normal"}</p>
              </article>
            ))}
            {!notices.length && <p className="panelNote">등록된 공지가 없습니다.</p>}
          </div>
        </section>
        <section className="panel">
          <PanelTitle icon={<BookOpen />} title="미리보기" />
          {selectedNotice ? (
            <article className="boardReader">
              <div className="boardItemHeader">
                <h3>{selectedNotice.title}</h3>
                {selectedNotice.emergency && <span className="statusPill failed">긴급</span>}
              </div>
              <MarkdownPreview statement={selectedNotice.body} assets={[]} />
            </article>
          ) : (
            <p className="panelNote">공지 목록에서 항목을 선택하세요.</p>
          )}
        </section>
      </section>
    </section>
  );
}

function OperatorStaffPage({
  contestId,
  staffSession,
  navigate
}: {
  contestId?: string;
  staffSession: StaffSession;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const [operators, setOperators] = useState<StaffAccount[]>([]);
  const [message, setMessage] = useState("");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");

  const loadOperators = useCallback(async (silent = false) => {
    if (!contestId) return;
    if (!silent) setMessage("운영자 목록을 불러오는 중입니다.");
    try {
      const data = await apiRequest<StaffAccount[]>(`/operator/contests/${contestId}/operators`, staffSession.accessToken);
      setOperators(data);
      if (!silent) setMessage("");
    } catch (error) {
      setMessage(formatApiError(error, "운영자 목록을 불러오지 못했습니다"));
    }
  }, [contestId, staffSession.accessToken]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);
  useAutoRefresh(() => loadOperators(true), Boolean(contestId), 15000);

  if (!contestId) {
    return (
      <section className="pageGrid">
        <StaffContestGate navigate={navigate} />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }

  function resetEditor() {
    setEditingEmail("");
    setOperatorEmail("");
    setOperatorName("");
  }

  function openOperatorEditor(operator: StaffAccount) {
    setEditingEmail(operator.email);
    setOperatorEmail(operator.email);
    setOperatorName(operator.display_name);
  }

  async function saveOperator() {
    if (!operatorEmail.trim()) {
      setMessage("운영자 이메일을 입력하세요.");
      return;
    }
    setMessage(editingEmail ? "운영자를 수정하고 있습니다." : "운영자를 추가하고 있습니다.");
    try {
      const saved = editingEmail
        ? await apiRequest<StaffAccount>(`/operator/contests/${contestId}/operators/${encodeURIComponent(editingEmail)}`, staffSession.accessToken, {
            method: "PATCH",
            body: JSON.stringify({ display_name: operatorName.trim() || operatorEmail.trim() })
          })
        : await apiRequest<StaffAccount>(`/operator/contests/${contestId}/operators`, staffSession.accessToken, {
            method: "POST",
            body: JSON.stringify({ email: operatorEmail.trim(), display_name: operatorName.trim() || operatorEmail.trim() })
          });
      setOperators((current) => [...current.filter((item) => item.email !== saved.email), saved].sort((a, b) => a.email.localeCompare(b.email)));
      resetEditor();
      setMessage(editingEmail ? "운영자를 수정했습니다." : "운영자를 추가했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "운영자 저장 실패"));
    }
  }

  async function removeOperator(operator: StaffAccount) {
    if (!window.confirm(`${operator.email} 운영자 권한을 제거할까요?`)) return;
    setMessage("운영자를 제거하고 있습니다.");
    try {
      await apiRequest<StaffAccount>(`/operator/contests/${contestId}/operators/${encodeURIComponent(operator.email)}`, staffSession.accessToken, { method: "DELETE" });
      setOperators((current) => current.filter((item) => item.email !== operator.email));
      if (editingEmail === operator.email) resetEditor();
      setMessage("운영자 권한을 제거했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "운영자 제거 실패"));
    }
  }

  return (
    <section className="pageGrid">
      <PageHeader badge="staff" title="운영자" description="대회 운영자 계정을 추가, 수정, 제거합니다." />
      <section className="settingsGrid">
        <section className="panel">
          <PanelTitle icon={<ShieldCheck />} title={editingEmail ? "운영자 수정" : "운영자 추가"} />
          <div className="fieldGrid">
            <label><span>이메일</span><input value={operatorEmail} disabled={Boolean(editingEmail)} placeholder="operator@example.com" onChange={(event) => setOperatorEmail(event.target.value)} /></label>
            <label><span>표시 이름</span><input value={operatorName} placeholder="이름 또는 역할" onChange={(event) => setOperatorName(event.target.value)} /></label>
          </div>
          <div className="buttonRow">
            <button onClick={saveOperator}>{editingEmail ? <Pencil size={16} /> : <Plus size={16} />} {editingEmail ? "수정" : "추가"}</button>
            {editingEmail && <button className="secondary" onClick={resetEditor}>새 운영자</button>}
          </div>
          {message && <p className={message.includes("실패") || message.includes("입력") ? "submitMessage error" : "submitMessage done"}>{message}</p>}
        </section>
        <section className="panel">
          <PanelTitle icon={<Lock />} title="권한 기준" />
          <List>
            <li><strong>운영 권한</strong><span>대회별 `contest.*` 권한으로 관리</span></li>
            <li><strong>로그인</strong><span>일반 로그인 OTP로 접근</span></li>
            <li><strong>삭제</strong><span>계정 삭제가 아니라 해당 대회 권한 제거</span></li>
          </List>
        </section>
      </section>
      <section className="panel">
        <PanelTitle icon={<Users />} title="운영자 목록" />
        <div className="teamCardList">
          {operators.map((operator) => (
            <article className={editingEmail === operator.email ? "teamCard active" : "teamCard"} key={operator.email}>
              <div className="teamCardHeader">
                <span>
                  <strong>{operator.display_name}</strong>
                  <small>{operator.email}</small>
                </span>
                <span className="statusPill active">contest.*</span>
              </div>
              <div className="teamCardActions">
                <button className="textButton" onClick={() => openOperatorEditor(operator)}><Pencil size={14} /> 수정</button>
                <button className="textButton dangerText" disabled={operator.email === staffSession.staff.email || operators.length <= 1} onClick={() => removeOperator(operator)}><Trash2 size={14} /> 제거</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function OperatorParticipantsPage({
  contestId,
  staffSession,
  navigate
}: {
  contestId?: string;
  staffSession: StaffSession;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [teams, setTeams] = useState<ParticipantTeam[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [teamName, setTeamName] = useState("");
  const [divisionId, setLocalDivisionId] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [leaderEmail, setLeaderEmail] = useState("");
  const [teamStatus, setTeamStatus] = useState("invited");
  const [editingTeamId, setEditingTeamId] = useState("");
  const [draftMembers, setDraftMembers] = useState<TeamMemberDraft[]>([]);
  const [bulkImportRows, setBulkImportRows] = useState<ReturnType<typeof parseTeamImportFile>>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamDivisionFilter, setTeamDivisionFilter] = useState("all");

  async function loadTeams() {
    if (!contestId) return;
    setStatus("loading");
    try {
      const [context, data] = await Promise.all([
        apiRequest<OperatorDashboard>(`/operator/contests/${contestId}/dashboard`, staffSession.accessToken),
        apiRequest<ParticipantTeam[]>(`/operator/contests/${contestId}/participants`, staffSession.accessToken)
      ]);
      setDashboard(context);
      const sortedDivisions = [...context.divisions].sort((a, b) => a.name.localeCompare(b.name));
      setDivisions(sortedDivisions);
      if (!divisionId && sortedDivisions[0]) setLocalDivisionId(sortedDivisions[0].division_id);
      setTeams(data);
      setStatus("ready");
      setMessage("참가팀 목록을 불러왔습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "참가팀 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    loadTeams();
  }, [contestId]);

  useEffect(() => {
    if (divisions.length && !divisions.some((division) => division.division_id === divisionId)) {
      setLocalDivisionId(divisions[0].division_id);
    }
  }, [divisions, divisionId]);

  if (!contestId) {
    return (
      <section className="pageGrid">
        <StaffContestGate navigate={navigate} />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="participants" title="참가팀 관리" description="참가팀 목록을 불러오는 중입니다." />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }

  const contest = dashboard.contest;
  const participantEditLocked = false;
  const participantDeleteLocked = false;

  function resetTeamEditor() {
    setEditingTeamId("");
    setTeamName("");
    setLocalDivisionId(divisions[0]?.division_id ?? "");
    setLeaderName("");
    setLeaderEmail("");
    setTeamStatus("invited");
    setDraftMembers([]);
  }

  function openTeamEditor(team: ParticipantTeam) {
    const leader = team.members.find((member) => member.role === "leader") ?? team.members[0];
    setEditingTeamId(team.participant_team_id);
    setTeamName(team.team_name);
    setLocalDivisionId(team.division_id);
    setLeaderName(leader?.name ?? "");
    setLeaderEmail(leader?.email ?? "");
    setTeamStatus(team.status);
    setDraftMembers(
      team.members
        .filter((member) => member.role !== "leader")
        .map((member) => ({ team_member_id: member.team_member_id, role: member.role, name: member.name, email: member.email }))
    );
  }

  async function saveTeamEditor() {
    const members = draftMembers.filter((member) => member.name.trim() || member.email.trim());
    setMessage(editingTeamId ? "참가팀 정보를 수정하고 있습니다." : "참가팀을 등록하고 있습니다.");
    try {
      if (editingTeamId) {
        const currentTeam = teams.find((team) => team.participant_team_id === editingTeamId);
        const leader = currentTeam?.members.find((member) => member.role === "leader") ?? currentTeam?.members[0];
        const updated = await apiRequest<ParticipantTeam>(`/operator/contests/${contestId}/participants/${editingTeamId}`, staffSession.accessToken, {
          method: "PATCH",
          body: JSON.stringify({ team_name: teamName, division_id: divisionId, status: teamStatus })
        });
        if (leader?.team_member_id) {
          await apiRequest<TeamMember>(`/operator/contests/${contestId}/participants/${editingTeamId}/members/${leader.team_member_id}`, staffSession.accessToken, {
            method: "PATCH",
            body: JSON.stringify({ name: leaderName, email: leaderEmail })
          });
        }
        for (const member of members) {
          if (member.team_member_id) {
            await apiRequest<TeamMember>(`/operator/contests/${contestId}/participants/${editingTeamId}/members/${member.team_member_id}`, staffSession.accessToken, {
              method: "PATCH",
              body: JSON.stringify({ name: member.name, email: member.email })
            });
          } else {
            await apiRequest<TeamMember>(`/operator/contests/${contestId}/participants/${editingTeamId}/members`, staffSession.accessToken, {
              method: "POST",
              body: JSON.stringify({ name: member.name, email: member.email })
            });
          }
        }
        const division = divisions.find((item) => item.division_id === updated.division_id) ?? null;
        setTeams((current) => current.map((team) => (team.participant_team_id === updated.participant_team_id ? { ...updated, division } : team)));
        await loadTeams();
      } else {
        const created = await apiRequest<ParticipantTeam>(`/operator/contests/${contestId}/participants`, staffSession.accessToken, {
          method: "POST",
          body: JSON.stringify({
            team_name: teamName,
            division_id: divisionId,
            leader: { name: leaderName, email: leaderEmail },
            members
          })
        });
        const division = divisions.find((item) => item.division_id === created.division_id) ?? null;
        setTeams((current) => [{ ...created, division }, ...current]);
      }
      setStatus("ready");
      setMessage(editingTeamId ? "참가팀 정보를 수정했습니다." : "참가팀이 등록되었습니다. 삭제는 제공하지 않습니다.");
      resetTeamEditor();
    } catch (error) {
      setStatus("error");
      setMessage(formatParticipantTeamError(error, "참가팀 저장에 실패했습니다."));
    }
  }

  async function importTeamsFromRows() {
    if (!bulkImportRows.length) return;
    setMessage("참가팀 파일을 일괄 등록하고 있습니다.");
    try {
      const response = await apiRequest<ParticipantBulkImportResponse>(`/operator/contests/${contestId}/participants:bulk-create`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({ teams: bulkImportRows })
      });
      setTeams((current) => [...response.created, ...current]);
      setBulkImportRows([]);
      setStatus(response.errors.length ? "error" : "ready");
      setMessage(`${response.created.length}개 팀 등록 완료${response.errors.length ? `, ${response.errors.length}개 행 실패: ${response.errors.slice(0, 3).map((item) => `${item.row}행 ${item.message}`).join(", ")}` : ""}`);
      await loadTeams();
    } catch (error) {
      setStatus("error");
      setMessage(formatParticipantTeamError(error, "참가팀 일괄 등록에 실패했습니다."));
    }
  }

  async function updateTeamStatus(team: ParticipantTeam, nextStatus: string) {
    setMessage(`${team.team_name} 상태를 변경하고 있습니다.`);
    try {
      const updated = await apiRequest<ParticipantTeam>(`/operator/contests/${contestId}/participants/${team.participant_team_id}`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus })
      });
      setTeams((current) => current.map((item) => (item.participant_team_id === team.participant_team_id ? updated : item)));
      setStatus("ready");
      setMessage(`${team.team_name} 상태가 ${nextStatus}(으)로 변경되었습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "참가팀 상태 변경에 실패했습니다.");
    }
  }

  async function revokeMemberSessions(team: ParticipantTeam, member: TeamMember) {
    setMessage(`${member.email} 세션을 종료하고 있습니다.`);
    try {
      const updated = await apiRequest<TeamMember>(`/operator/contests/${contestId}/participants/${team.participant_team_id}/members/${member.team_member_id}/sessions:revoke`, staffSession.accessToken, { method: "POST" });
      setTeams((current) =>
        current.map((item) =>
          item.participant_team_id === team.participant_team_id
            ? { ...item, members: item.members.map((currentMember) => (currentMember.team_member_id === updated.team_member_id ? updated : currentMember)) }
            : item
        )
      );
      setStatus("ready");
      setMessage("해당 이메일의 참가자 세션을 종료했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "세션 종료에 실패했습니다.");
    }
  }

  async function deleteTeam(team: ParticipantTeam) {
    if (participantDeleteLocked) {
      setStatus("error");
      setMessage("대회 중에는 참가팀을 삭제할 수 없습니다.");
      return;
    }
    if (!confirm(`참가팀 '${team.team_name}'을(를) 삭제하시겠습니까?`)) return;
    setMessage(`${team.team_name} 삭제 중...`);
    try {
      await apiRequest(`/operator/contests/${contestId}/participants/${team.participant_team_id}`, staffSession.accessToken, { method: "DELETE" });
      setTeams((current) => current.filter((item) => item.participant_team_id !== team.participant_team_id));
      if (editingTeamId === team.participant_team_id) resetTeamEditor();
      setStatus("ready");
      setMessage(`${team.team_name} 삭제 완료`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "참가팀 삭제에 실패했습니다.");
    }
  }

  const visibleTeams = teams
    .filter((team) => teamDivisionFilter === "all" || team.division_id === teamDivisionFilter)
    .filter((team) => {
      const keyword = teamSearch.trim().toLowerCase();
      if (!keyword) return true;
      return [
        team.team_name,
        team.division?.name ?? divisions.find((division) => division.division_id === team.division_id)?.name ?? "",
        ...team.members.flatMap((member) => [member.name, member.email])
      ].some((value) => value.toLowerCase().includes(keyword));
    });
  const rows = visibleTeams.map((team) => {
    const leader = team.members.find((member) => member.role === "leader") ?? team.members[0];
    return [
      team.team_name,
      team.division?.name ?? divisions.find((division) => division.division_id === team.division_id)?.name ?? team.division_id.slice(0, 8),
      leader ? `${leader.name} / ${leader.email}` : "-",
      String(team.members.length),
      <span className={`statusPill ${team.status}`}>{team.status}</span>,
      <span className="tableActions">
        <button className="textButton" disabled={participantEditLocked} onClick={() => openTeamEditor(team)}>수정 열기</button>
        <button className="textButton dangerText" disabled={participantDeleteLocked} onClick={() => deleteTeam(team)}>삭제</button>
      </span>
    ];
  });
  const editingTeam = teams.find((team) => team.participant_team_id === editingTeamId) ?? null;
  const memberRows = teams.flatMap((team) =>
    team.members.map((member) => [
      team.team_name,
      member.role,
      member.name,
      member.email,
      String(member.active_sessions ?? 0),
      <button className="textButton" onClick={() => revokeMemberSessions(team, member)}>세션 종료</button>
    ])
  );

  return (
    <section className="pageGrid">
      <PageHeader badge="participants" title="참가팀 관리" description="대회 운영자가 팀과 참가자를 등록하고, 팀별 참가 유형을 필수로 지정합니다." />
      <section className="summaryGrid">
        <InfoCard icon={<Users />} title="참가팀" value={String(teams.length)} detail="registered teams" />
        <InfoCard icon={<Trophy />} title="참가 유형" value={String(divisions.length)} detail="required per team" />
        <InfoCard icon={<Mail />} title="OTP" value="이메일별" detail="member email session" />
        <InfoCard icon={<Lock />} title="삭제" value="가능" detail="제출/질문 이력 있으면 차단" />
      </section>
      <section className="emergencyBox">
        <Lock size={18} />
        <span>대회 진행 중에도 참가팀 등록/수정/상태 변경/삭제가 가능합니다. 단, 제출/질문 이력이 있는 팀은 삭제할 수 없습니다.</span>
      </section>
      <section className="settingsGrid">
        <section className="panel">
          <PanelTitle icon={<Users />} title={editingTeamId ? "선택 팀 수정" : "새 참가팀 등록"} />
          <p className="panelNote">{editingTeamId ? "목록에서 선택한 팀의 기본 정보, 상태, 팀원 정보를 이 패널에서만 수정합니다." : "새 팀 등록 전용 폼입니다. 1인팀이면 팀원 입력 없이 팀장 정보만 저장합니다."}</p>
          {editingTeam && (
            <div className="teamEditBanner">
              <span>
                <strong>{editingTeam.team_name}</strong>
                <small>제출/질문 이력 없는 팀은 삭제할 수 있습니다.</small>
              </span>
              <span className={`statusPill ${editingTeam.status}`}>{editingTeam.status}</span>
            </div>
          )}
          <div className="fieldGrid">
            <label><span>팀명</span><input value={teamName} disabled={participantEditLocked} placeholder="팀명" onChange={(event) => setTeamName(event.target.value)} /></label>
            <label><span>참가 유형</span><select value={divisionId} disabled={participantEditLocked} onChange={(event) => setLocalDivisionId(event.target.value)}>{divisions.map((division) => <option key={division.division_id} value={division.division_id}>{division.name}</option>)}</select></label>
            {editingTeamId && <label><span>팀 상태</span><select value={teamStatus} disabled={participantEditLocked} onChange={(event) => setTeamStatus(event.target.value)}><option value="invited">invited</option><option value="active">active</option><option value="disabled">disabled</option><option value="disqualified">disqualified</option></select></label>}
            <label><span>팀장 이름</span><input value={leaderName} disabled={participantEditLocked} placeholder="팀장 이름" onChange={(event) => setLeaderName(event.target.value)} /></label>
            <label><span>팀장 이메일</span><input value={leaderEmail} disabled={participantEditLocked} placeholder="leader@example.com" onChange={(event) => setLeaderEmail(event.target.value)} /></label>
          </div>
          {editingTeam && (
            <div className="teamStatusActions">
              <button className="secondary" disabled={participantEditLocked} onClick={() => setTeamStatus("active")}>활성으로 표시</button>
              <button className="secondary" disabled={participantEditLocked} onClick={() => setTeamStatus("disabled")}>비활성으로 표시</button>
              <button className="secondary" disabled={participantEditLocked} onClick={() => setTeamStatus("disqualified")}>실격으로 표시</button>
            </div>
          )}
          <div className="memberEditorList">
            {draftMembers.map((member, index) => (
              <div className="memberEditorRow" key={`${member.team_member_id ?? "new"}-${index}`}>
                <label><span>팀원 이름</span><input value={member.name} disabled={participantEditLocked} placeholder="팀원 이름" onChange={(event) => setDraftMembers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} /></label>
                <label><span>팀원 이메일</span><input value={member.email} disabled={participantEditLocked} placeholder="member@example.com" onChange={(event) => setDraftMembers((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, email: event.target.value } : item))} /></label>
                {!member.team_member_id && <button className="secondary" disabled={participantEditLocked} onClick={() => setDraftMembers((current) => current.filter((_, itemIndex) => itemIndex !== index))}>제거</button>}
              </div>
            ))}
          </div>
          <div className="buttonRow">
            <button className="secondary" disabled={participantEditLocked} onClick={() => setDraftMembers((current) => [...current, { name: "", email: "" }])}><Plus size={16} /> 팀원 추가</button>
            <button onClick={saveTeamEditor} disabled={participantEditLocked || !teamName.trim() || !leaderName.trim() || !leaderEmail.trim() || !divisionId}><Users size={16} /> {editingTeamId ? "참가팀 수정" : "참가팀 등록"}</button>
            {editingTeamId && <button className="secondary" disabled={participantEditLocked} onClick={resetTeamEditor}>새 팀 등록으로 전환</button>}
            <button className="secondary" onClick={loadTeams}>목록 새로고침</button>
          </div>
          {message && <p className={`submitMessage ${status === "error" ? "error" : "done"}`}>{message}</p>}
        </section>
        <section className="panel">
          <PanelTitle icon={<Database />} title="엑셀 파일 일괄 등록" />
          <p className="panelNote">Excel에서 CSV 또는 탭으로 구분된 텍스트로 저장한 파일을 올립니다. 헤더는 `team_name, division, leader_name, leader_email, member1_name, member1_email...` 또는 `팀명, 참가유형, 팀장이름, 팀장메일, 팀원1이름, 팀원1메일...` 형식을 지원합니다.</p>
          <label className="uploadButton">
            <Database size={16} /> CSV/TSV 파일 선택
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                hidden
                disabled={participantEditLocked}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const parsed = parseTeamImportFile(text, divisions).filter((row) => row.team_name && row.division_id && row.leader.name && row.leader.email);
                setBulkImportRows(parsed);
                setMessage(`${parsed.length}개 팀을 파일에서 읽었습니다.`);
                event.target.value = "";
              }}
            />
          </label>
          <div className="policyStrip">
            <span>읽은 팀: {bulkImportRows.length}</span>
            <span>참가 유형은 이름/코드/ID 중 하나로 매칭</span>
          </div>
          <button onClick={importTeamsFromRows} disabled={participantEditLocked || !bulkImportRows.length}><Users size={16} /> 읽은 팀 일괄 등록</button>
        </section>
        <section className="panel">
          <PanelTitle icon={<Lock />} title="로그인 정책" />
          <List>
            <li><strong>식별자</strong><span>운영자가 등록한 참가자 이메일</span></li>
            <li><strong>OTP</strong><span>이메일별 수신, 이메일별 세션 유지</span></li>
            <li><strong>참가 유형</strong><span>팀당 1개 필수, 로그인 후 변경 불가</span></li>
            <li><strong>삭제</strong><span>팀 삭제는 제공하지 않고 상태 전환으로 관리</span></li>
          </List>
          <button className="secondary" onClick={() => navigate("operator-settings", { contestId })}>대회 설정</button>
        </section>
      </section>
      <section className="panel">
        <PanelTitle icon={<Users />} title="참가팀 목록" />
        <div className="teamDirectoryToolbar">
          <label className="searchField">
            <Search size={16} />
            <input value={teamSearch} placeholder="팀명, 이름, 이메일 검색" onChange={(event) => setTeamSearch(event.target.value)} />
          </label>
          <select value={teamDivisionFilter} onChange={(event) => setTeamDivisionFilter(event.target.value)}>
            <option value="all">전체 유형</option>
            {divisions.map((division) => <option key={division.division_id} value={division.division_id}>{division.name}</option>)}
          </select>
          <button className="secondary" onClick={resetTeamEditor}>새 팀 등록</button>
        </div>
        <div className="teamCardList">
          {visibleTeams.map((team) => {
            const leader = team.members.find((member) => member.role === "leader") ?? team.members[0];
            const divisionName = team.division?.name ?? divisions.find((division) => division.division_id === team.division_id)?.name ?? "유형 없음";
            return (
              <article className={editingTeamId === team.participant_team_id ? "teamCard active" : "teamCard"} key={team.participant_team_id}>
                <div className="teamCardHeader">
                  <span>
                    <strong>{team.team_name}</strong>
                    <small>{divisionName}</small>
                  </span>
                  <span className={`statusPill ${team.status}`}>{team.status}</span>
                </div>
                <div className="teamCardMeta">
                  <span>팀장</span>
                  <strong>{leader ? `${leader.name} / ${leader.email}` : "-"}</strong>
                  <span>인원</span>
                  <strong>{team.members.length}명</strong>
                </div>
                <div className="teamCardMembers">
                  {team.members.slice(0, 4).map((member) => (
                    <span key={member.team_member_id ?? member.email}>{member.name}<small>{member.email}</small></span>
                  ))}
                  {team.members.length > 4 && <span>+{team.members.length - 4}</span>}
                </div>
                <div className="teamCardActions">
                  <button className="textButton" disabled={participantEditLocked} onClick={() => openTeamEditor(team)}><Pencil size={14} /> 수정</button>
                  <button className="textButton" onClick={() => leader && revokeMemberSessions(team, leader)} disabled={!leader}>팀장 세션 종료</button>
                  <button className="textButton dangerText" disabled={participantDeleteLocked} onClick={() => deleteTeam(team)}><Trash2 size={14} /> 삭제</button>
                </div>
              </article>
            );
          })}
        </div>
        {!visibleTeams.length && <p className="panelNote">조건에 맞는 참가팀이 없습니다.</p>}
        <details className="compactTableDetails">
          <summary>표로 보기</summary>
          <DataTable columns={["팀명", "참가 유형", "팀장", "인원", "상태", "관리"]} rows={rows} />
        </details>
      </section>
      <section className="panel">
        <PanelTitle icon={<Mail />} title="참가자 이메일 목록" />
        <DataTable columns={["팀명", "역할", "이름", "이메일", "세션", "관리"]} rows={memberRows} />
      </section>
    </section>
  );
}

function OperatorProblemsPage({
  contestId,
  staffSession,
  navigate
}: {
  contestId?: string;
  staffSession: StaffSession;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const [dashboard, setDashboard] = useState<OperatorDashboard | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [divisionId, setDivisionId] = useState("");
  const [filterDivisionId, setFilterDivisionId] = useState("");
  const [displayOrder, setDisplayOrder] = useState(1);
  const [problemCode, setProblemCode] = useState("");
  const [title, setTitle] = useState("");
  const [timeLimitMs, setTimeLimitMs] = useState(1000);
  const [memoryLimitMb, setMemoryLimitMb] = useState(512);
  const [maxScore, setMaxScore] = useState(100);
  const [statement, setStatement] = useState("");
  const [inputDescription, setInputDescription] = useState("");
  const [outputDescription, setOutputDescription] = useState("");
  const [note, setNote] = useState("");
  const [examples, setExamples] = useState<ProblemExample[]>([]);
  const [authoringTab, setAuthoringTab] = useState<AuthoringTab>("settings");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [assets, setAssets] = useState<ProblemAsset[]>([]);
  const [selectedPackageRole, setSelectedPackageRole] = useState<PackageFileRole>("validator");
  const [testScript, setTestScript] = useState(TEST_SCRIPT_TEMPLATE);
  const [manualRecipeName, setManualRecipeName] = useState("sample1.in");
  const [generatorRecipeName, setGeneratorRecipeName] = useState("");
  const [generatorRecipeArgs, setGeneratorRecipeArgs] = useState("");
  const [testcaseSets, setTestcaseSets] = useState<TestcaseSet[]>([]);
  const [selectedTestcaseSetId, setSelectedTestcaseSetId] = useState("");
  const [testcaseDisplayOrder, setTestcaseDisplayOrder] = useState(1);
  const [inputKey, setInputKey] = useState("");
  const [outputKey, setOutputKey] = useState("");
  const [inputSha, setInputSha] = useState("");
  const [outputSha, setOutputSha] = useState("");
  const [testcaseDrafts, setTestcaseDrafts] = useState<TestcaseDraft[]>([newTestcaseDraft(1)]);
  const [bulkCaseWarnings, setBulkCaseWarnings] = useState<string[]>([]);
  const [caseDropActive, setCaseDropActive] = useState(false);
  const [operatorTestLanguage, setOperatorTestLanguage] = useState<"c99" | "cpp17" | "python313" | "java8">("python313");
  const [operatorTestSource, setOperatorTestSource] = useState("");
  const [operatorTestResult, setOperatorTestResult] = useState<Submission | null>(null);
  const [testcasePreview, setTestcasePreview] = useState<{ title: string; content: string } | null>(null);
  const [testcasePreviewBusy, setTestcasePreviewBusy] = useState(false);
  const [operatorTestBusy, setOperatorTestBusy] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ active: boolean; phase: string; current: number; total: number }>({
    active: false,
    phase: "",
    current: 0,
    total: 0
  });
  const [packageStatus, setPackageStatus] = useState<ProblemPackageStatus | null>(null);
  const statementRef = useRef<HTMLTextAreaElement | null>(null);

  async function loadProblems() {
    if (!contestId) return;
    setStatus("loading");
    try {
      const [context, data] = await Promise.all([
        apiRequest<OperatorDashboard>(`/operator/contests/${contestId}/dashboard`, staffSession.accessToken),
        apiRequest<Problem[]>(`/operator/contests/${contestId}/problems`, staffSession.accessToken)
      ]);
      setDashboard(context);
      setDivisions(context.divisions);
      if (!divisionId && context.divisions[0]) setDivisionId(context.divisions[0].division_id);
      if (!filterDivisionId && context.divisions[0]) setFilterDivisionId(context.divisions[0].division_id);
      setProblems(data);
      if (!selectedProblemId && data[0] && editorMode !== "create") openProblemEditor(data[0]);
      setStatus("ready");
      setMessage("문제 목록을 불러왔습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문제 목록을 불러오지 못했습니다.");
    }
  }

  useEffect(() => {
    loadProblems();
  }, [contestId]);

  useEffect(() => {
    if (divisions.length && !divisions.some((division) => division.division_id === divisionId)) {
      setDivisionId(divisions[0].division_id);
    }
    if (divisions.length && !divisions.some((division) => division.division_id === filterDivisionId)) {
      setFilterDivisionId(divisions[0].division_id);
    }
  }, [divisions, divisionId, filterDivisionId]);

  useEffect(() => {
    if (!selectedProblemId && (authoringTab === "tests" || authoringTab === "judge" || authoringTab === "preview")) {
      setAuthoringTab("settings");
    }
  }, [selectedProblemId, authoringTab]);

  if (!contestId) {
    return (
      <section className="pageGrid">
        <StaffContestGate navigate={navigate} />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="problems" title="문제 관리" description="문제 목록을 불러오는 중입니다." />
        {message && <p className="submitMessage error">{message}</p>}
      </section>
    );
  }

  const contest = dashboard.contest;
  const operationLocked = isContestOperationLocked(contest);

  function resetProblemEditor(nextDivisionId = divisionId || divisions[0]?.division_id || "") {
    setEditorMode("create");
    setSelectedProblemId("");
    setDivisionId(nextDivisionId);
    setFilterDivisionId(nextDivisionId);
    setDisplayOrder(problems.filter((problem) => problem.division_id === nextDivisionId).length + 1 || 1);
    setProblemCode("");
    setTitle("");
    setTimeLimitMs(1000);
    setMemoryLimitMb(512);
    setMaxScore(100);
    setStatement("");
    setInputDescription("");
    setOutputDescription("");
    setNote("");
    setExamples([]);
    setAuthoringTab("settings");
    setAssets([]);
    setSelectedPackageRole("validator");
    setTestScript(TEST_SCRIPT_TEMPLATE);
    setManualRecipeName("sample1.in");
    setGeneratorRecipeName("");
    setGeneratorRecipeArgs("");
    setTestcaseSets([]);
    setSelectedTestcaseSetId("");
    setTestcaseDisplayOrder(1);
    setInputKey("");
    setOutputKey("");
    setInputSha("");
    setOutputSha("");
    setTestcaseDrafts([newTestcaseDraft(1)]);
    setPackageStatus(null);
  }

  function openProblemEditor(problem: Problem) {
    const document = parseProblemDocument(problem.statement);
    setEditorMode("edit");
    setSelectedProblemId(problem.problem_id);
    setDivisionId(problem.division_id ?? divisionId);
    setFilterDivisionId(problem.division_id ?? divisionId);
    setDisplayOrder(problem.display_order ?? 1);
    setProblemCode(problem.problem_code);
    setTitle(problem.title);
    setTimeLimitMs(problem.time_limit_ms);
    setMemoryLimitMb(problem.memory_limit_mb);
    setMaxScore(problem.max_score);
    setStatement(document.statement);
    setInputDescription(document.inputDescription);
    setOutputDescription(document.outputDescription);
    setNote(document.note);
    setExamples(document.examples);
    setAuthoringTab("statement");
    setSelectedTestcaseSetId("");
    setTestcaseDisplayOrder(1);
    setTestcaseDrafts([newTestcaseDraft(1)]);
    loadProblemResources(problem.problem_id);
  }

  function problemValidationMessage(mode: "create" | "edit") {
    const missing: string[] = [];
    if (mode === "create" && !divisionId) missing.push("참가 유형");
    if (mode === "create" && !problemCode.trim()) missing.push("문제 코드");
    if (!title.trim()) missing.push("문제 제목");
    if (!statement.trim()) missing.push("문제 설명");
    if (!inputDescription.trim()) missing.push("입력 설명");
    if (!outputDescription.trim()) missing.push("출력 설명");
    if (mode === "edit" && !selectedProblemId) missing.push("수정할 문제 선택");
    return missing.length ? `${missing.join(", ")}을(를) 입력해야 합니다.` : "";
  }

  async function createProblem() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 문제를 추가할 수 없습니다.");
      return;
    }
    const validation = problemValidationMessage("create");
    if (validation) {
      setStatus("error");
      setMessage(validation);
      return;
    }
    setMessage("문제를 등록하고 있습니다.");
    try {
      const created = await apiRequest<Problem>(`/operator/contests/${contestId}/problems`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          division_id: divisionId,
          problem_code: problemCode,
          title,
          statement: serializeProblemDocument({ statement, inputDescription, outputDescription, note, examples }),
          time_limit_ms: timeLimitMs,
          memory_limit_mb: memoryLimitMb,
          display_order: displayOrder,
          max_score: maxScore
        })
      });
      setProblems((current) => [...current, created]);
      openProblemEditor(created);
      setStatus("ready");
      setMessage("문제가 등록되었습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문제 등록에 실패했습니다.");
    }
  }

  async function updateProblem() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 문제를 수정할 수 없습니다.");
      return;
    }
    const validation = problemValidationMessage("edit");
    if (validation) {
      setStatus("error");
      setMessage(validation);
      return;
    }
    setMessage("문제 정보를 저장하고 있습니다.");
    try {
      const updated = await apiRequest<Problem>(`/operator/contests/${contestId}/problems/${selectedProblemId}`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          division_id: divisionId,
          title,
          statement: serializeProblemDocument({ statement, inputDescription, outputDescription, note, examples }),
          time_limit_ms: timeLimitMs,
          memory_limit_mb: memoryLimitMb,
          display_order: displayOrder,
          max_score: maxScore
        })
      });
      setProblems((current) => current.map((problem) => (problem.problem_id === updated.problem_id ? { ...problem, ...updated } : problem)));
      setDivisionId(updated.division_id ?? divisionId);
      setFilterDivisionId(updated.division_id ?? divisionId);
      setStatus("ready");
      setMessage("문제 정보를 저장했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문제 저장에 실패했습니다.");
    }
  }

  async function loadProblemResources(problemId = selectedProblemId) {
    if (!problemId) return;
    setMessage("문제 리소스를 불러오고 있습니다.");
    try {
      const [assetList, setList, nextPackageStatus] = await Promise.all([
        apiRequest<ProblemAsset[]>(`/operator/contests/${contestId}/problems/${problemId}/assets`, staffSession.accessToken),
        apiRequest<TestcaseSet[]>(`/operator/contests/${contestId}/problems/${problemId}/testcase-sets`, staffSession.accessToken),
        apiRequest<ProblemPackageStatus>(`/operator/contests/${contestId}/problems/${problemId}/package-status`, staffSession.accessToken)
      ]);
      setAssets(assetList);
      setTestcaseSets(setList);
      setPackageStatus(nextPackageStatus);
      const preferredSetId = setList.find((item) => item.is_active)?.testcase_set_id ?? setList[0]?.testcase_set_id ?? "";
      setSelectedTestcaseSetId((current) => (current && setList.some((item) => item.testcase_set_id === current) ? current : preferredSetId));
      setStatus("ready");
      setMessage("문제 리소스를 불러왔습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "문제 리소스를 불러오지 못했습니다.");
    }
  }

  function insertIntoStatement(text: string) {
    const textarea = statementRef.current;
    if (!textarea) {
      setStatement((current) => `${current}${text}`);
      return;
    }
    const start = textarea.selectionStart ?? statement.length;
    const end = textarea.selectionEnd ?? statement.length;
    const next = `${statement.slice(0, start)}${text}${statement.slice(end)}`;
    setStatement(next);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + text.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  function applyDefaultStatementTemplate() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 문제 본문을 수정할 수 없습니다.");
      return;
    }
    setStatement((current) => current.trim() ? current : PROBLEM_STATEMENT_TEMPLATE);
    setInputDescription((current) => current.trim() ? current : PROBLEM_INPUT_TEMPLATE);
    setOutputDescription((current) => current.trim() ? current : PROBLEM_OUTPUT_TEMPLATE);
    setNote((current) => current.trim() ? current : PROBLEM_NOTE_TEMPLATE);
    setExamples((current) => current.length ? current : [{ input: "", output: "", note: "" }]);
  }

  async function uploadProblemAsset(file: File, insertInline = true) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 문제 리소스를 업로드할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택해야 리소스를 업로드할 수 있습니다.");
      return;
    }
    setMessage(`${file.name} 업로드를 준비하고 있습니다.`);
    try {
      const presign = await apiRequest<{ storage_key: string; upload_url: string; content_type: string }>(
        `/operator/contests/${contestId}/storage/presign-upload`,
        staffSession.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ category: "problem-assets", filename: file.name, content_type: file.type || "application/octet-stream" })
        }
      );
      const uploadResponse = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "content-type": file.type || presign.content_type || "application/octet-stream" },
        body: file
      });
      if (!uploadResponse.ok) throw new Error(`파일 업로드 실패: HTTP ${uploadResponse.status}`);
      const asset = await apiRequest<ProblemAsset>(`/operator/contests/${contestId}/problems/${selectedProblemId}/assets`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          original_filename: file.name,
          storage_key: presign.storage_key,
          mime_type: file.type || "application/octet-stream",
          file_size: file.size,
          sha256: await sha256Hex(file)
        })
      });
      if (insertInline) {
        insertIntoStatement(`\n\n![${file.name}](asset://${asset.asset_id})\n\n`);
      }
      await loadProblemResources(selectedProblemId);
      setStatus("ready");
      setMessage(`${file.name} 업로드와 리소스 등록이 완료되었습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "리소스 업로드에 실패했습니다.");
    }
  }

  async function uploadPackageFile(file: File, overrideRole?: PackageFileRole) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 출제 패키지 파일을 업로드할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택해야 출제 패키지 파일을 업로드할 수 있습니다.");
      return;
    }
    const role = overrideRole ?? selectedPackageRole;
    setMessage(`${PACKAGE_FILE_ROLES.find((item) => item.value === role)?.label ?? role} 파일 업로드를 준비하고 있습니다.`);
    try {
      const presign = await apiRequest<{ storage_key: string; upload_url: string; content_type: string }>(
        `/operator/contests/${contestId}/storage/presign-upload`,
        staffSession.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ category: `problems/${selectedProblemId}/package-files/${role}`, filename: `${Date.now()}-${file.name}`, content_type: file.type || "text/plain" })
        }
      );
      const uploadResponse = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "content-type": file.type || presign.content_type || "text/plain" },
        body: file
      });
      if (!uploadResponse.ok) throw new Error(`파일 업로드 실패: HTTP ${uploadResponse.status}`);
      await apiRequest<ProblemAsset>(`/operator/contests/${contestId}/problems/${selectedProblemId}/assets`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          original_filename: file.name,
          storage_key: presign.storage_key,
          mime_type: file.type || "text/plain",
          file_size: file.size,
          sha256: await sha256Hex(file)
        })
      });
      await loadProblemResources(selectedProblemId);
      setStatus("ready");
      setMessage(`${file.name} 패키지 파일 등록이 완료되었습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "패키지 파일 업로드에 실패했습니다.");
    }
  }

  async function deleteProblemAsset(assetId: string) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 검증 파일을 삭제할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) return;
    if (!window.confirm("검증 파일을 삭제할까요?")) return;
    setMessage("검증 파일을 삭제하고 있습니다.");
    try {
      await apiRequest<ProblemAsset>(`/operator/contests/${contestId}/problems/${selectedProblemId}/assets/${assetId}`, staffSession.accessToken, {
        method: "DELETE"
      });
      await loadProblemResources(selectedProblemId);
      setStatus("ready");
      setMessage("검증 파일을 삭제했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, "검증 파일 삭제 실패"));
    }
  }

  async function saveTestScriptRecipe() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트 스크립트를 저장할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택해야 테스트 스크립트를 저장할 수 있습니다.");
      return;
    }
    const scriptFile = new File([testScript], "script.txt", { type: "text/plain" });
    await uploadPackageFile(scriptFile, "test-script");
  }

  async function buildProblemPackageRecipe() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트 패키지를 빌드할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.");
      return;
    }
    const scriptLines = testScript.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
    const roleCount = (role: PackageFileRole) => assets.filter((asset) => packageFileRole(asset) === role).length;
    const usesGenerator = scriptLines.some((line) => !line.startsWith("manual "));
    const missing: string[] = [];
    if (!scriptLines.length) missing.push("Test Script");
    if (!roleCount("main-solution")) missing.push("Main Solution");
    if (!roleCount("validator")) missing.push("Validator");
    if (usesGenerator && !roleCount("generator")) missing.push("Generator");
    if (missing.length) {
      setStatus("error");
      setMessage(`${missing.join(", ")} 파일/내용이 필요합니다. 테스트 빌드에 필요한 리소스를 먼저 등록하세요.`);
      return;
    }
    try {
      await saveTestScriptRecipe();
      const result = await apiRequest<{ generated_count: number; testcase_set: TestcaseSet; checks: Record<string, unknown> }>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/package-builds`,
        staffSession.accessToken,
        { method: "POST", body: JSON.stringify({ script_text: testScript }) }
      );
      await loadProblemResources(selectedProblemId);
      setStatus("ready");
      setMessage(`빌드 완료: v${result.testcase_set.version} 활성 세트에 ${result.generated_count}개 테스트를 생성했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "테스트 패키지 빌드에 실패했습니다.");
    }
  }

  function appendTestScriptLine(line: string) {
    setTestScript((current) => {
      const prefix = current.trimEnd();
      return `${prefix ? `${prefix}\n` : ""}${line}\n`;
    });
  }

  function addManualRecipeLine() {
    const filename = manualRecipeName.trim();
    if (!filename) {
      setStatus("error");
      setMessage("manual input 파일명을 입력하세요. 예: sample1.in 또는 01");
      return;
    }
    appendTestScriptLine(`manual ${filename}`);
    setStatus("ready");
    setMessage(`Test Script에 manual ${filename} 줄을 추가했습니다.`);
  }

  function addGeneratorRecipeLine() {
    const fallbackGenerator = assets.find((asset) => packageFileRole(asset) === "generator");
    const generatorName = (generatorRecipeName || (fallbackGenerator ? fileStem(fallbackGenerator.original_filename) : "")).trim();
    if (!generatorName) {
      setStatus("error");
      setMessage("Generator 파일을 먼저 업로드하거나 generator 이름을 입력하세요.");
      return;
    }
    appendTestScriptLine(`${generatorName}${generatorRecipeArgs.trim() ? ` ${generatorRecipeArgs.trim()}` : ""}`);
    setGeneratorRecipeArgs("");
    setStatus("ready");
    setMessage(`Test Script에 ${generatorName} 실행 줄을 추가했습니다.`);
  }

  function removeTestScriptLine(lineIndex: number) {
    setTestScript((current) => current.split(/\r?\n/).filter((_, index) => index !== lineIndex).join("\n").trimEnd() + "\n");
  }

  function moveTestScriptLine(lineIndex: number, direction: -1 | 1) {
    setTestScript((current) => {
      const lines = current.split(/\r?\n/);
      const target = lineIndex + direction;
      if (target < 0 || target >= lines.length) return current;
      [lines[lineIndex], lines[target]] = [lines[target], lines[lineIndex]];
      return lines.join("\n").trimEnd() + "\n";
    });
  }

  async function createActiveTestcaseSet() {
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("테스트케이스 세트는 문제를 등록한 뒤 만들 수 있습니다. 먼저 상단의 등록 버튼으로 문제를 저장하세요.");
      return;
    }
    setMessage("새 활성 테스트케이스 세트를 만들고 있습니다.");
    try {
      const set = await apiRequest<TestcaseSet>(`/operator/contests/${contestId}/problems/${selectedProblemId}/testcase-sets`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({ is_active: true })
      });
      setTestcaseSets((current) => [{ ...set, testcases: [] }, ...current.map((item) => ({ ...item, is_active: false }))]);
      setSelectedTestcaseSetId(set.testcase_set_id);
      setStatus("ready");
      setMessage(`활성 테스트케이스 세트 v${set.version}를 만들었습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "테스트케이스 세트 생성에 실패했습니다.");
    }
  }

  async function activateSelectedTestcaseSet() {
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.");
      return;
    }
    if (!selectedTestcaseSetId) {
      setStatus("error");
      setMessage("활성화할 테스트케이스 세트를 먼저 선택하세요.");
      return;
    }
    setMessage("선택한 테스트케이스 세트를 활성화하고 있습니다.");
    try {
      await apiRequest<TestcaseSet>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/testcase-sets/${selectedTestcaseSetId}`,
        staffSession.accessToken,
        { method: "PATCH", body: JSON.stringify({ is_active: true }) }
      );
      setTestcaseSets((current) => current.map((item) => ({ ...item, is_active: item.testcase_set_id === selectedTestcaseSetId })));
      setStatus("ready");
      setMessage("선택한 테스트케이스 세트를 활성 세트로 전환했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "테스트케이스 세트 활성화에 실패했습니다.");
    }
  }

  async function deleteSelectedTestcaseSet() {
    if (!selectedProblemId || !selectedTestcaseSetId) {
      setStatus("error");
      setMessage("삭제할 테스트케이스 세트를 먼저 선택하세요.");
      return;
    }
    if (!window.confirm("선택한 테스트케이스 세트와 포함된 케이스 파일(.in/.out)을 삭제할까요?")) return;
    setMessage("테스트케이스 세트를 삭제하고 있습니다.");
    try {
      await apiRequest<TestcaseSet>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/testcase-sets/${selectedTestcaseSetId}`,
        staffSession.accessToken,
        { method: "DELETE" }
      );
      setTestcaseSets((current) => {
        const next = current.filter((item) => item.testcase_set_id !== selectedTestcaseSetId);
        const fallbackId = next.find((item) => item.is_active)?.testcase_set_id ?? next[0]?.testcase_set_id ?? "";
        setSelectedTestcaseSetId(fallbackId);
        return next;
      });
      setStatus("ready");
      setMessage("테스트케이스 세트를 삭제했습니다.");
      await loadProblemResources(selectedProblemId);
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, "테스트케이스 세트 삭제 실패"));
    }
  }

  async function deleteTestcase(setId: string, testcaseId: string) {
    if (!selectedProblemId) return;
    if (!window.confirm("이 테스트케이스와 파일(.in/.out)을 삭제할까요?")) return;
    setMessage("테스트케이스를 삭제하고 있습니다.");
    try {
      await apiRequest<Testcase>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/testcase-sets/${setId}/testcases/${testcaseId}`,
        staffSession.accessToken,
        { method: "DELETE" }
      );
      setTestcaseSets((current) =>
        current.map((item) =>
          item.testcase_set_id === setId
            ? { ...item, testcases: (item.testcases ?? []).filter((testcase) => testcase.testcase_id !== testcaseId) }
            : item
        )
      );
      setStatus("ready");
      setMessage("테스트케이스를 삭제했습니다.");
      await loadProblemResources(selectedProblemId);
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, "테스트케이스 삭제 실패"));
    }
  }

  async function openTestcasePreview(storageKey: string) {
    const filename = storageKey.split("/").pop() || storageKey;
    setTestcasePreviewBusy(true);
    try {
      const response = await fetch(`/api/storage/objects/${encodeStorageKey(storageKey)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const content = await response.text();
      setTestcasePreview({ title: filename, content });
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, `${filename} 파일을 불러오지 못했습니다.`));
    } finally {
      setTestcasePreviewBusy(false);
    }
  }

  async function addCaseToSelectedSet() {
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.");
      return;
    }
    if (!selectedTestcaseSetId) {
      setStatus("error");
      setMessage("케이스를 추가하려면 먼저 테스트케이스 세트를 만들거나 선택하세요.");
      return;
    }
    if (!inputKey || !outputKey) {
      setStatus("error");
      setMessage("입력 파일과 출력 파일을 업로드하거나 storage key를 입력해야 케이스를 추가할 수 있습니다.");
      return;
    }
    setMessage("선택한 테스트케이스 세트에 케이스를 추가하고 있습니다.");
    try {
      const testcase = await apiRequest<Testcase>(`/operator/contests/${contestId}/problems/${selectedProblemId}/testcase-sets/${selectedTestcaseSetId}/testcases`, staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          display_order: testcaseDisplayOrder,
          input_storage_key: inputKey,
          output_storage_key: outputKey,
          input_sha256: inputSha,
          output_sha256: outputSha,
          time_limit_ms_override: null,
          memory_limit_mb_override: null
        })
      });
      setTestcaseSets((current) =>
        current.map((item) =>
          item.testcase_set_id === selectedTestcaseSetId
            ? { ...item, testcases: [...(item.testcases ?? []), testcase].sort((a, b) => a.display_order - b.display_order) }
            : item
        )
      );
      setTestcaseDisplayOrder((current) => current + 1);
      setInputKey("");
      setOutputKey("");
      setInputSha("");
      setOutputSha("");
      setStatus("ready");
      setMessage("선택한 테스트케이스 세트에 케이스를 추가했습니다.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "테스트케이스 추가에 실패했습니다.");
    }
  }

  function addTestcaseDraft() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트케이스를 추가할 수 없습니다.");
      return;
    }
    setTestcaseDrafts((current) => [...current, newTestcaseDraft((current.at(-1)?.display_order ?? 0) + 1)]);
  }

  function removeTestcaseDraft(id: string) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트케이스를 수정할 수 없습니다.");
      return;
    }
    setTestcaseDrafts((current) => current.length === 1 ? [newTestcaseDraft(1)] : current.filter((item) => item.id !== id));
  }

  function updateTestcaseDraft(id: string, values: Partial<TestcaseDraft>) {
    if (operationLocked) return;
    setTestcaseDrafts((current) => current.map((item) => (item.id === id ? { ...item, ...values } : item)));
  }

  async function createVerifiedTestcaseSetFromDrafts() {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트케이스 세트를 생성할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.");
      return;
    }
    const missingRoles = TESTCASE_SUPPORT_FILE_ROLES.filter((role) => !packageRoleCounts.get(role));
    if (missingRoles.length) {
      setStatus("error");
      setMessage(`${missingRoles.map((role) => PACKAGE_FILE_ROLES.find((item) => item.value === role)?.label ?? role).join(", ")} 파일이 필요합니다.`);
      return;
    }
    const cases = testcaseDrafts
      .filter((item) => item.input_storage_key || item.output_storage_key)
      .map((item) => ({
        display_order: item.display_order,
        input_storage_key: item.input_storage_key,
        output_storage_key: item.output_storage_key,
        input_sha256: item.input_sha256,
        output_sha256: item.output_sha256
      }));
    if (!cases.length || cases.some((item) => !item.input_storage_key || !item.output_storage_key)) {
      setStatus("error");
      setMessage("모든 테스트케이스에 .in 파일과 .out 파일을 각각 업로드해야 합니다.");
      return;
    }
    setMessage("validator.cpp와 checker.cpp로 테스트케이스를 검증하고 있습니다.");
    try {
      const result = await apiRequest<{ verified_count: number; testcase_set: TestcaseSet; testcases: Testcase[]; checks: Record<string, unknown> }>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/verified-testcase-sets`,
        staffSession.accessToken,
        { method: "POST", body: JSON.stringify({ cases }) }
      );
      setTestcaseSets((current) => [{ ...result.testcase_set, testcases: result.testcases }, ...current.map((item) => ({ ...item, is_active: false }))]);
      setSelectedTestcaseSetId(result.testcase_set.testcase_set_id);
      await loadProblemResources(selectedProblemId);
      setStatus("ready");
      setMessage(`검증 완료: v${result.testcase_set.version} 활성 세트에 ${result.verified_count}개 테스트케이스를 등록했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "테스트케이스 검증에 실패했습니다.");
    }
  }

  async function uploadTestcaseZip(file: File) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트케이스 zip을 업로드할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.");
      return;
    }
    const missingRoles = TESTCASE_SUPPORT_FILE_ROLES.filter((role) => !packageRoleCounts.get(role));
    if (missingRoles.length) {
      setStatus("error");
      setMessage(`${missingRoles.map((role) => PACKAGE_FILE_ROLES.find((item) => item.value === role)?.label ?? role).join(", ")} 파일이 필요합니다.`);
      return;
    }
    setMessage("zip 파일의 .in/.out 쌍을 검증하고 있습니다.");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await apiRequest<{ verified_count: number; testcase_set: TestcaseSet; testcases: Testcase[]; imported_archive?: { filename: string; case_count: number; format: string } }>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/verified-testcase-sets:zip`,
        staffSession.accessToken,
        { method: "POST", body: form }
      );
      setTestcaseSets((current) => [{ ...result.testcase_set, testcases: result.testcases }, ...current.map((item) => ({ ...item, is_active: false }))]);
      setSelectedTestcaseSetId(result.testcase_set.testcase_set_id);
      await loadProblemResources(selectedProblemId);
      setStatus("ready");
      setMessage(`zip 검증 완료: ${result.verified_count}개 테스트케이스를 활성 세트 v${result.testcase_set.version}에 등록했습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, "zip 테스트케이스 검증 실패"));
    }
  }

  async function uploadTestcaseFile(file: File, kind: "input" | "output", draftId?: string) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트케이스 파일을 업로드할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택해야 테스트케이스 파일을 업로드할 수 있습니다.");
      return;
    }
    setMessage(`${kind} 파일 업로드를 준비하고 있습니다.`);
    try {
      const presign = await apiRequest<{ storage_key: string; upload_url: string; content_type: string }>(
        `/operator/contests/${contestId}/storage/presign-upload`,
        staffSession.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ category: `problems/${selectedProblemId}/testcases`, filename: file.name, content_type: file.type || "text/plain" })
        }
      );
      const uploadResponse = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "content-type": file.type || presign.content_type || "text/plain" },
        body: file
      });
      if (!uploadResponse.ok) throw new Error(`파일 업로드 실패: HTTP ${uploadResponse.status}`);
      const sha = await sha256Hex(file);
      if (kind === "input") {
        if (draftId) {
          updateTestcaseDraft(draftId, { input_filename: file.name, input_storage_key: presign.storage_key, input_sha256: sha });
        }
        setInputKey(presign.storage_key);
        setInputSha(sha);
      } else {
        if (draftId) {
          updateTestcaseDraft(draftId, { output_filename: file.name, output_storage_key: presign.storage_key, output_sha256: sha });
        }
        setOutputKey(presign.storage_key);
        setOutputSha(sha);
      }
      setStatus("ready");
      setMessage(`${file.name} 업로드가 완료되었습니다.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "테스트케이스 파일 업로드에 실패했습니다.");
    }
  }

  async function uploadAndCreateMatchedTestcaseSet(files: File[]) {
    if (operationLocked) {
      setStatus("error");
      setMessage("대회 중에는 테스트케이스를 업로드할 수 없습니다.");
      return;
    }
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.");
      return;
    }
    const missingRoles = TESTCASE_SUPPORT_FILE_ROLES.filter((role) => !packageRoleCounts.get(role));
    if (missingRoles.length) {
      setStatus("error");
      setMessage(`${missingRoles.map((role) => PACKAGE_FILE_ROLES.find((item) => item.value === role)?.label ?? role).join(", ")} 파일이 필요합니다.`);
      return;
    }
    const valid = files.filter((file) => /\.(in|out)$/i.test(file.name));
    if (!valid.length) {
      setStatus("error");
      setMessage(".in / .out 파일을 선택하세요.");
      return;
    }
    setMessage(`${valid.length}개 파일 업로드 및 자동 매칭을 진행합니다.`);
    setBulkCaseWarnings([]);
    setBulkProgress({ active: true, phase: "파일 업로드", current: 0, total: valid.length + 2 });
    try {
      const uploaded: Array<{ stem: string; ext: "in" | "out"; storageKey: string; sha: string; name: string }> = [];
      for (let index = 0; index < valid.length; index += 1) {
        const file = valid[index];
        const ext = file.name.toLowerCase().endsWith(".in") ? "in" : "out";
        const stem = file.name.replace(/\.(in|out)$/i, "");
        const presign = await apiRequest<{ storage_key: string; upload_url: string; content_type: string }>(
          `/operator/contests/${contestId}/storage/presign-upload`,
          staffSession.accessToken,
          {
            method: "POST",
            body: JSON.stringify({
              category: `problems/${selectedProblemId}/testcases/bulk`,
              filename: `${Date.now()}-${file.name}`,
              content_type: file.type || "text/plain"
            })
          }
        );
        const uploadResponse = await fetch(presign.upload_url, {
          method: "PUT",
          headers: { "content-type": file.type || presign.content_type || "text/plain" },
          body: file
        });
        if (!uploadResponse.ok) throw new Error(`파일 업로드 실패: HTTP ${uploadResponse.status} (${file.name})`);
        const sha = await sha256Hex(file);
        uploaded.push({ stem, ext, storageKey: presign.storage_key, sha, name: file.name });
        setBulkProgress((current) => ({ ...current, phase: "파일 업로드", current: Math.min(index + 1, current.total) }));
      }

      const grouped = new Map<string, { in?: { storageKey: string; sha: string; name: string }; out?: { storageKey: string; sha: string; name: string } }>();
      for (const item of uploaded) {
        const current = grouped.get(item.stem) ?? {};
        if (item.ext === "in") current.in = { storageKey: item.storageKey, sha: item.sha, name: item.name };
        if (item.ext === "out") current.out = { storageKey: item.storageKey, sha: item.sha, name: item.name };
        grouped.set(item.stem, current);
      }

      async function uploadEmptyPairFile(stem: string, ext: "in" | "out") {
        const emptyBlob = new Blob([""], { type: "text/plain" });
        const presign = await apiRequest<{ storage_key: string; upload_url: string; content_type: string }>(
          `/operator/contests/${contestId}/storage/presign-upload`,
          staffSession.accessToken,
          {
            method: "POST",
            body: JSON.stringify({
              category: `problems/${selectedProblemId}/testcases/bulk`,
              filename: `${Date.now()}-${stem}.${ext}`,
              content_type: "text/plain"
            })
          }
        );
        const uploadResponse = await fetch(presign.upload_url, {
          method: "PUT",
          headers: { "content-type": "text/plain" },
          body: emptyBlob
        });
        if (!uploadResponse.ok) throw new Error(`빈 ${ext.toUpperCase()} 파일 업로드 실패: HTTP ${uploadResponse.status} (${stem}.${ext})`);
        return { storageKey: presign.storage_key, sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" };
      }

      const warnings: string[] = [];
      const cases: Array<{
        display_order: number;
        input_storage_key: string;
        output_storage_key: string;
        input_sha256: string;
        output_sha256: string;
      }> = [];
      const sorted = Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
      for (let index = 0; index < sorted.length; index += 1) {
        const [stem, pair] = sorted[index];
        let input = pair.in;
        let output = pair.out;
        if (!input) {
          warnings.push(`${stem}: .in 누락 -> 빈 .in 생성`);
          const fallback = await uploadEmptyPairFile(stem, "in");
          input = { storageKey: fallback.storageKey, sha: fallback.sha, name: `${stem}.in` };
        }
        if (!output) {
          warnings.push(`${stem}: .out 누락 -> 빈 .out 생성`);
          const fallback = await uploadEmptyPairFile(stem, "out");
          output = { storageKey: fallback.storageKey, sha: fallback.sha, name: `${stem}.out` };
        }
        cases.push({
          display_order: index + 1,
          input_storage_key: input.storageKey,
          output_storage_key: output.storageKey,
          input_sha256: input.sha,
          output_sha256: output.sha
        });
      }
      setBulkProgress((current) => ({ ...current, phase: "매칭 완료", current: Math.min(valid.length + 1, current.total) }));

      setBulkCaseWarnings(warnings);
      if (!cases.length) {
        setStatus("error");
        setMessage("처리 가능한 테스트케이스가 없습니다.");
        return;
      }

      const result = await apiRequest<{ verified_count: number; testcase_set: TestcaseSet; testcases: Testcase[] }>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/verified-testcase-sets`,
        staffSession.accessToken,
        { method: "POST", body: JSON.stringify({ cases }) }
      );
      setTestcaseSets((current) => [{ ...result.testcase_set, testcases: result.testcases }, ...current.map((item) => ({ ...item, is_active: false }))]);
      setSelectedTestcaseSetId(result.testcase_set.testcase_set_id);
      setStatus("ready");
      setMessage(`자동 매칭 완료: ${result.verified_count}개 케이스를 저장했습니다.${warnings.length ? ` (누락 ${warnings.length}건)` : ""}`);
      setBulkProgress((current) => ({ ...current, phase: "검증 완료", current: current.total }));
      await loadProblemResources(selectedProblemId);
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, "자동 매칭 테스트케이스 생성 실패"));
    } finally {
      setTimeout(() => {
        setBulkProgress({ active: false, phase: "", current: 0, total: 0 });
      }, 1200);
    }
  }

  async function submitOperatorTestCode() {
    if (!selectedProblemId) {
      setStatus("error");
      setMessage("먼저 문제를 선택하세요.");
      return;
    }
    if (!operatorTestSource.trim()) {
      setStatus("error");
      setMessage("테스트 제출 코드를 입력하세요.");
      return;
    }
    setOperatorTestBusy(true);
    setOperatorTestResult(null);
    setMessage("운영자 테스트 제출을 생성하고 있습니다.");
    try {
      const created = await apiRequest<Submission>(
        `/operator/contests/${contestId}/problems/${selectedProblemId}/test-submissions`,
        staffSession.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ language: operatorTestLanguage, source_code: operatorTestSource })
        }
      );
      let latest = created;
      for (let i = 0; i < 40; i += 1) {
        const next = await apiRequest<Submission>(
          `/operator/contests/${contestId}/test-submissions/${created.submission_id}/status:wait?wait_seconds=2&poll_interval_seconds=0.25`,
          staffSession.accessToken
        );
        latest = next;
        setOperatorTestResult(next);
        if (isSubmissionTerminal(next.status)) break;
      }
      setStatus("ready");
      setMessage(`운영자 테스트 완료: ${submissionStatusLabel(latest.status)}`);
    } catch (error) {
      setStatus("error");
      setMessage(formatApiError(error, "운영자 테스트 제출 실패"));
    } finally {
      setOperatorTestBusy(false);
    }
  }

  const selectedDivision = divisions.find((division) => division.division_id === (filterDivisionId || divisionId)) ?? divisions[0] ?? emptyDivision();
  const problemDivision = divisions.find((division) => division.division_id === divisionId) ?? selectedDivision;
  const filtered = problems.filter((problem) => problem.division_id === selectedDivision.division_id);
  const selectedProblem = problems.find((problem) => problem.problem_id === selectedProblemId) ?? null;
  const statementLength = [statement, inputDescription, outputDescription, note].join("").trim().length;
  const testcaseCount = testcaseSets.reduce((count, set) => count + (set.testcases?.length ?? 0), 0);
  const activeTestcaseSet = testcaseSets.find((set) => set.is_active) ?? null;
  const createReady = Boolean(divisionId && problemCode.trim() && title.trim() && statement.trim() && inputDescription.trim() && outputDescription.trim());
  const updateReady = Boolean(selectedProblemId && title.trim() && statement.trim() && inputDescription.trim() && outputDescription.trim());
  const validationMessage = problemValidationMessage(editorMode);
  const statementAssets = assets.filter((asset) => !packageFileRole(asset));
  const packageAssets = assets.filter((asset) => packageFileRole(asset));
  const assetRows = statementAssets.map((asset) => [
    asset.original_filename,
    asset.mime_type,
    `${asset.file_size} B`,
    asset.asset_status,
    <button className="textButton" onClick={() => insertIntoStatement(`\n\n![${asset.original_filename}](asset://${asset.asset_id})\n\n`)}>본문 삽입</button>
  ]);
  const packageRows = packageAssets.filter((asset) => {
    const role = packageFileRole(asset);
    return role ? TESTCASE_SUPPORT_FILE_ROLES.includes(role) : false;
  }).map((asset) => {
    const role = packageFileRole(asset);
    return [
      PACKAGE_FILE_ROLES.find((item) => item.value === role)?.label ?? role ?? "-",
      asset.original_filename,
      `${asset.file_size} B`,
      asset.sha256.slice(0, 12),
      <span className="tableActions">
        {asset.download_url ? <a className="textButton" href={asset.download_url} target="_blank" rel="noreferrer">열기</a> : "-"}
        <button className="textButton dangerText" disabled={operationLocked} onClick={() => deleteProblemAsset(asset.asset_id)}>삭제</button>
      </span>
    ];
  });
  const packageRoleCounts = new Map<PackageFileRole, number>();
  packageAssets.forEach((asset) => {
    const role = packageFileRole(asset);
    if (role) packageRoleCounts.set(role, (packageRoleCounts.get(role) ?? 0) + 1);
  });
  const packageWarnings = packageStatus?.warnings ?? [];
  const supportFiles = packageStatus?.support_files ?? TESTCASE_SUPPORT_FILE_ROLES.map((role) => ({
    role,
    label: PACKAGE_FILE_ROLES.find((item) => item.value === role)?.label ?? role,
    required: true,
    count: packageRoleCounts.get(role) ?? 0,
    latest_filename: null,
    status: packageRoleCounts.get(role) ? "ready" : "missing"
  } satisfies PackageSupportFileStatus));
  const scriptLines = testScript.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  const testScriptRows = testScript
    .split(/\r?\n/)
    .map((line, index) => ({ line, lineIndex: index, trimmed: line.trim() }))
    .filter((row) => row.trimmed && !row.trimmed.startsWith("#"));
  const generatorOptions = Array.from(
    new Map(
      packageAssets
        .filter((asset) => packageFileRole(asset) === "generator")
        .map((asset) => [fileStem(asset.original_filename), asset.original_filename])
    ).entries()
  ).map(([value, label]) => ({ value, label }));
  const selectedGeneratorRecipeName = generatorRecipeName || generatorOptions[0]?.value || "";
  const buildSteps = [
    ["1 Generator", scriptLines.some((line) => !line.startsWith("manual ")) ? `${packageRoleCounts.get("generator") ?? 0} files` : "manual only"],
    ["2 Validator", packageRoleCounts.get("validator") ? "ready" : "missing"],
    ["3 Main Solution", packageRoleCounts.get("main-solution") ? "ready" : "missing"],
    ["4 Checker", packageRoleCounts.get("checker") ? "custom" : "normal compare"],
    ["5 Brute/Wrong", `${packageRoleCounts.get("brute-solution") ?? 0} brute / ${packageRoleCounts.get("wrong-solution") ?? 0} wrong`],
    ["6 Script", `${scriptLines.length} tests`]
  ];
  const authoringTabs: { value: AuthoringTab; label: string; detail: string }[] = [
    { value: "settings", label: "기본 정보", detail: "유형, 코드, 제한, 점수" },
    { value: "statement", label: "문제/예제", detail: "본문, 입출력, 노트, 리소스" },
    { value: "tests", label: "테스트케이스", detail: "패키지 파일, 스크립트, 빌드" },
    { value: "judge", label: "테스트 제출", detail: "실제 채점/결과 분석" },
    { value: "preview", label: "전체 미리보기", detail: "참가자에게 보일 문제 화면" }
  ];
  const tabRequiresProblemSelection: AuthoringTab[] = ["tests", "judge", "preview"];
  const isAuthoringTabDisabled = (tab: AuthoringTab) => !selectedProblemId && tabRequiresProblemSelection.includes(tab);
  const activeTestcaseSetId = activeTestcaseSet?.testcase_set_id ?? "";
  const testcaseDisplayName = (storageKey: string) => {
    const raw = storageKey.split("/").pop() || storageKey;
    return raw.replace(/^\d{10,16}-/, "");
  };
  const testcaseRows = (activeTestcaseSet?.testcases ?? []).map((testcase) => [
    testcase.display_order,
    <button className="textButton" onClick={() => openTestcasePreview(testcase.input_storage_key)}>
      {testcaseDisplayName(testcase.input_storage_key)}
    </button>,
    <button className="textButton" onClick={() => openTestcasePreview(testcase.output_storage_key)}>
      {testcaseDisplayName(testcase.output_storage_key)}
    </button>,
    <button className="textButton dangerText" disabled={operationLocked || !activeTestcaseSetId} onClick={() => deleteTestcase(activeTestcaseSetId, testcase.testcase_id)}>케이스 삭제</button>
  ]);

  return (
    <section className="pageGrid">
      <PageHeader badge="problems" title="문제 관리" description="참가 유형별로 문제를 완전히 분리해 등록하고 수정합니다." />
      <section className="summaryGrid">
        <InfoCard icon={<FileCode2 />} title="문제" value={String(problems.length)} detail="all divisions" />
        <InfoCard icon={<Trophy />} title="현재 유형" value={selectedDivision.name} detail={`${filtered.length} problems`} />
        <InfoCard icon={<Database />} title="리소스" value="MinIO" detail="presigned upload" />
        <InfoCard icon={<Lock />} title="보존 정책" value="삭제 없음" detail="비공개/상태 전환 예정" />
      </section>
      {operationLocked && (
        <section className="emergencyBox">
          <Lock size={18} />
          <span>대회 진행 중에는 문제 추가/수정, 리소스 업로드, 검증 파일, 테스트케이스 변경이 잠깁니다.</span>
        </section>
      )}
      <section className="problemAuthoringLayout">
        <aside className="panel authoringSidebar">
          <div className="panelTitleRow">
            <PanelTitle icon={<FileCode2 />} title="문제 목록" />
            <button className="iconButton" disabled={operationLocked} onClick={() => resetProblemEditor(selectedDivision.division_id)} aria-label="새 문제"><Plus size={14} /></button>
          </div>
          <p className="panelNote">DOMjudge처럼 유형별 문제 목록에서 선택한 뒤 우측 폼에서 기본정보와 본문, 테스트 리소스를 한 번에 관리합니다.</p>
          <Segmented options={divisions} value={selectedDivision.division_id} onChange={(value) => { setFilterDivisionId(value); resetProblemEditor(value); }} />
          <div className="authoringProblemList">
            {filtered.map((problem) => (
              <button
                key={problem.problem_id}
                className={selectedProblemId === problem.problem_id && editorMode === "edit" ? "authoringProblemItem active" : "authoringProblemItem"}
                onClick={() => openProblemEditor(problem)}
              >
                <span className="problemCode">{problem.problem_code}</span>
                <span className="authoringProblemMeta">
                  <strong>{problem.title}</strong>
                  <small>{problem.time_limit_ms / 1000}s · {problem.memory_limit_mb}MB · {problem.max_score}점</small>
                </span>
              </button>
            ))}
            {!filtered.length && (
              <div className="authoringEmptyState">
                <strong>{selectedDivision.name} 문제 없음</strong>
                <span>`+` 버튼으로 첫 문제를 추가하세요.</span>
              </div>
            )}
          </div>
          <button className="secondary" onClick={() => navigate("operator-settings", { contestId })}>대회 설정</button>
        </aside>
        <section className="panel authoringMain">
          <div className="panelTitleRow">
            <PanelTitle icon={<BookOpen />} title={editorMode === "create" ? "새 문제 작성" : `문제 편집 · ${selectedProblem?.problem_code ?? ""}`} />
            <div className="tableActions">
              <button className="secondary" onClick={loadProblems}>목록 새로고침</button>
              <button className="secondary" disabled={operationLocked} onClick={() => resetProblemEditor(selectedDivision.division_id)}><Plus size={16} /> 새 문제</button>
              {editorMode === "edit" ? (
                <button onClick={updateProblem} disabled={operationLocked}><Pencil size={16} /> 저장</button>
              ) : (
                <button onClick={createProblem} disabled={operationLocked}><FileCode2 size={16} /> 등록</button>
              )}
            </div>
          </div>
          <p className="panelNote">문제는 참가 유형에 귀속됩니다. 유형이 다르면 같은 문제 코드라도 별도 문제처럼 운영됩니다.</p>
          {message && <p className={`submitMessage ${status === "error" ? "error" : "done"}`}>{message}</p>}
          {validationMessage && <p className="panelHint">{validationMessage}</p>}
          {editorMode === "edit" && packageWarnings.length > 0 && (
            <section className="problemHealthBanner">
              <AlertTriangle size={18} />
              <span>{packageWarnings.join(" ")}</span>
            </section>
          )}
          <div className="authoringInfoBar">
            <span>{problemDivision.name}</span>
            <span>{editorMode === "edit" ? "기존 문제 편집" : "신규 문제 작성"}</span>
            <span>삭제 없음</span>
          </div>
          <section className="authoringStatusGrid">
            <div className="authoringStatusCard">
              <strong>{editorMode === "edit" ? selectedProblem?.problem_code ?? "선택 없음" : problemCode || "새 문제"}</strong>
              <span>{editorMode === "edit" ? (title || "문제 제목 없음") : (title || "신규 문제 초안")}</span>
            </div>
            <div className="authoringStatusCard">
              <strong>{statementLength.toLocaleString()} chars</strong>
              <span>{statementLength ? "본문 작성 중" : "본문 비어 있음"}</span>
            </div>
            <div className="authoringStatusCard">
              <strong>{assets.length} assets</strong>
              <span>{selectedProblemId ? "문제 리소스 등록 가능" : "문제 등록 후 리소스 연결"}</span>
            </div>
            <div className="authoringStatusCard">
              <strong>{testcaseCount} cases</strong>
              <span>{activeTestcaseSet ? "현재 테스트케이스 등록됨" : "테스트케이스 없음"}</span>
            </div>
          </section>
          <div className="authoringTabs" role="tablist" aria-label="문제 출제 단계">
            {authoringTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={authoringTab === tab.value}
                className={authoringTab === tab.value ? "active" : ""}
                disabled={isAuthoringTabDisabled(tab.value)}
                onClick={() => !isAuthoringTabDisabled(tab.value) && setAuthoringTab(tab.value)}
              >
                <strong>{tab.label}</strong>
                <small>{tab.detail}</small>
              </button>
            ))}
          </div>
          {!selectedProblemId && (
            <p className="panelHint">문제를 먼저 선택하거나 등록해야 `테스트케이스`, `테스트 제출`, `전체 미리보기`를 사용할 수 있습니다.</p>
          )}
          {authoringTab === "settings" && (
          <section className="editorSectionGrid">
            <div className="editorSection">
              <h3>기본 정보</h3>
              <p className="panelNote">문제 코드는 생성 후 변경하지 않는 기준으로 운영합니다.</p>
              <div className="fieldGrid">
                <label><span>참가 유형</span><select value={divisionId} disabled={operationLocked} onChange={(event) => setDivisionId(event.target.value)}>{divisions.map((division) => <option key={division.division_id} value={division.division_id}>{division.name}</option>)}</select></label>
                <label><span>문제 코드</span><input value={problemCode} placeholder="A" onChange={(event) => setProblemCode(event.target.value)} disabled={operationLocked || editorMode === "edit"} /></label>
                <label><span>문제 제목</span><input value={title} disabled={operationLocked} placeholder="문제 제목" onChange={(event) => setTitle(event.target.value)} /></label>
                <label><span>표시 순서</span><input type="number" value={displayOrder} disabled={operationLocked} onChange={(event) => setDisplayOrder(Number(event.target.value))} /></label>
              </div>
            </div>
            <div className="editorSection">
              <h3>제한과 점수</h3>
              <div className="fieldGrid">
                <label><span>시간 제한(ms)</span><input type="number" value={timeLimitMs} disabled={operationLocked} onChange={(event) => setTimeLimitMs(Number(event.target.value))} /></label>
                <label><span>메모리(MB)</span><input type="number" value={memoryLimitMb} disabled={operationLocked} onChange={(event) => setMemoryLimitMb(Number(event.target.value))} /></label>
                <label><span>최대 점수</span><input type="number" value={maxScore} disabled={operationLocked} onChange={(event) => setMaxScore(Number(event.target.value))} /></label>
              </div>
            </div>
          </section>
          )}
          {authoringTab === "statement" && (
          <>
          <section className="editorSection">
            <div className="panelTitleRow">
              <h3>Statement</h3>
              <div className="authoringHeaderActions">
                <button className="secondary" disabled={operationLocked} onClick={applyDefaultStatementTemplate}>기본 템플릿</button>
              </div>
            </div>
            <p className="panelNote">문제 설명, 입력, 출력, 노트, 예제를 분리해서 작성합니다. 이미지는 본문 커서 위치에 바로 삽입됩니다.</p>
            <div className="authoringSectionNav">
              <a href="#statement-main">statement</a>
              <a href="#statement-input">input</a>
              <a href="#statement-output">output</a>
              <a href="#statement-examples">examples</a>
              <a href="#statement-note">note</a>
            </div>
            <div className="authoringStatementGrid">
              <div className="statementEditorStack">
                <label id="statement-main" className="wideField">
                  <span>Problem statement</span>
                  <textarea
                    ref={statementRef}
                    className="authoringStatement"
                    value={statement}
                    disabled={operationLocked}
                    placeholder="문제 설명을 작성하세요."
                    onChange={(event) => setStatement(event.target.value)}
                  />
                </label>
                <section className="editorSectionGrid">
                  <label id="statement-input" className="wideField">
                    <span>Input description</span>
                    <textarea value={inputDescription} disabled={operationLocked} placeholder="입력 형식과 제약을 작성하세요." onChange={(event) => setInputDescription(event.target.value)} />
                  </label>
                  <label id="statement-output" className="wideField">
                    <span>Output description</span>
                    <textarea value={outputDescription} disabled={operationLocked} placeholder="출력 형식을 작성하세요." onChange={(event) => setOutputDescription(event.target.value)} />
                  </label>
                </section>
                <label id="statement-note" className="wideField">
                  <span>Note</span>
                  <textarea value={note} disabled={operationLocked} placeholder="예제 설명, 구현 힌트, 주의사항 등을 작성하세요." onChange={(event) => setNote(event.target.value)} />
                </label>
              </div>
            </div>
          </section>
          <section id="statement-examples" className="editorSection">
            <div className="panelTitleRow">
              <h3>Examples</h3>
              <button className="secondary" disabled={operationLocked} onClick={() => setExamples((current) => [...current, { input: "", output: "", note: "" }])}>예제 추가</button>
            </div>
            <p className="panelNote">예제 입력, 예제 출력, 설명을 여러 개 추가할 수 있습니다. 문제 페이지에는 Codeforces 스타일 예제 블록으로 표시됩니다.</p>
            <div className="authoringExamples">
              {examples.map((example, index) => (
                <section key={index} className="authoringExampleCard">
                  <div className="panelTitleRow">
                    <h3>예제 {index + 1}</h3>
                    <span className="tableActions">
                      <button className="textButton" onClick={() => setExamples((current) => current.map((item, itemIndex) => itemIndex === index - 1 ? current[index] : itemIndex === index ? current[index - 1] : item))} disabled={operationLocked || index === 0}>위로</button>
                      <button className="textButton" onClick={() => setExamples((current) => current.map((item, itemIndex) => itemIndex === index ? current[index + 1] : itemIndex === index + 1 ? current[index] : item))} disabled={operationLocked || index === examples.length - 1}>아래로</button>
                      <button className="textButton" disabled={operationLocked} onClick={() => setExamples((current) => current.filter((_, itemIndex) => itemIndex !== index))}>삭제</button>
                    </span>
                  </div>
                  <div className="fieldGrid">
                    <label className="wideField">
                      <span>예제 입력</span>
                      <textarea value={example.input} disabled={operationLocked} onChange={(event) => setExamples((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, input: event.target.value } : item)))} />
                    </label>
                    <label className="wideField">
                      <span>예제 출력</span>
                      <textarea value={example.output} disabled={operationLocked} onChange={(event) => setExamples((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, output: event.target.value } : item)))} />
                    </label>
                  </div>
                  <label className="wideField">
                    <span>설명</span>
                    <textarea value={example.note ?? ""} disabled={operationLocked} onChange={(event) => setExamples((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, note: event.target.value } : item)))} />
                  </label>
                </section>
              ))}
              {!examples.length && <div className="authoringEmptyState"><strong>등록된 예제 없음</strong><span>`예제 추가`로 입력/출력을 따로 관리하세요.</span></div>}
            </div>
          </section>
          </>
          )}
          {authoringTab === "statement" && (
            <section className="editorSection">
              <div className="panelTitleRow">
                <h3>문제 리소스</h3>
                <button className="secondary" onClick={() => selectedProblemId ? loadProblemResources(selectedProblemId) : setMessage("먼저 문제를 등록하거나 기존 문제를 선택하세요.")}>새로고침</button>
              </div>
              <p className="panelNote">본문 중간 이미지는 업로드 후 자동으로 markdown에 삽입합니다. 문제를 한 번 등록한 뒤 리소스를 연결할 수 있습니다.</p>
              <div className="buttonRow">
                <label className={selectedProblemId && !operationLocked ? "uploadButton" : "uploadButton disabled"}>
                  <Database size={16} /> 이미지/리소스 업로드
                  <input
                    type="file"
                    hidden
                    disabled={operationLocked || !selectedProblemId}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (file) await uploadProblemAsset(file, true);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
              <DataTable columns={["파일명", "MIME", "크기", "상태", "본문 삽입"]} rows={assetRows} />
            </section>
          )}
          {authoringTab === "tests" && (
          <section className="editorSectionGrid">
            <div className="editorSection fullWidth">
              <div className="panelTitleRow">
                <h3>검증 파일</h3>
                <span className="panelNote">testlib.h / validator.cpp / checker.cpp</span>
              </div>
              <p className="panelNote">문제마다 `testlib.h`, `validator.cpp`, `checker.cpp`를 업로드합니다. `.in`은 validator로 검증하고, `.out`은 checker에 공식 출력으로 넣어 self-check합니다.</p>
              {packageWarnings.length > 0 && (
                <section className="problemHealthBanner">
                  <AlertTriangle size={18} />
                  <span>{packageWarnings.join(" ")}</span>
                </section>
              )}
              <div className="buildStepGrid">
                {supportFiles.map((file) => (
                  <div className={file.status === "ready" ? "buildStepCard ready" : "buildStepCard missing"} key={file.role}>
                    <strong>{file.label}</strong>
                    <span>{file.status === "ready" ? file.latest_filename ?? `${file.count} files` : "missing"}</span>
                  </div>
                ))}
                <div className={activeTestcaseSet ? "buildStepCard ready" : "buildStepCard missing"}>
                  <strong>Current Tests</strong>
                  <span>{activeTestcaseSet ? `${packageStatus?.active_testcase_count ?? testcaseCount} cases` : "missing"}</span>
                </div>
              </div>
              <section className="packageUploadMatrix">
                {PACKAGE_FILE_ROLES.filter((role) => TESTCASE_SUPPORT_FILE_ROLES.includes(role.value)).map((role) => (
                  <label className={selectedProblemId && !operationLocked ? "packageUploadTile" : "packageUploadTile disabled"} key={role.value}>
                    <span>
                      <strong>{role.label}</strong>
                      <small>{role.detail}</small>
                    </span>
                    <span className="statusPill active">{packageRoleCounts.get(role.value) ?? 0}</span>
                    <input
                      type="file"
                      hidden
                      disabled={operationLocked || !selectedProblemId}
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (file) await uploadPackageFile(file, role.value);
                        event.target.value = "";
                      }}
                    />
                  </label>
                ))}
              </section>
              <DataTable columns={["역할", "파일명", "크기", "SHA256", "확인"]} rows={packageRows} />
            </div>
            <div className="editorSection fullWidth">
              <div className="panelTitleRow">
                <h3>테스트케이스 파일</h3>
                <span className="panelNote">파일명 자동 매칭</span>
              </div>
              <p className="panelNote">`.in`/`.out` 파일을 드롭하거나 다중 선택하면 같은 이름으로 자동 매칭합니다. 예: `1.in` ↔ `1.out`, `001.in` ↔ `001.out`.</p>
              <section
                className={caseDropActive ? "testcaseDropZone active" : "testcaseDropZone"}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!operationLocked && selectedProblemId) setCaseDropActive(true);
                }}
                onDragLeave={() => setCaseDropActive(false)}
                onDrop={async (event) => {
                  event.preventDefault();
                  setCaseDropActive(false);
                  if (operationLocked || !selectedProblemId) return;
                  const files = Array.from(event.dataTransfer.files ?? []);
                  if (files.length) await uploadAndCreateMatchedTestcaseSet(files);
                }}
              >
                <strong>파일 드롭/다중 선택 업로드</strong>
                <span>.in / .out 파일만 처리됩니다.</span>
                <label className={selectedProblemId && !operationLocked ? "uploadButton" : "uploadButton disabled"}>
                  <Database size={16} /> 파일 선택
                  <input
                    type="file"
                    hidden
                    multiple
                    disabled={operationLocked || !selectedProblemId}
                    accept=".in,.out,text/plain"
                    onChange={async (event) => {
                      const files = Array.from(event.target.files ?? []);
                      if (files.length) await uploadAndCreateMatchedTestcaseSet(files);
                      event.target.value = "";
                    }}
                  />
                </label>
              </section>
              {bulkProgress.active && (
                <section className="bulkProgressPanel">
                  <div className="bulkProgressHeader">
                    <strong>{bulkProgress.phase}</strong>
                    <span>{Math.min(bulkProgress.current, bulkProgress.total)} / {bulkProgress.total}</span>
                  </div>
                  <div className="bulkProgressTrack">
                    <span style={{ width: `${bulkProgress.total ? Math.floor((Math.min(bulkProgress.current, bulkProgress.total) / bulkProgress.total) * 100) : 0}%` }} />
                  </div>
                </section>
              )}
              {!!bulkCaseWarnings.length && (
                <section className="problemHealthBanner">
                  <AlertTriangle size={18} />
                  <span>{bulkCaseWarnings.length}개 매칭 누락: {bulkCaseWarnings.slice(0, 6).join(" / ")}</span>
                </section>
              )}
              <div className="testcaseFlow">
                <span className={packageRoleCounts.get("package-resource") ? "done" : ""}>1 testlib.h</span>
                <span className={packageRoleCounts.get("validator") ? "done" : ""}>2 validator.cpp</span>
                <span className={packageRoleCounts.get("checker") ? "done" : ""}>3 checker.cpp</span>
                <span>4 파일명 자동 매칭</span>
              </div>
            </div>
            <div className="editorSection fullWidth">
              <div className="panelTitleRow">
                <h3>현재 테스트케이스</h3>
                <span className="panelNote">{activeTestcaseSet ? `${activeTestcaseSet.testcases?.length ?? 0}개` : "등록 없음"}</span>
              </div>
              <DataTable columns={["순서", "input", "output", "삭제"]} rows={testcaseRows} />
            </div>
          </section>
          )}
          {authoringTab === "judge" && (
          <section className="editorSectionGrid">
            <div className="editorSection fullWidth">
              <div className="panelTitleRow">
                <h3>운영자 테스트 제출</h3>
                <span className="panelNote">실제 채점 서버 큐 사용</span>
              </div>
              <div className="fieldGrid">
                <label>
                  <span>언어</span>
                  <select value={operatorTestLanguage} onChange={(event) => setOperatorTestLanguage(event.target.value as "c99" | "cpp17" | "python313" | "java8")}>
                    <option value="c99">C99</option>
                    <option value="cpp17">C++17</option>
                    <option value="python313">Python 3.13</option>
                    <option value="java8">Java 8</option>
                  </select>
                </label>
              </div>
              <section className="submitPanel">
                <div className="panelTitleRow">
                  <h3>코드</h3>
                  <span className="panelNote">실제 채점 에이전트로 테스트됩니다.</span>
                </div>
                <CodeEditor value={operatorTestSource} language={operatorTestLanguage} onChange={setOperatorTestSource} disabled={operatorTestBusy} />
              </section>
              <div className="buttonRow">
                <button onClick={submitOperatorTestCode} disabled={operatorTestBusy || !selectedProblemId}>
                  <FileCode2 size={16} /> {operatorTestBusy ? "채점 대기/진행 중" : "테스트 제출"}
                </button>
              </div>
              {operatorTestResult && (
                <section className="problemHealthBanner">
                  {(() => {
                    const detail = parseJudgeDetail(operatorTestResult.judge_message);
                    return (
                      <>
                  <span>
                    결과: <SubmissionStatusBadge submission={operatorTestResult} compact />
                  </span>
                  <span>
                    진행: {submissionProgressText(operatorTestResult) || "-"}
                    {isSubmissionPending(operatorTestResult.status) && operatorTestResult.progress_total
                      ? ` · 현재 케이스 ${Math.min((operatorTestResult.progress_current ?? 0) + 1, operatorTestResult.progress_total)}/${operatorTestResult.progress_total}`
                      : ""}
                  </span>
                  <span>실패 케이스: {operatorTestResult.failed_testcase_order ?? "-"}</span>
                  <span>제출 ID: {operatorTestResult.submission_id}</span>
                  {detail.caseFiles && (
                    <span>실패 파일: {detail.caseFiles}</span>
                  )}
                  {operatorTestResult.compile_message && (
                    <pre className="logBox">compile: {operatorTestResult.compile_message}</pre>
                  )}
                  {detail.inputText && (
                    <pre className="logBox">input:
{detail.inputText}</pre>
                  )}
                  {detail.expectedText && (
                    <pre className="logBox">expected:
{detail.expectedText}</pre>
                  )}
                  {detail.actualText && (
                    <pre className="logBox">actual:
{detail.actualText}</pre>
                  )}
                  {operatorTestResult.judge_message && (
                    <pre className="logBox">judge: {operatorTestResult.judge_message}</pre>
                  )}
                      </>
                    );
                  })()}
                </section>
              )}
            </div>
          </section>
          )}
          {authoringTab === "preview" && (
            <section className="editorSection">
              <div className="panelTitleRow">
                <h3>전체 미리보기</h3>
                <div className="tableActions">
                  <button className="secondary" onClick={() => setAuthoringTab("statement")}>본문 수정</button>
                  <button className="secondary" onClick={() => setAuthoringTab("tests")}>테스트 관리</button>
                </div>
              </div>
              <p className="panelNote">저장 전 초안 기준 미리보기입니다. 참가자 화면에 보일 제목, 제한, 지문, 예제 구성을 한 번에 확인합니다.</p>
              <section className="previewMetaGrid">
                <div className="previewMetaItem"><span>참가 유형</span><strong>{problemDivision.name}</strong></div>
                <div className="previewMetaItem"><span>문제 코드</span><strong>{editorMode === "edit" ? selectedProblem?.problem_code ?? "-" : problemCode || "-"}</strong></div>
                <div className="previewMetaItem"><span>제한</span><strong>{timeLimitMs / 1000}s / {memoryLimitMb}MB</strong></div>
                <div className="previewMetaItem"><span>점수</span><strong>{maxScore}점</strong></div>
                <div className="previewMetaItem"><span>예제</span><strong>{examples.length}개</strong></div>
                <div className="previewMetaItem"><span>리소스</span><strong>{assets.length}개</strong></div>
                <div className="previewMetaItem"><span>패키지 파일</span><strong>{packageAssets.length}개</strong></div>
                <div className="previewMetaItem"><span>테스트</span><strong>{testcaseCount} cases</strong></div>
              </section>
              <section className="authoringPreviewPanel full">
                <AuthoringStatementPreview
                  title={title || "문제 제목"}
                  document={{ statement, inputDescription, outputDescription, note, examples }}
                  assets={assets}
                />
              </section>
            </section>
          )}
        </section>
      </section>
      {(testcasePreview || testcasePreviewBusy) && (
        <div className="modalOverlay" onClick={() => !testcasePreviewBusy && setTestcasePreview(null)}>
          <section className="modalPanel" onClick={(event) => event.stopPropagation()}>
            <div className="panelTitleRow">
              <h3>{testcasePreview?.title ?? "파일 불러오는 중..."}</h3>
              <button className="secondary" disabled={testcasePreviewBusy} onClick={() => setTestcasePreview(null)}>닫기</button>
            </div>
            <pre className="logBox testcasePreviewText">{testcasePreviewBusy ? "불러오는 중..." : testcasePreview?.content || ""}</pre>
          </section>
        </div>
      )}
    </section>
  );
}

function AdminPage({
  api,
  staffSession,
  navigate,
  section
}: {
  api: ApiState;
  staffSession: StaffSession;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  section: "home" | "contests" | "judge";
}) {
  const [dashboard, setDashboard] = useState<ApiState["adminDashboard"]>(api.adminDashboard);
  const [contests, setContests] = useState<Contest[]>([]);
  const [message, setMessage] = useState("");
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestTitle, setContestTitle] = useState("");
  const [contestOpenDate, setContestOpenDate] = useState(todayInputValue());
  const [organizationName, setOrganizationName] = useState("");
  const [contestStatus, setContestStatus] = useState("scheduled");
  const [operatorEmail, setOperatorEmail] = useState("");
  const [serviceNotices, setServiceNotices] = useState<Notice[]>([]);
  const [serviceNoticeTitle, setServiceNoticeTitle] = useState("");
  const [serviceNoticeSummary, setServiceNoticeSummary] = useState("");
  const [serviceNoticeBody, setServiceNoticeBody] = useState("");
  const [serviceNoticeEmergency, setServiceNoticeEmergency] = useState(false);
  const [judgeDashboard, setJudgeDashboard] = useState<AdminJudgeDashboard | null>(null);
  const [judgeEntries, setJudgeEntries] = useState<AdminJudgeSubmissionEntry[]>([]);
  const [selectedJudgeEntry, setSelectedJudgeEntry] = useState<AdminJudgeSubmissionEntry | null>(null);
  const [judgePageIndex, setJudgePageIndex] = useState(1);
  const judgePageSize = 20;
  const showHome = section === "home";
  const showContests = section === "contests";
  const showJudge = section === "judge";

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      setMessage("관리자 요약을 불러오는 중입니다.");
      try {
        const data = await apiRequest<ApiState["adminDashboard"]>("/admin/dashboard", staffSession.accessToken);
        if (!cancelled) {
          setDashboard(data);
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : "관리자 요약을 불러오지 못했습니다.");
        }
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [staffSession.accessToken]);

  async function loadAdminContests() {
    try {
      const data = await apiRequest<Contest[]>("/admin/contests", staffSession.accessToken);
      setContests(data);
    } catch (error) {
      setMessage(formatApiError(error, "대회 목록을 불러오지 못했습니다"));
    }
  }

  useEffect(() => {
    if (!showContests) return;
    loadAdminContests();
  }, [staffSession.accessToken, showContests]);

  async function loadServiceNotices() {
    try {
      const data = await apiRequest<Notice[]>("/admin/service-notices", staffSession.accessToken);
      setServiceNotices(data);
    } catch (error) {
      setMessage(formatApiError(error, "서비스 공지를 불러오지 못했습니다"));
    }
  }

  useEffect(() => {
    if (!showHome) return;
    loadServiceNotices();
  }, [staffSession.accessToken, showHome]);

  async function loadJudgeInspector() {
    try {
      const [dashboardData, submissionData] = await Promise.all([
        apiRequest<AdminJudgeDashboard>("/admin/judge/dashboard", staffSession.accessToken),
        apiRequest<AdminJudgeSubmissionEntry[]>("/admin/judge/submissions?limit=120", staffSession.accessToken),
      ]);
      setJudgeDashboard(dashboardData);
      setJudgeEntries(submissionData);
      if (selectedJudgeEntry) {
        const updated = submissionData.find((item) => item.submission.submission_id === selectedJudgeEntry.submission.submission_id);
        setSelectedJudgeEntry(updated ?? null);
      }
    } catch (error) {
      setMessage(formatApiError(error, "채점기 현황을 불러오지 못했습니다"));
    }
  }

  useEffect(() => {
    if (!showJudge) return;
    loadJudgeInspector();
  }, [staffSession.accessToken, showJudge]);

  useEffect(() => {
    if (!showJudge) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadJudgeInspector();
    }, 3000);
    const onFocus = () => loadJudgeInspector();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [staffSession.accessToken, selectedJudgeEntry?.submission.submission_id, showJudge]);

  function resetContestEditor() {
    setContestTitle("");
    setContestOpenDate(todayInputValue());
    setOrganizationName("");
    setContestStatus("scheduled");
    setOperatorEmail("");
    setEditingContestId(null);
  }

  function openCreateContest() {
    resetContestEditor();
    setEditorMode("create");
  }

  function openEditContest(contest: Contest) {
    setContestTitle(contest.title);
    setContestOpenDate(dateInputValue(contest.start_at));
    setOrganizationName(contest.organization_name);
    setContestStatus(contest.status);
    setOperatorEmail("");
    setEditingContestId(contest.contest_id);
    setEditorMode("edit");
  }

  function closeContestEditor() {
    setEditorMode(null);
    setEditingContestId(null);
    setOperatorEmail("");
  }

  async function createContest() {
    if (!contestTitle.trim() || !organizationName.trim() || !operatorEmail.trim()) {
      setMessage("대회명, 개최기관, 운영자 이메일은 필수입니다.");
      return;
    }
    setMessage("대회를 생성하고 있습니다.");
    try {
      const contest = await apiRequest<Contest>("/admin/contests", staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          title: contestTitle.trim(),
          organization_name: organizationName,
          operator_email: operatorEmail.trim()
        })
      });
      setContests((current) => [contest, ...current]);
      setMessage("대회를 생성했습니다. 일정(오픈/마감/프리즈)은 비워진 상태이며 대회 운영 화면에서 설정하세요.");
      closeContestEditor();
      resetContestEditor();
    } catch (error) {
      setMessage(formatApiError(error, "대회 생성 실패"));
    }
  }

  async function updateContest() {
    if (!editingContestId) return;
    const current = contests.find((contest) => contest.contest_id === editingContestId);
    if (!current) return;
    setMessage("대회 정보를 수정하고 있습니다.");
    try {
      const updated = await apiRequest<Contest>(`/operator/contests/${editingContestId}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          title: contestTitle.trim() || current.title,
          organization_name: organizationName,
          status: contestStatus,
          start_at: `${contestOpenDate}T00:00:00+09:00`,
          overview: current.overview === `${current.organization_name}에서 주최하는 대회입니다.` ? `${organizationName}에서 주최하는 대회입니다.` : current.overview,
        })
      });
      if (operatorEmail.trim()) {
        await apiRequest(`/admin/contests/${editingContestId}/operators`, staffSession.accessToken, {
          method: "POST",
          body: JSON.stringify({ email: operatorEmail.trim() })
        });
      }
      setContests((currentList) => currentList.map((contest) => (contest.contest_id === updated.contest_id ? updated : contest)));
      setMessage("대회 정보를 수정했습니다.");
      closeContestEditor();
    } catch (error) {
      setMessage(formatApiError(error, "대회 수정 실패"));
    }
  }

  async function createServiceNotice() {
    setMessage("서비스 공지를 등록하고 있습니다.");
    try {
      const notice = await apiRequest<Notice>("/admin/service-notices", staffSession.accessToken, {
        method: "POST",
        body: JSON.stringify({
          title: serviceNoticeTitle,
          summary: serviceNoticeSummary,
          body: serviceNoticeBody,
          emergency: serviceNoticeEmergency
        })
      });
      setServiceNotices((current) => [notice, ...current]);
      setServiceNoticeTitle("");
      setServiceNoticeSummary("");
      setServiceNoticeBody("");
      setServiceNoticeEmergency(false);
      setMessage("서비스 공지를 등록했습니다.");
    } catch (error) {
      setMessage(formatApiError(error, "서비스 공지 등록 실패"));
    }
  }

  useEffect(() => {
    setJudgePageIndex(1);
  }, [judgeEntries.length, section]);

  const judgeTotalPages = Math.max(1, Math.ceil(judgeEntries.length / judgePageSize));
  const judgeSafePage = Math.min(judgePageIndex, judgeTotalPages);
  const judgePageItems = judgeEntries.slice((judgeSafePage - 1) * judgePageSize, judgeSafePage * judgePageSize);

  const contestRows = contests.map((contest) => [
    contest.title,
    contest.organization_name,
    contest.status,
    formatDate(contest.start_at),
    <span className="tableActions">
      <button className="iconButton" onClick={() => openEditContest(contest)} aria-label="대회 수정"><Pencil size={14} /></button>
      <button className="textButton" onClick={() => navigate("operator", { contestId: contest.contest_id })}>운영</button>
    </span>
  ]);

  return (
    <section className="pageGrid">
      <PageHeader
        badge="admin"
        title={section === "home" ? "관리 홈" : section === "contests" ? "대회 관리" : "채점기 관리"}
        description={section === "home" ? "서비스 운영 요약과 공지를 관리합니다." : section === "contests" ? "대회 생성/수정과 운영자 연결을 관리합니다." : "채점 노드, 큐, 제출 로그를 관리합니다."}
      />
      {showHome && (
        <section className="summaryGrid">
          <InfoCard icon={<Trophy />} title="대회" value={String(dashboard?.contest_count ?? 0)} detail="total contests" />
          <InfoCard icon={<Activity />} title="대기 job" value={String(dashboard?.pending_jobs ?? 0)} detail="pending" />
          <InfoCard icon={<Mail />} title="메일 큐" value={String(dashboard?.mail_queue_pending ?? 0)} detail="pending" />
          <InfoCard icon={<Server />} title="채점 노드" value={String(dashboard?.judge_node_count ?? 0)} detail="registered" />
        </section>
      )}
      {message && <p className="submitMessage error">{message}</p>}
      {showJudge && (
      <section className="panel">
        <div className="panelTitleRow">
          <PanelTitle icon={<Server />} title="채점기" />
          <button className="secondary" onClick={loadJudgeInspector}>새로고침</button>
        </div>
        <div className="summaryGrid">
          <InfoCard icon={<Server />} title="채점 노드" value={String(judgeDashboard?.nodes.length ?? 0)} detail="registered" />
          <InfoCard icon={<Activity />} title="큐" value={String(judgeDashboard?.queue.filter((job) => job.status === "pending").length ?? 0)} detail="pending" />
          <InfoCard icon={<PlayCircle />} title="실행 중" value={String(judgeDashboard?.queue.filter((job) => job.status === "running" || job.status === "assigned").length ?? 0)} detail="running/assigned" />
          <InfoCard icon={<Clock3 />} title="최근 기록" value={String(judgeEntries.length)} detail="latest submissions" />
        </div>
        <DataTable
          columns={["노드", "상태", "슬롯", "실행", "하트비트"]}
          rows={(judgeDashboard?.nodes ?? []).map((node) => [
            node.node_name,
            node.schedulable ? "schedulable" : "paused",
            `${node.free_slots}/${node.total_slots}`,
            String(node.running_job_count),
            formatDate(node.last_heartbeat_at),
          ])}
        />
        <DataTable
          columns={["시간", "대회", "문제", "팀/계정", "언어", "결과", "제한", "채점 노드", "상세"]}
          rows={judgePageItems.map((entry) => [
            formatDate(entry.submission.submitted_at),
            entry.contest?.title ?? "-",
            entry.problem ? `${entry.problem.problem_code} · ${entry.problem.title}` : entry.submission.problem_id,
            `${entry.team?.team_name ?? "-"} / ${entry.member?.email ?? "-"}`,
            entry.submission.language,
            <SubmissionStatusBadge submission={entry.submission} compact />,
            entry.problem ? `${entry.problem.time_limit_ms / 1000}s · ${entry.problem.memory_limit_mb}MB` : "-",
            entry.judge_node?.node_name ?? entry.judge_job?.assigned_node_id ?? "-",
            <button className="textButton" onClick={() => setSelectedJudgeEntry(entry)}>보기</button>,
          ])}
        />
        {judgeEntries.length > 0 && <SimplePagination page={judgeSafePage} totalPages={judgeTotalPages} onChange={setJudgePageIndex} />}
      </section>
      )}
      {showJudge && selectedJudgeEntry && (
        <section className="panel">
          <div className="panelTitleRow">
            <PanelTitle icon={<FileCode2 />} title={`제출 상세 · ${selectedJudgeEntry.submission.submission_id}`} />
            <button className="secondary" onClick={() => setSelectedJudgeEntry(null)}>닫기</button>
          </div>
          <section className="previewMetaGrid">
            <div className="previewMetaItem"><span>대회</span><strong>{selectedJudgeEntry.contest?.title ?? "-"}</strong></div>
            <div className="previewMetaItem"><span>참가 유형</span><strong>{selectedJudgeEntry.division?.name ?? "-"}</strong></div>
            <div className="previewMetaItem"><span>문제</span><strong>{selectedJudgeEntry.problem ? `${selectedJudgeEntry.problem.problem_code} · ${selectedJudgeEntry.problem.title}` : selectedJudgeEntry.submission.problem_id}</strong></div>
            <div className="previewMetaItem"><span>팀 / 사용자</span><strong>{selectedJudgeEntry.team?.team_name ?? "-"} / {selectedJudgeEntry.member?.email ?? "-"}</strong></div>
            <div className="previewMetaItem"><span>언어</span><strong>{selectedJudgeEntry.submission.language}</strong></div>
            <div className="previewMetaItem"><span>채점 결과</span><strong>{submissionStatusLabel(selectedJudgeEntry.submission.status)}</strong></div>
            <div className="previewMetaItem"><span>실패 케이스</span><strong>{selectedJudgeEntry.submission.failed_testcase_order ?? "-"}</strong></div>
            <div className="previewMetaItem"><span>활성 테스트케이스 수</span><strong>{selectedJudgeEntry.active_testcase_count}</strong></div>
          </section>
          <div className="fieldGrid">
            <label className="wideField"><span>소스 코드</span><pre className="logBox">{selectedJudgeEntry.submission.source_code || "-"}</pre></label>
            <label className="wideField"><span>컴파일 로그</span><pre className="logBox">{selectedJudgeEntry.submission.compile_message || "-"}</pre></label>
            <label className="wideField"><span>채점 로그</span><pre className="logBox">{selectedJudgeEntry.submission.judge_message || "-"}</pre></label>
            {(() => {
              const parsed = parseJudgeDetail(selectedJudgeEntry.submission.judge_message);
              return (
                <>
                  <label className="wideField"><span>실패 입력</span><pre className="logBox">{parsed.inputText || "-"}</pre></label>
                  <label className="wideField"><span>기대 출력</span><pre className="logBox">{parsed.expectedText || "-"}</pre></label>
                  <label className="wideField"><span>실제 출력</span><pre className="logBox">{parsed.actualText || "-"}</pre></label>
                </>
              );
            })()}
          </div>
        </section>
      )}
      {showHome && (
      <section className="panel">
        <div className="panelTitleRow">
          <PanelTitle icon={<Megaphone />} title="서비스 공지" />
          <button className="secondary" onClick={loadServiceNotices}>새로고침</button>
        </div>
        <div className="fieldGrid">
          <label><span>제목</span><input value={serviceNoticeTitle} onChange={(event) => setServiceNoticeTitle(event.target.value)} /></label>
          <label><span>요약</span><input value={serviceNoticeSummary} onChange={(event) => setServiceNoticeSummary(event.target.value)} /></label>
          <label className="checkboxLine"><input type="checkbox" checked={serviceNoticeEmergency} onChange={(event) => setServiceNoticeEmergency(event.target.checked)} /> 긴급 공지</label>
        </div>
        <textarea value={serviceNoticeBody} onChange={(event) => setServiceNoticeBody(event.target.value)} />
        <div className="buttonRow">
          <button onClick={createServiceNotice}><Plus size={16} /> 서비스 공지 등록</button>
        </div>
        <DataTable
          columns={["제목", "요약", "긴급", "게시"]}
          rows={serviceNotices.map((notice) => [
            notice.title,
            notice.summary,
            notice.emergency ? "Y" : "N",
            formatDate(notice.published_at)
          ])}
        />
      </section>
      )}
      {showContests && (
      <section className="panel">
        <div className="panelTitleRow">
          <PanelTitle icon={<CalendarDays />} title="전체 대회" />
          <div className="tableActions">
            <button className="secondary" onClick={loadAdminContests}>목록 새로고침</button>
            <button onClick={openCreateContest}><Plus size={16} /> 대회 추가</button>
          </div>
        </div>
        <p className="panelNote">대회 추가는 목록에서 `+`, 수정은 각 행의 연필 버튼으로 진행합니다. 참가 유형, 문제, 참가팀은 대회 운영자 화면에서 관리합니다.</p>
        <DataTable columns={["대회", "개최기관", "상태", "시작", "관리"]} rows={contestRows} />
      </section>
      )}
      {showContests && editorMode && (
        <section className="panel">
          <div className="panelTitleRow">
            <PanelTitle icon={editorMode === "create" ? <Plus /> : <Pencil />} title={editorMode === "create" ? "대회 추가" : "대회 수정"} />
            <button className="textButton" onClick={closeContestEditor}>닫기</button>
          </div>
          <p className="panelNote">
            {editorMode === "create"
              ? "서비스 마스터 대회 생성은 대회명, 개최기관, 운영자만 지정합니다. 일정(오픈/마감/프리즈)은 생성 후 운영 화면에서 설정합니다."
              : "대회 수정에서는 공개상태/오픈일/운영자 변경이 가능합니다."}
          </p>
          <div className="fieldGrid">
            <label><span>대회명</span><input value={contestTitle} placeholder="2026 ZERONE Programming Contest" onChange={(event) => setContestTitle(event.target.value)} /></label>
            <label><span>주최 기관</span><input value={organizationName} placeholder="ZERONE" onChange={(event) => setOrganizationName(event.target.value)} /></label>
            <label><span>{editorMode === "create" ? "대회 운영자 이메일" : "추가/변경 운영자 이메일"}</span><input value={operatorEmail} placeholder="operator@example.com" onChange={(event) => setOperatorEmail(event.target.value)} /></label>
            {editorMode === "edit" && (
              <>
                <label><span>대회 오픈일</span><input type="date" value={contestOpenDate} onChange={(event) => setContestOpenDate(event.target.value)} /></label>
                <label><span>대회 공개상태</span><select value={contestStatus} onChange={(event) => setContestStatus(event.target.value)}><option value="scheduled">스케줄</option><option value="open">오픈</option></select></label>
              </>
            )}
          </div>
          <div className="buttonRow">
            {editorMode === "create" ? (
              <button onClick={createContest}><Plus size={16} /> 대회 추가</button>
            ) : (
              <button onClick={updateContest}><Pencil size={16} /> 대회 수정</button>
            )}
            <button className="secondary" onClick={closeContestEditor}>취소</button>
          </div>
        </section>
      )}
    </section>
  );
}

function LoginShell({
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

function MetricStrip({ api }: { api: ApiState }) {
  return (
    <section className="metricStrip">
      <InfoCard icon={<Trophy />} title="공개 대회" value={String(api.contests.length)} detail="public" />
      <InfoCard icon={<Server />} title="채점 노드" value={String(api.judgeStatus?.active_node_count ?? 0)} detail="active" />
      <InfoCard icon={<Activity />} title="큐" value={String(api.judgeStatus?.total_queue_depth ?? 0)} detail="pending" />
      <InfoCard icon={<CheckCircle2 />} title="지원 언어" value="4" detail="C99/C++17/Python/Java" />
    </section>
  );
}

function PageHeader({ badge, title, description }: { badge: string; title: string; description: string }) {
  return (
    <header className="pageHeader">
      <span className="eyebrow">{badge}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="panelTitle">{icon}<h2>{title}</h2></div>;
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="feature">{icon}<strong>{title}</strong><p>{text}</p></div>;
}

function InfoCard({ icon, title, value, detail }: { icon: React.ReactNode; title: string; value: string; detail: string }) {
  return <article className="infoCard">{icon}<span>{title}</span><strong>{value}</strong><p>{detail}</p></article>;
}

function PanelBlock({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return <section className="panel"><PanelTitle icon={icon} title={title} /><List>{items.map((item) => <li key={item}><span>{item}</span></li>)}</List></section>;
}

function List({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <ul className={className ? `cleanList ${className}` : "cleanList"}>{children}</ul>;
}

function AuthoringStatementPreview({
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

function MarkdownPreview({ statement, assets }: { statement: string; assets: ProblemAsset[] }) {
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

function renderInlineMarkdown(text: string, assets: ProblemAsset[], keyPrefix: string) {
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

function ExampleBox({ examples }: { examples: ProblemExample[] }) {
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

function Segmented({ options, value, onChange }: { options: Division[]; value: string; onChange: (value: string) => void }) {
  return <div className="segmented">{options.map((option) => <button key={option.division_id} className={value === option.division_id ? "active" : ""} onClick={() => onChange(option.division_id)}>{option.name}</button>)}</div>;
}

function DivisionLock({ division }: { division: Division }) {
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

function SettingToggle({ title, detail, checked, onToggle }: { title: string; detail: string; checked: boolean; onToggle: () => void }) {
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

function ResultCell({
  problemScore
}: {
  problemScore?: { score: number; max_score: number; attempts: number; wrong_attempts: number; solved: boolean };
}) {
  if (!problemScore || problemScore.attempts <= 0) {
    return <span className="resultCell empty">-<small>0</small></span>;
  }
  if (problemScore.solved || problemScore.score >= problemScore.max_score) {
    const suffix = problemScore.wrong_attempts > 0 ? `+${problemScore.wrong_attempts}` : "+";
    return <span className="resultCell solved">{suffix}<small>{problemScore.score}</small></span>;
  }
  return <span className="resultCell failed">-{problemScore.attempts}<small>{problemScore.score}</small></span>;
}

function isSubmissionPending(status?: string | null) {
  return ["waiting", "preparing", "judging"].includes(status ?? "");
}

function isSubmissionTerminal(status?: string | null) {
  return Boolean(status) && !isSubmissionPending(status);
}

function submissionStatusLabel(status?: string | null) {
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
    default:
      return status ?? "미제출";
  }
}

function submissionStatusTone(status?: string | null) {
  switch (status) {
    case "accepted":
      return "success";
    case "waiting":
    case "preparing":
    case "judging":
      return "pending";
    case "wrong_answer":
    case "compile_error":
    case "runtime_error":
    case "time_limit_exceeded":
    case "memory_limit_exceeded":
    case "output_limit_exceeded":
      return "danger";
    default:
      return "neutral";
  }
}

type SubmissionProgressState = {
  status?: string | null;
  progress_current?: number | null;
  progress_total?: number | null;
};

function submissionProgressPercent(submission?: SubmissionProgressState | null) {
  const status = submission?.status;
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

function submissionProgressText(submission?: SubmissionProgressState | null) {
  const status = submission?.status;
  const current = submission?.progress_current;
  const total = submission?.progress_total;
  const percent = submissionProgressPercent(submission);
  if (!isSubmissionPending(status) || percent === null) return "";
  if (total && total > 0) return `${current ?? 0}/${total} · ${percent}%`;
  return `${percent}%`;
}

function SubmissionStatusBadge({ submission, compact = false }: { submission?: SubmissionProgressState | null; compact?: boolean }) {
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

function DataTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <table>
      <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

function SimplePagination({
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

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatRelativeTime(value?: string) {
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

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function dateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function dateTimeLocalValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function dateTimeLocalToIso(value: string) {
  return new Date(value).toISOString();
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function timeLeft(endAt: string) {
  const diff = Math.max(0, new Date(endAt).getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${seconds}s`;
}

function parseJudgeDetail(message?: string | null) {
  if (!message) return { caseFiles: "", inputText: "", expectedText: "", actualText: "" };
  const caseFiles = message.match(/^testcase\s+#\d+\s*\(([^)]+)\):/i)?.[1] ?? "";
  const inputText = message.match(/\[input\]\n([\s\S]*?)\n\[expected\]\n/)?.[1]?.trim() ?? "";
  const expectedText = message.match(/\[expected\]\n([\s\S]*?)\n\[actual\]\n/)?.[1]?.trim() ?? "";
  const actualText = message.match(/\[actual\]\n([\s\S]*)$/)?.[1]?.trim() ?? "";
  return { caseFiles, inputText, expectedText, actualText };
}

function encodeStorageKey(storageKey: string) {
  return storageKey.split("/").map((part) => encodeURIComponent(part)).join("/");
}

function isFrozen(contest: Contest) {
  const now = Date.now();
  return now >= new Date(contest.freeze_at).getTime() && now < new Date(contest.end_at).getTime();
}

function freezeAnnouncement(contest: Contest) {
  const diffMinutes = Math.ceil((new Date(contest.freeze_at).getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0 || diffMinutes > 30) return "";
  const threshold = diffMinutes <= 5 ? 5 : diffMinutes <= 10 ? 10 : diffMinutes <= 20 ? 20 : 30;
  return `스코어보드 프리즈 ${threshold}분 전입니다. 프리즈 이후 공개 스코어보드는 프리즈 시점 순위만 표시됩니다.`;
}

function contestEndAnnouncement(contest: Contest) {
  const diffMinutes = Math.ceil((new Date(contest.end_at).getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0 || diffMinutes > 30) return "";
  const threshold = diffMinutes <= 1 ? 1 : diffMinutes <= 5 ? 5 : diffMinutes <= 10 ? 10 : diffMinutes <= 20 ? 20 : 30;
  return `대회 종료 ${threshold}분 전입니다. 종료 후에는 제출할 수 없습니다.`;
}

createRoot(document.getElementById("root")!).render(<App />);
