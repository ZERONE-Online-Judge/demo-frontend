import React from "react";
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
} from "../../shared";

export function TopBar({
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

export function ServiceTopBar({ page, navigate, generalSession, onGeneralLogout }: { page: Page; navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void; generalSession: GeneralSession | null; onGeneralLogout: () => void }) {
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

export function ContestTopBar({
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
            <strong className="zojWordmark">Zerone Online Judge</strong>
            <small>{contest.title} · {division.name}</small>
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

export function StaffTopBar({
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

export function ApiBanner({ api }: { api: ApiState }) {
  if (api.status === "live") return null;
  return (
    <div className={`apiBanner ${api.status}`}>
      <span className="dot" />
      {api.status === "loading" && "API 연결 확인 중"}
      {api.status === "offline" && `일부 데이터를 불러오지 못했습니다${api.error ? ` - ${api.error}` : ""}`}
    </div>
  );
}
