import React, { useEffect, useMemo, useRef, useState } from "react";
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

function ContestTabs({
  active,
  contest,
  navigate
}: {
  active: "contest" | "problemset" | "submissions" | "scoreboard" | "board";
  contest: Contest;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const tabs: { page: Page; active: typeof active; label: string }[] = [
    { page: "contest", active: "contest", label: "개요" },
    { page: "problemset", active: "problemset", label: "문제집" },
    { page: "submissions", active: "submissions", label: "채점현황" },
    { page: "scoreboard", active: "scoreboard", label: "스코어보드" },
    { page: "board", active: "board", label: "게시판" }
  ];
  return (
    <nav className="figmaContestTabs" aria-label="대회 화면">
      {tabs.map((tab) => (
        <button
          key={tab.page}
          className={active === tab.active ? "active" : ""}
          onClick={() => navigate(tab.page, { contestId: contest.contest_id })}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

function FigmaPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="figmaPageHeader">
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function OverviewMetricCard({ icon, value, detail }: { icon: React.ReactNode; value: string; detail: string }) {
  return (
    <article className="figmaOverviewCard">
      <span className="figmaOverviewIcon">{icon}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function problemResultLabel(status?: Problem["solve_status"]) {
  if (status === "accepted") return "성공";
  if (status === "wrong") return "실패";
  return "미해결";
}

function problemResultClass(status?: Problem["solve_status"]) {
  if (status === "accepted") return "success";
  if (status === "wrong") return "danger";
  return "neutral";
}

export function StaffAccessGate({
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

export function StaffContestGate({ navigate }: { navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void }) {
  return (
    <section className="accessGate panel">
      <Lock size={34} />
      <h1>운영할 대회를 먼저 선택하세요</h1>
      <p>운영자 화면은 공개 대회 목록과 분리되어 있습니다. 로그인한 계정에 배정된 대회 목록에서 이동해야 합니다.</p>
      <button onClick={() => navigate("operator")}><CalendarDays size={16} /> 운영 권한 대회 보기</button>
    </section>
  );
}

export function ContestPage({
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
  const schedulePending = isScheduleTbd(contest);
  const remaining = contestRemainingLabel(contest);
  return (
    <section className="pageGrid figmaContestPage figmaOverviewPage">
      <FigmaPageHeader title={contest.title} description={contest.organization_name || contest.overview || divisionName} />
      <ContestTabs active="contest" contest={contest} navigate={navigate} />
      <section className="figmaOverviewCards" aria-label="대회 개요">
        <OverviewMetricCard icon={<Users size={42} />} value={memberName} detail={memberEmail} />
        <OverviewMetricCard icon={<Trophy size={42} />} value={teamName} detail={divisionName} />
        <OverviewMetricCard icon={<Timer size={42} />} value={remaining} detail={schedulePending ? "일정 미정" : `freeze ${formatContestMoment(contest.freeze_at)}`} />
      </section>
    </section>
  );
}

export function AccessGate({ contest, resource, navigate, reason }: { contest: Contest; resource: string; navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void; reason?: string }) {
  const ended = isContestEnded(contest);
  return (
    <section className="pageGrid">
      <section className="accessGate panel">
        <Lock size={34} />
        <span className="eyebrow">restricted</span>
        <h1>{resource} 접근 제한</h1>
        <p>{reason ?? `비로그인 상태에서는 대회 전과 대회 중에 ${resource}을 볼 수 없습니다.${ended ? " 대회 종료 후에도 운영자가 공개 설정을 켠 항목만 공개됩니다." : " 참가팀 로그인 후 본인 참가 유형 기준으로만 접근할 수 있습니다."}`}</p>
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

export function ProblemSetPage({
  api,
  contest,
  division,
  problems,
  locked,
  hiddenReason,
  setDivisionId,
  openProblem,
  navigate,
  operatorView = false
}: {
  api: ApiState;
  contest: Contest;
  division: Division;
  problems: Problem[];
  locked: boolean;
  hiddenReason?: string;
  setDivisionId: (id: string) => void;
  openProblem: (id: string) => void;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
  operatorView?: boolean;
}) {
  const pageSize = 12;
  const [pageIndex, setPageIndex] = useState(() => readPageQuery(1));
  useEffect(() => {
    setPageIndex(1);
  }, [division.division_id, problems.length]);
  const totalPages = Math.max(1, Math.ceil(problems.length / pageSize));
  const safePage = Math.min(pageIndex, totalPages);
  const orderedProblems = sortProblemsByDisplayOrder(problems);
  const pageItems = orderedProblems.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <section className="pageGrid figmaContestPage">
      <FigmaPageHeader title="문제집" description="문제별 제한, 제출 여부, 최근 결과를 빠르게 확인합니다." />
      <ContestTabs active="problemset" contest={contest} navigate={navigate} />
      {!locked && api.divisions.length > 1 && (
        <Segmented options={api.divisions} value={division.division_id} onChange={setDivisionId} />
      )}
      <section className="figmaTablePanel figmaProblemsetPanel problemList">
        {!problems.length && (
          <section className="panel emptyState">
            <PanelTitle icon={<BookOpen />} title={hiddenReason ? "문제집 비공개" : "등록된 문제가 없습니다"} />
            <p>{hiddenReason ?? "이 참가 유형에는 아직 문제가 등록되지 않았습니다."}</p>
            {hiddenReason && <p className="panelNote">대회 시간: {contestRemainingLabel(contest)}</p>}
          </section>
        )}
        {problems.length > 0 && (
          <DataTable
            columns={["문제 번호", "제목", "정보", "제한 시간", "제한 메모리", "배점"]}
            rows={pageItems.map((problem) => [
              problem.problem_code,
              <button className="textButton tableLink" onClick={() => openProblem(problem.problem_id)}>{problem.title}</button>,
              operatorView ? (
                <ProblemSolveBadge status={problem.solve_status} problem={problem} />
              ) : (
                <span className={`figmaResultPill ${problemResultClass(problem.solve_status)}`}>{problemResultLabel(problem.solve_status)}</span>
              ),
              `${problem.time_limit_ms / 1000}초`,
              `${problem.memory_limit_mb} MB`,
              `${problem.max_score ?? 100}점`
            ])}
          />
        )}
        {problems.length > 0 && (
          <SimplePagination page={safePage} totalPages={totalPages} onChange={setPageIndex} />
        )}
      </section>
    </section>
  );
}

export function CodeEditor({
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

export function ProblemPage({
  api,
  contest,
  participant,
  generalParticipant,
  generalSession,
  problem,
  problems,
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
  staffSession?: StaffSession | null;
  openProblem: (id: string) => void;
  openSubmissions: () => void;
}) {
  const now = useClockTick();
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState("cpp17");
  const [workspaceMode, setWorkspaceMode] = useState<"split" | "statement" | "submit">("split");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [assets, setAssets] = useState<ProblemAsset[]>([]);
  const [packageStatus, setPackageStatus] = useState<ProblemPackageStatus | null>(null);
  const [fallbackParticipant, setFallbackParticipant] = useState<ParticipantSession | null>(null);
  const activeProblem = problem ?? null;
  const activeProblemId = activeProblem?.problem_id ?? "";
  const activeParticipant = participant ?? fallbackParticipant;
  const operatorContest = Boolean(generalSession?.operatorContests.some((entry) => entry.contest.contest_id === contest.contest_id));
  const document = parseProblemDocument(activeProblem?.statement ?? "");
  const contestStarted = new Date(contest.start_at).getTime() <= now;
  const contestEnded = !isScheduleTbd(contest) && (contest.status === "ended" || contest.status === "archived" || new Date(contest.end_at).getTime() <= now);
  const contestRunning = contest.status === "running" && contestStarted && !contestEnded;
  const submitBusy = submitState === "submitting";
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
          ? `현재 대회 상태는 ${contestStatusLabel(contest.status)}입니다.`
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
  async function submitCode() {
    if (!canSubmit) {
      setSubmitState("error");
      setSubmitMessage(submitDisabledReason || "현재 제출할 수 없습니다.");
      return;
    }
    if (!activeParticipant) return;
    setSubmitState("submitting");
    setSubmitMessage("");
    try {
      await apiRequest<Submission>(
        `/contests/${contest.contest_id}/problems/${activeProblemId}/submissions`,
        activeParticipant.accessToken,
        {
          method: "POST",
          body: JSON.stringify({ language, source_code: source })
        }
      );
      setSubmitState("done");
      openSubmissions();
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
            <span className="problemNavLabel">{item.problem_code}. {item.title}</span>
            <ProblemSolveBadge status={item.solve_status} problem={staffSession ? item : undefined} />
          </button>
        ))}
      </aside>
      <article className="statementPanel">
        <h1>{activeProblem.problem_code}. {activeProblem.title}</h1>
        <div className="limitBar">
          <span>시간 {activeProblem.time_limit_ms / 1000}s</span>
          <span>메모리 {activeProblem.memory_limit_mb}MB</span>
          <span>점수 {activeProblem.max_score ?? 100}</span>
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
        <button onClick={submitCode} disabled={!canSubmit}>
          {submitBusy ? "제출 중" : "제출하기"}
        </button>
        {submitMessage && submitState === "error" && <p className={`submitMessage ${submitState}`}>{submitMessage}</p>}
      </aside>
      )}
    </section>
  );
}

export function SubmissionsPage({
  api,
  contest,
  participant,
  division,
  problems,
  setDivisionId,
  staffSession,
  openProblem,
  navigate
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  division: Division;
  problems: Problem[];
  setDivisionId: (id: string) => void;
  staffSession?: StaffSession | null;
  openProblem: (id: string) => void;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  useClockTick();
  const [items, setItems] = useState<Submission[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [selectedSubmissionDetail, setSelectedSubmissionDetail] = useState<Submission | null>(null);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [sourceSubmissionId, setSourceSubmissionId] = useState("");
  const [sourceSubmissionDetail, setSourceSubmissionDetail] = useState<Submission | null>(null);
  const [pageIndex, setPageIndex] = useState(() => readPageQuery(1));
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const problemMap = useMemo(
    () => new Map(
      sortProblemsByDisplayOrder([
        ...problems,
        ...(api.problems[division.division_id] ?? []),
        ...(api.problems[division.code] ?? []),
        ...Object.values(api.problems).flat()
      ]).map((problem) => [problem.problem_id, problem])
    ),
    [api.problems, division, problems]
  );
  const filteredItems = useMemo(
    () => (staffSession && division.division_id ? items.filter((item) => !item.division_id || item.division_id === division.division_id) : items),
    [items, staffSession, division.division_id]
  );
  const pendingSubmissionIds = useMemo(
    () => filteredItems.filter((item) => isSubmissionPending(item.status)).map((item) => item.submission_id),
    [filteredItems]
  );
  const pendingSubmissionKey = pendingSubmissionIds.join(",");

  useEffect(() => {
    let cancelled = false;
    async function loadSubmissions(page: number = pageIndex) {
      const cursor = String(Math.max(0, page - 1) * pageSize);
      if (!participant) {
        if (!staffSession) {
          setItems([]);
          setStatus("idle");
          setMessage("참가팀 로그인 후 자기 팀 제출만 표시됩니다.");
          setTotalCount(0);
          return;
        }
        setStatus("loading");
        setMessage("제출 목록을 불러오는 중입니다.");
        try {
          const pageData = await apiPageRequest<Submission[]>(
            `/operator/contests/${contest.contest_id}/submissions?limit=${pageSize}&cursor=${encodeURIComponent(cursor)}&include_source=false`,
            staffSession.accessToken
          );
          if (!cancelled) {
            setItems(pageData.data);
            setTotalCount(Math.max(0, Number(pageData.page.total_count ?? 0)));
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
        const pageData = await apiPageRequest<Submission[]>(
          `/contests/${contest.contest_id}/submissions?limit=${pageSize}&cursor=${encodeURIComponent(cursor)}`,
          participant.accessToken
        );
        if (!cancelled) {
          setItems(pageData.data);
          setTotalCount(Math.max(0, Number(pageData.page.total_count ?? 0)));
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
    loadSubmissions(pageIndex);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadSubmissions(pageIndex);
    }, participant ? 2000 : 5000);
    const onFocus = () => loadSubmissions(pageIndex);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [api.submissions, contest.contest_id, participant, staffSession?.accessToken, pageIndex]);

  useEffect(() => {
    const token = staffSession?.accessToken ?? participant?.accessToken;
    if (!token) return;
    const pendingIds = pendingSubmissionIds;
    if (!pendingIds.length) return;
    let cancelled = false;
    async function waitPending(submissionId: string) {
      try {
        const path = staffSession
          ? `/operator/contests/${contest.contest_id}/submissions/${submissionId}/status:wait?wait_seconds=2&poll_interval_seconds=0.1`
          : `/contests/${contest.contest_id}/submissions/${submissionId}/status:wait?wait_seconds=2&poll_interval_seconds=0.1`;
        const updated = await apiRequest<Submission>(
          path,
          token
        );
        if (cancelled) return;
        setItems((current) => current.map((item) => (item.submission_id === updated.submission_id ? { ...item, ...updated, source_code: item.source_code } : item)));
        if (selectedSubmissionDetail?.submission_id === updated.submission_id) {
          setSelectedSubmissionDetail((current) => (current ? { ...current, ...updated, source_code: current.source_code } : current));
        }
      } catch {
        // The slower full-list refresh will recover transient status polling errors.
      }
    }
    pendingIds.forEach((submissionId) => void waitPending(submissionId));
    return () => {
      cancelled = true;
    };
  }, [contest.contest_id, participant?.accessToken, pendingSubmissionKey, selectedSubmissionDetail?.submission_id, staffSession?.accessToken]);

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

  useEffect(() => {
    let cancelled = false;
    async function loadSubmissionDetail() {
      if (!staffSession || !submissionModalOpen || !selectedSubmissionId) {
        setSelectedSubmissionDetail(null);
        return;
      }
      try {
        const detail = await apiRequest<Submission>(
          `/operator/contests/${contest.contest_id}/submissions/${selectedSubmissionId}`,
          staffSession.accessToken
        );
        if (!cancelled) setSelectedSubmissionDetail(detail);
      } catch (error) {
        if (!cancelled) {
          setSelectedSubmissionDetail(null);
          setMessage(formatApiError(error, "제출 상세를 불러오지 못했습니다"));
        }
      }
    }
    loadSubmissionDetail();
    return () => {
      cancelled = true;
    };
  }, [contest.contest_id, selectedSubmissionId, staffSession?.accessToken, submissionModalOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadSourceSubmission() {
      if (!sourceModalOpen || !sourceSubmissionId) {
        setSourceSubmissionDetail(null);
        return;
      }
      try {
        const detail = staffSession
          ? await apiRequest<Submission>(
              `/operator/contests/${contest.contest_id}/submissions/${sourceSubmissionId}`,
              staffSession.accessToken
            )
          : participant
            ? await apiRequest<Submission>(
                `/contests/${contest.contest_id}/submissions/${sourceSubmissionId}`,
                participant.accessToken
              )
            : null;
        if (!cancelled) setSourceSubmissionDetail(detail);
      } catch (error) {
        if (!cancelled) {
          setSourceSubmissionDetail(null);
          setMessage(formatApiError(error, "제출 코드를 불러오지 못했습니다"));
        }
      }
    }
    loadSourceSubmission();
    return () => {
      cancelled = true;
    };
  }, [contest.contest_id, participant?.accessToken, sourceModalOpen, sourceSubmissionId, staffSession?.accessToken]);

  useEffect(() => {
    const path = window.location.pathname;
    if (!path.includes("/submissions") && !path.includes("/submission")) return;
    const query = new URLSearchParams(window.location.search);
    query.set("page", String(Math.max(1, pageIndex)));
    const nextUrl = `${path}?${query.toString()}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [pageIndex]);

  const solvedCount = filteredItems.filter((item) => item.status === "accepted").length;
  const judgingCount = filteredItems.filter((item) => ["waiting", "preparing", "judging"].includes(item.status)).length;
  const selectedSubmission = selectedSubmissionDetail ?? filteredItems.find((item) => item.submission_id === selectedSubmissionId) ?? filteredItems[0] ?? null;
  const sourceSubmission = sourceSubmissionDetail ?? filteredItems.find((item) => item.submission_id === sourceSubmissionId) ?? null;
  const safePage = Math.max(1, pageIndex);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const pagedItems = filteredItems;
  const sourceLengthLabel = (item: Submission) => {
    const length = item.source_code_length ?? (item.source_code ? new Blob([item.source_code]).size : null);
    return typeof length === "number" ? `${length.toLocaleString()} B` : "-";
  };
  const runtimeLabel = (item: Submission) => typeof item.runtime_ms === "number" ? `${item.runtime_ms} ms` : "-";
  const memoryLabel = (item: Submission) => typeof item.memory_kb === "number" ? `${item.memory_kb.toLocaleString()} KB` : "-";
  const openSubmissionSource = (submissionId: string) => {
    setSourceSubmissionId(submissionId);
    setSourceSubmissionDetail(null);
    setSourceModalOpen(true);
  };
  const problemLabel = (problem?: Problem, fallbackId?: string) => problem ? `${problem.problem_code}. ${problem.title}` : fallbackId?.slice(0, 8) ?? "-";

  return (
    <section className="pageGrid figmaContestPage">
      <FigmaPageHeader title="채점현황" description="대회 중에는 로그인한 참가팀의 제출만 확인합니다." />
      <ContestTabs active="submissions" contest={contest} navigate={navigate} />
      {staffSession && api.divisions.length > 1 && (
        <Segmented options={api.divisions} value={division.division_id} onChange={setDivisionId} allLabel="전체" />
      )}
      {message && <p className={`submitMessage ${status === "error" ? "error" : status === "ready" ? "done" : ""}`}>{message}</p>}
      <section className="figmaTablePanel figmaSubmissionsPanel">
        <DataTable
          columns={["제출번호", "이름", "문제", "결과", "메모리", "시간", "언어", "코드 길이", "제출한 시간"]}
          rows={pagedItems.map((item) => {
            const problem = problemMap.get(item.problem_id);
            const languageCell = (
              <button className="textButton tableLink" onClick={() => openSubmissionSource(item.submission_id)}>
                {item.language} / 수정
              </button>
            );
            return [
              item.submission_id.slice(0, 8),
              item.member_name ?? item.team_name ?? item.participant_team_id?.slice(0, 8) ?? "-",
              <button className="textButton tableLink" onClick={() => openProblem(item.problem_id)}>
                {problem?.problem_code ?? problemLabel(problem, item.problem_id)}
              </button>,
              <span className={`figmaJudgeResult ${submissionStatusTone(item.status)}`}>{submissionStatusLabel(item.status)}</span>,
              memoryLabel(item),
              runtimeLabel(item),
              languageCell,
              sourceLengthLabel(item),
              <time title={formatDate(item.submitted_at)}>{formatRelativeTime(item.submitted_at)}</time>
            ];
          })}
        />
        {filteredItems.length > 0 && <SimplePagination page={safePage} totalPages={totalPages} onChange={setPageIndex} />}
        {sourceModalOpen && sourceSubmission && (
          <div className="modalOverlay" onClick={() => setSourceModalOpen(false)}>
            <aside className="panel submissionInspector modalPanel" onClick={(event) => event.stopPropagation()}>
              <div className="panelTitleRow">
                <PanelTitle icon={<Code2 />} title="제출 코드" />
                <div className="tableActions">
                  <button
                    className="secondary"
                    onClick={() => navigator.clipboard.writeText(sourceSubmission.source_code ?? "")}
                    disabled={!sourceSubmission.source_code}
                  >
                    <Clipboard size={14} /> 복사
                  </button>
                  <button className="secondary" onClick={() => setSourceModalOpen(false)}>닫기</button>
                </div>
              </div>
              <section className="previewMetaGrid">
                <div className="previewMetaItem"><span>문제</span><strong>{problemLabel(problemMap.get(sourceSubmission.problem_id), sourceSubmission.problem_id)}</strong></div>
                <div className="previewMetaItem"><span>언어</span><strong>{sourceSubmission.language}</strong></div>
                <div className="previewMetaItem"><span>제출 시각</span><strong>{formatDate(sourceSubmission.submitted_at)}</strong></div>
                <div className="previewMetaItem"><span>결과</span><strong>{submissionStatusLabel(sourceSubmission.status)}</strong></div>
              </section>
              <pre className="sourcePreview">{sourceSubmission.source_code || "제출 코드를 불러오는 중입니다."}</pre>
            </aside>
          </div>
        )}
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
              <div><dt>코드 길이</dt><dd>{sourceLengthLabel(selectedSubmission)}</dd></div>
              <div><dt>시간</dt><dd>{runtimeLabel(selectedSubmission)}</dd></div>
              <div><dt>메모리</dt><dd>{memoryLabel(selectedSubmission)}</dd></div>
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

export function ScoreboardPage({
  api,
  contest,
  participant,
  division,
  locked,
  staffSession,
  setDivisionId,
  navigate
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  division: Division;
  locked: boolean;
  staffSession?: StaffSession | null;
  setDivisionId: (id: string) => void;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
  const [liveRows, setLiveRows] = useState<ScoreboardRow[]>([]);
  const [frozen, setFrozen] = useState(false);
  const [message, setMessage] = useState("");
  const [operatorDivisions, setOperatorDivisions] = useState<Division[]>([]);
  const [penaltyRow, setPenaltyRow] = useState<ScoreboardRow | null>(null);
  const canSelectDivision = Boolean(staffSession) || !locked;
  const divisionOptions = api.divisions.length ? api.divisions : operatorDivisions;
  const effectiveDivision = division.division_id ? division : divisionOptions[0] ?? division;
  const fallbackRowsForDivision = api.scoreboard.filter((row) => !row.division || row.division === effectiveDivision.name);
  const rows = liveRows.length ? liveRows : fallbackRowsForDivision;
  const problemCodes = Array.from(new Set(rows.flatMap((row) => row.problem_scores.map((score) => score.problem_code)))).sort();
  const freezeWarning = freezeAnnouncement(contest);
  const endWarning = contestEndAnnouncement(contest);
  const scoreboardDescription = !canSelectDivision
    ? `로그인한 팀의 ${effectiveDivision.name} 참가 유형 순위만 표시합니다.`
    : effectiveDivision.division_id
    ? `${effectiveDivision.name} 유형 기준 순위입니다.`
    : "등록된 참가 유형이 없어 전체 스코어보드를 표시합니다.";
  const remaining = contestRemainingLabel(contest);
  const penaltyBreakdown = penaltyRow?.problem_scores
    .filter((score) => score.solved && typeof score.penalty === "number")
    .map((score) => {
      const wrongPenalty = score.wrong_attempts * 20;
      return {
        ...score,
        wrongPenalty,
        solvedMinute: Math.max(0, Number(score.penalty) - wrongPenalty)
      };
    }) ?? [];

  useEffect(() => {
    let cancelled = false;
    async function loadOperatorDivisions() {
      if (!staffSession || api.divisions.length || operatorDivisions.length) return;
      try {
        const data = await apiRequest<OperatorDashboard>(`/operator/contests/${contest.contest_id}/dashboard`, staffSession.accessToken);
        if (cancelled) return;
        const sorted = [...data.divisions].sort((a, b) => a.name.localeCompare(b.name));
        setOperatorDivisions(sorted);
        if (!division.division_id && sorted[0]) setDivisionId(sorted[0].division_id);
      } catch {
        // Keep the scoreboard usable via the contest-level operator endpoint.
      }
    }
    loadOperatorDivisions();
    return () => {
      cancelled = true;
    };
  }, [api.divisions.length, contest.contest_id, division.division_id, operatorDivisions.length, setDivisionId, staffSession]);

  useEffect(() => {
    let cancelled = false;
    async function loadOnce(waitSeconds: number) {
      const path = staffSession
        ? effectiveDivision.division_id
          ? `/operator/contests/${contest.contest_id}/divisions/${effectiveDivision.division_id}/scoreboard/internal`
          : `/operator/contests/${contest.contest_id}/scoreboard/internal`
        : participant
        ? `/contests/${contest.contest_id}/scoreboard${waitSeconds ? ":wait" : ""}?wait_seconds=${waitSeconds}`
        : `/contests/${contest.contest_id}/divisions/${effectiveDivision.division_id}/scoreboard${waitSeconds ? ":wait" : ""}?wait_seconds=${waitSeconds}`;
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
        const timer = window.setInterval(() => loadOnce(0), 1000);
        while (!cancelled) await new Promise((resolve) => window.setTimeout(resolve, 1000));
        window.clearInterval(timer);
      }
    }
    loop();
    return () => {
      cancelled = true;
    };
  }, [contest.contest_id, effectiveDivision.division_id, participant?.accessToken, staffSession?.accessToken]);

  return (
    <section className="pageGrid figmaContestPage">
      <FigmaPageHeader title="스코어보드" description={scoreboardDescription} />
      <ContestTabs active="scoreboard" contest={contest} navigate={navigate} />
      {canSelectDivision && divisionOptions.length > 1 ? (
        <Segmented options={divisionOptions} value={effectiveDivision.division_id} onChange={setDivisionId} />
      ) : null}
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
      {message && <p className={`submitMessage ${message.includes("실패") ? "error" : "done"}`}>{message}</p>}
      <section className="figmaTablePanel figmaScoreboardPanel">
        <table className="scoreboardTable">
          <thead>
            <tr>
              <th>순위</th>
              <th>팀명</th>
              <th>해결</th>
              {problemCodes.map((code) => <th key={code}>{code}</th>)}
              <th>시도</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team_name}>
                <td>{row.rank}</td>
                <td><strong>{row.team_name}</strong></td>
                <td>{row.solved}개</td>
                {problemCodes.map((code) => {
                  const score = row.problem_scores.find((item) => item.problem_code === code);
                  return <td key={code}><ResultCell problemScore={score} /></td>;
                })}
                <td>
                  {staffSession ? (
                    <button className="textButton tableLink" onClick={() => setPenaltyRow(row)}>
                      {row.penalty ?? 0}min
                    </button>
                  ) : (
                    `${row.penalty ?? 0}min`
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staffSession && penaltyRow && (
          <div className="modalOverlay" onClick={() => setPenaltyRow(null)}>
            <aside className="panel submissionInspector modalPanel" onClick={(event) => event.stopPropagation()}>
              <div className="panelTitleRow">
                <PanelTitle icon={<Timer />} title="총시간 상세" />
                <button className="secondary" onClick={() => setPenaltyRow(null)}>닫기</button>
              </div>
              <section className="previewMetaGrid">
                <div className="previewMetaItem"><span>팀</span><strong>{penaltyRow.team_name}</strong></div>
                <div className="previewMetaItem"><span>해결</span><strong>{penaltyRow.solved}</strong></div>
                <div className="previewMetaItem"><span>총시간</span><strong>{penaltyRow.penalty ?? 0}</strong></div>
                <div className="previewMetaItem"><span>참가 유형</span><strong>{penaltyRow.division ?? effectiveDivision.name}</strong></div>
              </section>
              <DataTable
                columns={["문제", "맞힌 시간", "오답", "계산", "총시간"]}
                rows={penaltyBreakdown.map((score) => [
                  score.problem_code,
                  score.solved_at ? formatDate(score.solved_at) : `${score.solvedMinute}분`,
                  `${score.wrong_attempts}회`,
                  `${score.solvedMinute} + ${score.wrong_attempts} × 20`,
                  score.penalty ?? 0
                ])}
              />
              {!penaltyBreakdown.length && <p className="panelNote">해결한 문제가 없어 총시간 내역이 없습니다.</p>}
            </aside>
          </div>
        )}
      </section>
    </section>
  );
}

export function BoardPage({
  api,
  contest,
  participant,
  staffSession,
  navigate
}: {
  api: ApiState;
  contest: Contest;
  participant: ParticipantSession | null;
  staffSession?: StaffSession | null;
  navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void;
}) {
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
      setQuestions((current) => current.map((question) => question.contest_question_id === questionId ? { ...question, answers: [answer, ...question.answers] } : question));
      setAnswerDrafts((current) => ({ ...current, [questionId]: "" }));
      setAnswerVisibility((current) => ({ ...current, [questionId]: "public" }));
      setOpenAnswerComposer(null);
      setMessage("답변 등록 완료");
    } catch (error) {
      setMessage(formatApiError(error, "답변 등록 실패"));
    }
  }

  const selectedNotice = notices.find((notice) => notice.contest_notice_id === selectedNoticeId) ?? null;
  const selectedQuestion = questions.find((question) => question.contest_question_id === selectedQuestionId) ?? null;
  const selectedQuestionAnswers = selectedQuestion ? [...selectedQuestion.answers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];
  const noticeCount = notices.length;
  const questionCount = questions.length;

  return (
    <section className="pageGrid figmaContestPage figmaBoardPage">
      <FigmaPageHeader title="게시판" description="대회 공지와 질문을 확인하고 필요한 내용을 남깁니다." />
      <ContestTabs active="board" contest={contest} navigate={navigate} />
      {!!notices.length && (
        <section className="figmaNoticeSummary boardNoticeSummary">
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
      {message && <p className={`submitMessage ${message.includes("실패") || message.includes("못했습니다") ? "error" : "done"}`}>{message}</p>}
      {mode === "notices" ? (
        <section className="figmaBoardPanel boardListPanel">
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
                return (
                  <button
                    key={notice.contest_notice_id}
                    type="button"
                    className={notice.emergency ? "boardThreadCard emergency" : "boardThreadCard"}
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
        </section>
      ) : (
        <section className="figmaBoardPanel boardListPanel">
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
                return (
                  <button
                    key={question.contest_question_id}
                    type="button"
                    className="boardThreadCard"
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
        </section>
      )}
      {selectedNotice && (
        <div className="modalOverlay" onClick={() => setSelectedNoticeId("")}>
          <article className="panel boardArticleModal modalPanel" onClick={(event) => event.stopPropagation()}>
            <div className="boardFocusHeader">
              <div>
                <span className={selectedNotice.emergency ? "statusPill failed" : "statusPill active"}>{selectedNotice.emergency ? "긴급 공지" : "공지"}</span>
                <h2>{selectedNotice.title}</h2>
                <small>운영자 · {formatDate(selectedNotice.published_at)} · {selectedNotice.visibility === "participants" ? "참가자 공개" : "전체 공개"}</small>
              </div>
              <button className="secondary" onClick={() => setSelectedNoticeId("")}>닫기</button>
            </div>
            <MarkdownPreview statement={selectedNotice.body} assets={[]} />
          </article>
        </div>
      )}
      {selectedQuestion && (
        <div className="modalOverlay" onClick={() => setSelectedQuestionId("")}>
          <article className="panel boardArticleModal modalPanel" onClick={(event) => event.stopPropagation()}>
            <div className="boardFocusHeader">
                  <div>
                    <span className="statusPill scheduled">{selectedQuestion.visibility === "private" ? "비공개" : "공개"}</span>
                    <h2>{selectedQuestion.title}</h2>
                    <small>{selectedQuestion.author_name ?? selectedQuestion.team_name ?? "참가자"} · {selectedQuestion.team_name ?? "팀"} · {formatDate(selectedQuestion.created_at)}</small>
                  </div>
                  <div className="tableActions">
                    {staffSession && (
                    <button className="secondary" onClick={() => setOpenAnswerComposer(openAnswerComposer === selectedQuestion.contest_question_id ? null : selectedQuestion.contest_question_id)}>
                      답변
                    </button>
                    )}
                    <button className="secondary" onClick={() => setSelectedQuestionId("")}>닫기</button>
                  </div>
                </div>
                <MarkdownPreview statement={selectedQuestion.body} assets={[]} />
                <section className="boardReplyStream">
                  <div className="panelTitleRow">
                    <h3>댓글 {selectedQuestionAnswers.length}</h3>
                    <span className="panelNote">최근 댓글이 위에 표시됩니다. 대댓글은 지원하지 않습니다.</span>
                  </div>
                  {selectedQuestionAnswers.map((answer) => (
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
                  {!selectedQuestionAnswers.length && <div className="boardEmpty">아직 댓글이 없습니다.</div>}
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
          </article>
        </div>
      )}
    </section>
  );
}
