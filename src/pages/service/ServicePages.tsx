import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

export function HomePage({ api, navigate, generalSession }: { api: ApiState; navigate: (page: Page, options?: { contestId?: string; problemId?: string }) => void; generalSession: GeneralSession | null }) {
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

export function ServiceNoticePage({ api }: { api: ApiState }) {
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

export function ServiceRulesPage() {
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

export function ServiceHelpPage() {
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

export function ServiceContactPage() {
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

export function ContestListPage({
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

export function ContestCards({
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
                <span className={`statusPill ${contest.status}`}>{contestStatusLabel(contest.status)}</span>
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

export function GeneralLoginPage({
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

  function submitParticipantLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <LoginShell title="로그인" subtitle="이메일 인증번호 하나로 참가자, 운영자, 서비스 관리자 세션을 전환합니다." onSubmit={submitParticipantLogin}>
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
          setOtpRequested(false);
          setOtp("");
          setMessage("");
          setOtpExpiresAt(0);
        }}
      />
      <button type={otpRequested ? "button" : "submit"} onClick={otpRequested ? requestOtp : undefined} disabled={!email.trim() || cooldownSeconds > 0}>
        <Mail size={16} /> {cooldownSeconds > 0 ? `재전송 ${cooldownSeconds}초` : "인증번호 받기"}
      </button>
      {otpRequested && (
        <>
          <label>인증번호</label>
          <input ref={otpRef} value={otp} placeholder="인증번호" onChange={(event) => setOtp(event.target.value)} />
          <button type="submit" className="secondary" disabled={otpExpiresSeconds <= 0}><Lock size={16} /> 로그인</button>
          <p className="panelNote">인증번호 유효시간: {otpExpiresSeconds > 0 ? formatSeconds(otpExpiresSeconds) : "만료 (재전송 필요)"}</p>
          <button type="button" className="textButton" onClick={() => { setOtpRequested(false); setOtp(""); setOtpExpiresAt(0); setCooldownUntil(0); }}>이메일 다시 입력</button>
        </>
      )}
      {message && <p className="formMessage">{message}</p>}
      {sessionMessage && <p className="formMessage error">{sessionMessage}</p>}
    </LoginShell>
  );
}

