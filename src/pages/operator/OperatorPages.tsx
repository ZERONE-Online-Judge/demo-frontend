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
import { CodeEditor, StaffContestGate } from "../contest/ContestPages";

export function JudgeStatusPage({ api }: { api: ApiState }) {
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

export function OperatorPage({
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
        <PageNotice message={message} />
        <section className="contestCards operatorContestDeck">
          {contests.map((contest) => (
            <article className="contestCard" key={contest.contest_id}>
              <div>
                <span className={`statusPill ${contest.status}`}>{contestStatusLabel(contest.status)}</span>
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
        <PageNotice message={message} />
      </section>
    );
  }

  const contest = dashboard.contest;
  const divisions = dashboard.divisions;
  const now = Date.now();
  const schedulePending = isScheduleTbd(contest);
  const startAtMs = new Date(contest.start_at).getTime();
  const freezeAtMs = new Date(contest.freeze_at).getTime();
  const endAtMs = new Date(contest.end_at).getTime();
  const openRemaining = schedulePending ? "일정 미정" : startAtMs > now ? `${timeLeft(contest.start_at)} 남음` : "오픈됨";
  const freezeRemaining = schedulePending ? "일정 미정" : freezeAtMs > now ? `${timeLeft(contest.freeze_at)} 남음` : now < endAtMs ? "프리즈 진행 중" : "종료됨";
  const endRemaining = schedulePending ? "일정 미정" : endAtMs > now ? `${timeLeft(contest.end_at)} 남음` : "종료됨";
  const contestRemaining = schedulePending
    ? "일정 미정"
    : startAtMs > now
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
            <span>{contestStatusLabel(contest.status)}</span>
            <span>오픈 {schedulePending ? "미정" : formatDate(contest.start_at)}</span>
            <span>프리즈 {schedulePending ? "미정" : formatDate(contest.freeze_at)}</span>
            <span>마감 {schedulePending ? "미정" : formatDate(contest.end_at)}</span>
            <span>{contestRemaining}</span>
            <span>{divisions.length} divisions</span>
          </div>
        </div>
        <div className="operatorHeroMeta">
          <InfoCard icon={<Clock3 />} title="오픈 시간" value={schedulePending ? "미정" : formatDate(contest.start_at)} detail={openRemaining} />
          <InfoCard icon={<Timer />} title="프리즈 시간" value={schedulePending ? "미정" : formatDate(contest.freeze_at)} detail={freezeRemaining} />
          <InfoCard icon={<CalendarDays />} title="마감 시간" value={schedulePending ? "미정" : formatDate(contest.end_at)} detail={endRemaining} />
          <InfoCard icon={<Gauge />} title="남은 시간" value={contestRemaining} detail={contestStatusLabel(contest.status)} />
          <InfoCard icon={<Users />} title="참가팀" value={String(dashboard.participant_count)} detail="division separated" />
          <InfoCard icon={<FileCode2 />} title="제출" value={String(dashboard.submission_count)} detail="all teams" />
          <InfoCard icon={<Activity />} title="대기열" value={String(dashboard.pending_jobs)} detail="pending" />
          <InfoCard icon={<Lock />} title="재채점" value="불가" detail="all controls off" />
        </div>
      </section>
      <PageNotice message={message} />
    </section>
  );
}

export function OperatorSettingsPage({
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
  const [contestStatus, setContestStatus] = useState("schedule_tbd");
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
        <PageNotice message={message} />
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="settings" title="대회 설정" description="대회 설정을 불러오는 중입니다." />
        <PageNotice message={message} />
      </section>
    );
  }

  const contest = dashboard.contest;
  const operationLocked = isContestOperationLocked(contest);
  const schedulePending = isScheduleTbd(contestStatus);

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
      const timeChanged = !schedulePending && (
        dateTimeLocalToIso(startAt) !== contest.start_at ||
        dateTimeLocalToIso(endAt) !== contest.end_at ||
        dateTimeLocalToIso(freezeAt) !== contest.freeze_at
      );
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
            ...(schedulePending
              ? {}
              : {
                  start_at: dateTimeLocalToIso(startAt),
                  end_at: dateTimeLocalToIso(endAt),
                  freeze_at: dateTimeLocalToIso(freezeAt)
                }),
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
      <PageNotice message={message} />
      <section className="summaryGrid">
        <InfoCard icon={<CalendarDays />} title="상태" value={contestStatusLabel(contest.status)} detail="schedule_tbd/scheduled/running/ended" />
        <InfoCard icon={<Timer />} title="대회 시간" value={contestRemainingLabel(contest)} detail={isScheduleTbd(contest) ? "일정 미정" : `freeze ${formatContestMoment(contest.freeze_at)}`} />
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
            <label><span>대회 상태</span><select value={contestStatus} disabled={operationLocked} onChange={(event) => setContestStatus(event.target.value)}>{CONTEST_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{contestStatusLabel(status)}</option>)}</select></label>
            <label><span>시작 시각</span><input type="datetime-local" value={startAt} disabled={schedulePending} onChange={(event) => setStartAt(event.target.value)} /></label>
            <label><span>종료 시각</span><input type="datetime-local" value={endAt} disabled={schedulePending} onChange={(event) => setEndAt(event.target.value)} /></label>
            <label><span>프리즈 시작</span><input type="datetime-local" value={freezeAt} disabled={schedulePending} onChange={(event) => setFreezeAt(event.target.value)} /></label>
          </div>
          <div className="timeQuickGrid">
            <button className="secondary" disabled={operationLocked || schedulePending} onClick={startContestNow}>지금 시작</button>
            <button className="secondary" disabled={schedulePending} onClick={() => moveContestEnd(10)}>종료 +10분</button>
            <button className="secondary" disabled={schedulePending} onClick={() => moveContestEnd(30)}>종료 +30분</button>
            <button className="secondary" disabled={schedulePending} onClick={() => setFreezeBeforeEnd(60)}>프리즈 종료 1시간 전</button>
            <button className="secondary" disabled={schedulePending} onClick={() => setFreezeBeforeEnd(30)}>프리즈 종료 30분 전</button>
            <button className="secondary" disabled={schedulePending} onClick={freezeNow}>지금 프리즈</button>
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
        <div className="policyStrip">
          <span>현재 상태: {contestStatus}</span>
          <span>{isContestEnded(contest) ? "종료 후 공개 정책 적용 가능" : "비로그인 공개 차단 중"}</span>
        </div>
      </section>
    </section>
  );
}

export function OperatorNoticesPage({
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
        <PageNotice message={message} />
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="notices" title="공지" description="공지 정보를 불러오는 중입니다." />
        <PageNotice message={message} />
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
      <PageNotice message={message} />
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

export function OperatorStaffPage({
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
        <PageNotice message={message} />
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
      <PageNotice message={message} />
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

export function OperatorParticipantsPage({
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
        <PageNotice message={message} />
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="participants" title="참가팀 관리" description="참가팀 목록을 불러오는 중입니다." />
        <PageNotice message={message} status={status} />
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
      <PageNotice message={message} status={status} />
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

export function OperatorProblemsPage({
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
  const sortProblems = sortProblemsByDisplayOrder;

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
      setProblems(sortProblems(data));
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
        <PageNotice message={message} />
      </section>
    );
  }
  if (!dashboard) {
    return (
      <section className="pageGrid">
        <PageHeader badge="problems" title="문제 관리" description="문제 목록을 불러오는 중입니다." />
        <PageNotice message={message} status={status} />
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
          display_order: displayOrder
        })
      });
      setProblems((current) => sortProblems([...current, created]));
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
          problem_code: problemCode,
          title,
          statement: serializeProblemDocument({ statement, inputDescription, outputDescription, note, examples }),
          time_limit_ms: timeLimitMs,
          memory_limit_mb: memoryLimitMb,
          display_order: displayOrder
        })
      });
      setProblems((current) => sortProblems(current.map((problem) => (problem.problem_id === updated.problem_id ? { ...problem, ...updated } : problem))));
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
      setMessage(formatApiError(error, "패키지 파일 업로드 실패"));
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
      setMessage(`검증 완료: 이번 업로드 ${cases.length}개, 활성 세트 v${result.testcase_set.version} 전체 ${result.verified_count}개입니다.`);
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
      setMessage(`zip 검증 완료: 이번 업로드 ${result.imported_archive?.case_count ?? result.verified_count}개, 활성 세트 v${result.testcase_set.version} 전체 ${result.verified_count}개입니다.`);
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
      setMessage(`자동 매칭 완료: 이번 업로드 ${cases.length}개, 활성 세트 전체 ${result.verified_count}개입니다.${warnings.length ? ` (누락 ${warnings.length}건)` : ""}`);
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
          `/operator/contests/${contestId}/test-submissions/${created.submission_id}/status:wait?wait_seconds=1&poll_interval_seconds=0.1`,
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
  const filtered = sortProblems(problems.filter((problem) => problem.division_id === selectedDivision.division_id));
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
    { value: "settings", label: "기본 정보", detail: "유형, 코드, 제한" },
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
      <PageNotice message={message} status={status} />
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
                  <small>{problem.time_limit_ms / 1000}s · {problem.memory_limit_mb}MB</small>
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
              <p className="panelNote">문제 코드는 같은 참가 유형 안에서 중복될 수 없습니다.</p>
              <div className="fieldGrid">
                <label><span>참가 유형</span><select value={divisionId} disabled={operationLocked} onChange={(event) => setDivisionId(event.target.value)}>{divisions.map((division) => <option key={division.division_id} value={division.division_id}>{division.name}</option>)}</select></label>
                <label><span>문제 코드</span><input value={problemCode} placeholder="A" onChange={(event) => setProblemCode(event.target.value)} disabled={operationLocked} /></label>
                <label><span>문제 제목</span><input value={title} disabled={operationLocked} placeholder="문제 제목" onChange={(event) => setTitle(event.target.value)} /></label>
                <label><span>표시 순서</span><input type="number" value={displayOrder} disabled={operationLocked} onChange={(event) => setDisplayOrder(Number(event.target.value))} /></label>
              </div>
            </div>
            <div className="editorSection">
              <h3>제한</h3>
              <div className="fieldGrid">
                <label><span>시간 제한(ms)</span><input type="number" value={timeLimitMs} disabled={operationLocked} onChange={(event) => setTimeLimitMs(Number(event.target.value))} /></label>
                <label><span>메모리(MB)</span><input type="number" value={memoryLimitMb} disabled={operationLocked} onChange={(event) => setMemoryLimitMb(Number(event.target.value))} /></label>
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
