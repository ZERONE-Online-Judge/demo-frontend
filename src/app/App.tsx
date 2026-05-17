import React, { useEffect, useMemo, useState } from "react";
import { Megaphone, X } from "lucide-react";
import {
  Page,
  RouteState,
  ApiStatus,
  Contest,
  Division,
  Problem,
  ProblemAsset,
  PackageFileRole,
  AuthoringTab,
  ProblemExample,
  ProblemDocument,
  MonacoEditorInstance,
  MonacoNamespace,
  MonacoLoader,
  MonacoWindow,
  Testcase,
  TestcaseSet,
  PackageSupportFileStatus,
  ProblemPackageStatus,
  TestcaseDraft,
  ScoreboardRow,
  ScoreboardResponse,
  OperatorScoreboardResponse,
  Submission,
  TeamMember,
  TeamMemberDraft,
  ParticipantTeam,
  ParticipantBulkImportResponse,
  Notice,
  ContestNotice,
  ContestAnswer,
  ContestQuestion,
  JudgeStatus,
  AdminJudgeSubmissionEntry,
  AdminJudgeDashboard,
  ApiPageMeta,
  ApiPagePayload,
  ApiState,
  ParticipantSession,
  PublicVisibility,
  StaffAccount,
  StaffSession,
  GeneralParticipantContest,
  GeneralOperatorContest,
  GeneralSession,
  GeneralSessionApi,
  OperatorDashboard,
  MathJaxWindow,
  API_BASE_URL,
  OTP_VALID_SECONDS,
  PARTICIPANT_SESSION_KEY,
  GENERAL_SESSION_KEY,
  SESSION_SYNC_EVENT,
  PROBLEM_META_PREFIX,
  CONTEST_STATUS_OPTIONS,
  PROBLEM_STATEMENT_TEMPLATE,
  PROBLEM_INPUT_TEMPLATE,
  PROBLEM_OUTPUT_TEMPLATE,
  PROBLEM_NOTE_TEMPLATE,
  PACKAGE_FILE_ROLES,
  TESTCASE_SUPPORT_FILE_ROLES,
  TEST_SCRIPT_TEMPLATE,
  sortProblemsByDisplayOrder,
  ApiClientError,
  ApiRawResponse,
  staffRefreshInFlight,
  generalRefreshInFlight,
  participantRefreshInFlight,
  emitSessionSync,
  clearStoredSessionForFailedToken,
  toApiError,
  apiFetchRaw,
  canAttemptAutoRefresh,
  parseContestId,
  preferredStoredTokenForRequest,
  storedReplacementTokenForRequest,
  refreshOperatorAccessTokenViaGeneralSession,
  refreshStaffAccessToken,
  refreshGeneralAccessToken,
  refreshParticipantAccessToken,
  tryRefreshTokenForRequest,
  parseRoute,
  readPageQuery,
  routePath,
  emptyContest,
  emptyDivision,
  isContestEnded,
  isContestOperationLocked,
  isScheduleTbd,
  contestStatusLabel,
  contestAccessPhase,
  canViewContestResource,
  apiRequest,
  apiPageRequest,
  formatApiError,
  formatParticipantTeamError,
  parseProblemDocument,
  serializeProblemDocument,
  resolveAssetSource,
  packageFileRole,
  fileStem,
  newTestcaseDraft,
  isOperatorPage,
  ensureMathJax,
  ensureMonaco,
  monacoLanguage,
  pageLabel,
  splitDelimitedLine,
  parseTeamImportFile,
  sha256Hex,
  readRetryAfterSeconds,
  useCooldown,
  useClockTick,
  useAutoRefresh,
  loadStoredParticipantSession,
  saveParticipantSession,
  mapStaffSession,
  isValidStaffSession,
  mapGeneralSession,
  loadStoredGeneralSession,
  saveGeneralSession,
  useApiData,
  LoginShell,
  MetricStrip,
  PageHeader,
  PageNotice,
  PanelTitle,
  Feature,
  InfoCard,
  PanelBlock,
  List,
  AuthoringStatementPreview,
  MarkdownPreview,
  renderInlineMarkdown,
  ExampleBox,
  Segmented,
  DivisionLock,
  SettingToggle,
  ResultCell,
  ProblemSolveBadge,
  isSubmissionPending,
  isSubmissionTerminal,
  submissionStatusLabel,
  submissionStatusTone,
  SubmissionProgressState,
  submissionProgressPercent,
  submissionProgressText,
  SubmissionStatusBadge,
  DataTable,
  SimplePagination,
  formatDate,
  formatRelativeTime,
  todayInputValue,
  dateInputValue,
  dateTimeLocalValue,
  dateTimeLocalToIso,
  formatTime,
  isSameLocalDay,
  formatContestMoment,
  timeLeft,
  contestRemainingLabel,
  problemVisibilityMessage,
  participantProblemEmptyMessage,
  parseJudgeDetail,
  encodeStorageKey,
  isFrozen,
  freezeAnnouncement,
  contestEndAnnouncement
} from "../shared";
import { ApiBanner, TopBar } from "../components/layout/TopBar";
import { GeneralLoginPage, HomePage, ContestListPage, ServiceContactPage, ServiceHelpPage, ServiceNoticePage, ServiceRulesPage } from "../pages/service/ServicePages";
import { AccessGate, BoardPage, ContestPage, ProblemPage, ProblemSetPage, ScoreboardPage, StaffAccessGate, SubmissionsPage } from "../pages/contest/ContestPages";
import { JudgeStatusPage, OperatorPage, OperatorParticipantsPage, OperatorProblemsPage, OperatorSettingsPage } from "../pages/operator/OperatorPages";
import { AdminPage } from "../pages/admin/AdminPage";

export type ShellFact = { label: string; value: string };
export type ShellAction = { label: string; active?: boolean; onClick: () => void };

export function AppShell({
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
  const emergencyKey = `${contest?.contest_id ?? ""}:${emergencyTexts.join("|")}`;

  useEffect(() => {
    setNoticeClosed(false);
  }, [emergencyKey]);

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

export function App() {
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
  const operatorCandidate = generalSession?.operatorSession;
  const operatorStaffSession = isValidStaffSession(operatorCandidate) ? operatorCandidate : null;
  const generalOperatorStaffSession = useMemo<StaffSession | null>(() => {
    if (!generalSession || generalSession.operatorContests.length === 0) return null;
    if (operatorStaffSession) {
      return {
        ...operatorStaffSession,
        accessToken: generalSession.accessToken,
        refreshToken: generalSession.refreshToken
      };
    }
    const contestScopes = generalSession.operatorContests.reduce<Record<string, string[]>>((scopes, entry) => {
      scopes[entry.contest.contest_id] = entry.scopes;
      return scopes;
    }, {});
    const isServiceMaster = generalSession.operatorContests.some((entry) => entry.scopes.includes("master"));
    return {
      accessToken: generalSession.accessToken,
      refreshToken: generalSession.refreshToken,
      staff: {
        email: generalSession.account.email,
        display_name: generalSession.account.display_name,
        is_service_master: isServiceMaster,
        contest_scopes: contestScopes
      },
      defaultRedirect: isServiceMaster ? "/admin" : "/operator"
    };
  }, [generalSession, operatorStaffSession]);
  const activeParticipant = participant?.contestId === selectedContest.contest_id ? participant : null;
  const activeGeneralParticipant = generalSession?.participantContests.find((entry) => entry.contest.contest_id === selectedContest.contest_id) ?? null;
  const activeGeneralOperator = generalSession?.operatorContests.find((entry) => entry.contest.contest_id === selectedContest.contest_id) ?? null;
  const contestScopedPages: Page[] = ["participant-login", "contest", "problemset", "problem", "submissions", "scoreboard", "board"];
  const isContestArea = contestScopedPages.includes(page) && Boolean(route.contestId);
  const activeDivisionId = activeParticipant?.division.division_id ?? activeGeneralParticipant?.division.division_id ?? divisionId;
  const currentDivision = useMemo(
    () => {
      if (activeGeneralOperator && isContestArea && !activeDivisionId) return { ...emptyDivision(), name: "전체" };
      return api.divisions.find((division) => division.division_id === activeDivisionId) ?? activeParticipant?.division ?? activeGeneralParticipant?.division ?? api.divisions[0] ?? emptyDivision();
    },
    [api.divisions, activeDivisionId, activeParticipant, activeGeneralParticipant, activeGeneralOperator, isContestArea]
  );
  const currentProblems = sortProblemsByDisplayOrder(participantProblems[currentDivision.division_id] ?? api.problems[currentDivision.division_id] ?? api.problems[currentDivision.code] ?? []);
  const currentProblem = currentProblems.find((item) => item.problem_id === problemId) ?? currentProblems[0];
  const operatorContestScoped = Boolean(activeGeneralOperator && isContestArea && page !== "participant-login");
  const activeStaffSession = generalOperatorStaffSession && (isOperatorPage(page) || page === "admin" || page === "admin-home" || page === "admin-contests" || page === "admin-judge" || operatorContestScoped) ? generalOperatorStaffSession : null;
  const hasParticipantAccess = Boolean(activeParticipant || activeGeneralParticipant);
  const hasContestSessionAccess = Boolean(activeParticipant || activeGeneralParticipant || activeGeneralOperator);
  const canViewProblems = canViewContestResource(selectedContest, hasContestSessionAccess, publicVisibility.problems);
  const canViewScoreboard = canViewContestResource(selectedContest, hasContestSessionAccess, publicVisibility.scoreboard);
  const canViewSubmissions = canViewContestResource(selectedContest, hasContestSessionAccess, publicVisibility.submissions);
  const problemAccessReason = problemVisibilityMessage(selectedContest, hasContestSessionAccess, publicVisibility.problems);
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
    if (activeGeneralOperator && page === "scoreboard" && api.divisions.length) {
      if (!api.divisions.some((division) => division.division_id === divisionId)) setDivisionId(api.divisions[0].division_id);
      return;
    }
    if (activeGeneralOperator && isContestArea) {
      return;
    }
    if (!api.divisions.length) return;
    const preferred = api.divisions[0];
    if (!api.divisions.some((division) => division.division_id === divisionId)) setDivisionId(preferred.division_id);
  }, [activeParticipant, activeGeneralParticipant, activeGeneralOperator, api.divisions, divisionId, isContestArea]);

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
    if (!route.contestId || !canViewProblems || !["problemset", "problem", "contest", "submissions"].includes(page)) return;
    let cancelled = false;
    async function loadContestProblems() {
      try {
        if (activeGeneralOperator && generalOperatorStaffSession) {
          const data = sortProblemsByDisplayOrder(await apiRequest<Problem[]>(`/operator/contests/${selectedContest.contest_id}/problems`, generalOperatorStaffSession.accessToken));
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
        const data = sortProblemsByDisplayOrder(await apiRequest<Problem[]>(path, token));
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
    generalOperatorStaffSession?.accessToken
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
          const latestSession = loadStoredGeneralSession();
          setGeneralSession(mapGeneralSession(data, latestSession ?? session));
          setGeneralSessionMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiClientError && error.status === 401) {
            setGeneralSession(null);
            setParticipant(null);
            setParticipantProblems({});
            setGeneralSessionMessage("");
          } else {
            setGeneralSessionMessage(formatApiError(error, "로그인 세션 확인에 실패했습니다. 기존 세션은 유지합니다"));
          }
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
          const latestParticipant = loadStoredParticipantSession();
          setParticipant({
            ...session,
            accessToken: latestParticipant?.contestId === session.contestId ? latestParticipant.accessToken : session.accessToken,
            team: data.team,
            member: data.member,
            division: data.division
          });
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiClientError && error.status === 401) {
            setParticipant(null);
            setParticipantProblems({});
          } else {
            setGeneralSessionMessage(formatApiError(error, "참가 세션 확인에 실패했습니다. 기존 세션은 유지합니다"));
          }
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
            contest={selectedContest}
            division={currentDivision}
            problems={currentProblems}
            locked={Boolean(activeParticipant || activeGeneralParticipant)}
            hiddenReason={currentProblems.length ? undefined : participantProblemEmptyMessage(selectedContest, hasContestSessionAccess, publicVisibility.problems)}
            setDivisionId={setDivisionId}
            operatorView={Boolean(activeGeneralOperator)}
            navigate={navigate}
            openProblem={(id) => {
              setProblemId(id);
              navigate("problem", { contestId: selectedContest.contest_id, problemId: id });
            }}
          />
        ) : (
          <AccessGate contest={selectedContest} resource="문제집" navigate={navigate} reason={problemAccessReason} />
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
            staffSession={activeGeneralOperator ? generalOperatorStaffSession : null}
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
      {page === "submissions" && (canViewSubmissions ? (
        <SubmissionsPage
          api={api}
          contest={selectedContest}
          participant={activeParticipant}
          division={currentDivision}
          problems={currentProblems}
          setDivisionId={setDivisionId}
          staffSession={activeGeneralOperator ? generalOperatorStaffSession : null}
          navigate={navigate}
          openProblem={(id) => {
            setProblemId(id);
            navigate("problem", { contestId: selectedContest.contest_id, problemId: id });
          }}
        />
      ) : <AccessGate contest={selectedContest} resource="제출 현황" navigate={navigate} />)}
      {page === "scoreboard" && (canViewScoreboard ? <ScoreboardPage api={api} contest={selectedContest} participant={activeParticipant} division={currentDivision} locked={Boolean(activeParticipant || activeGeneralParticipant)} staffSession={activeGeneralOperator ? generalOperatorStaffSession : null} setDivisionId={setDivisionId} navigate={navigate} /> : <AccessGate contest={selectedContest} resource="스코어보드" navigate={navigate} />)}
      {page === "board" && <BoardPage api={api} contest={selectedContest} participant={activeParticipant} staffSession={activeGeneralOperator ? generalOperatorStaffSession : null} navigate={navigate} />}
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
