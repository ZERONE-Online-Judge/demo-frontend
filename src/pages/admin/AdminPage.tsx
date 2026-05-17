import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export function AdminPage({
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
  const [contestStatus, setContestStatus] = useState("schedule_tbd");
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
  const [judgeTotalCount, setJudgeTotalCount] = useState(0);
  const judgePageSize = 20;
  const showHome = section === "home";
  const showContests = section === "contests";
  const showJudge = section === "judge";
  const pendingJudgeSubmissionIds = useMemo(
    () => judgeEntries.filter((entry) => isSubmissionPending(entry.submission.status)).map((entry) => entry.submission.submission_id),
    [judgeEntries]
  );
  const pendingJudgeSubmissionKey = pendingJudgeSubmissionIds.join(",");

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

  async function loadJudgeInspector(page: number = judgePageIndex) {
    try {
      const cursor = String(Math.max(0, page - 1) * judgePageSize);
      const [dashboardData, submissionPage] = await Promise.all([
        apiRequest<AdminJudgeDashboard>("/admin/judge/dashboard", staffSession.accessToken),
        apiPageRequest<AdminJudgeSubmissionEntry[]>(
          `/admin/judge/submissions?limit=${judgePageSize}&cursor=${encodeURIComponent(cursor)}&include_source=false`,
          staffSession.accessToken
        ),
      ]);
      setJudgeDashboard(dashboardData);
      setJudgeEntries(submissionPage.data);
      setJudgeTotalCount(Math.max(0, Number(submissionPage.page.total_count ?? 0)));
      if (selectedJudgeEntry) {
        const updated = submissionPage.data.find((item) => item.submission.submission_id === selectedJudgeEntry.submission.submission_id);
        setSelectedJudgeEntry(updated ? { ...updated, submission: { ...updated.submission, source_code: selectedJudgeEntry.submission.source_code ?? updated.submission.source_code } } : null);
      }
    } catch (error) {
      setMessage(formatApiError(error, "채점기 현황을 불러오지 못했습니다"));
    }
  }

  useEffect(() => {
    if (!showJudge) return;
    loadJudgeInspector(judgePageIndex);
  }, [staffSession.accessToken, showJudge, judgePageIndex]);

  useEffect(() => {
    if (!showJudge) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadJudgeInspector(judgePageIndex);
    }, 5000);
    const onFocus = () => loadJudgeInspector(judgePageIndex);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [staffSession.accessToken, selectedJudgeEntry?.submission.submission_id, showJudge, judgePageIndex]);

  useEffect(() => {
    if (!showJudge || !pendingJudgeSubmissionIds.length) return;
    let cancelled = false;
    async function waitPending(submissionId: string) {
      try {
        const updated = await apiRequest<Submission>(
          `/admin/judge/submissions/${submissionId}/status:wait?wait_seconds=4&poll_interval_seconds=0.5`,
          staffSession.accessToken
        );
        if (cancelled) return;
        setJudgeEntries((current) =>
          current.map((entry) =>
            entry.submission.submission_id === updated.submission_id
              ? { ...entry, submission: { ...entry.submission, ...updated, source_code: entry.submission.source_code } }
              : entry
          )
        );
        setSelectedJudgeEntry((current) =>
          current?.submission.submission_id === updated.submission_id
            ? { ...current, submission: { ...current.submission, ...updated, source_code: current.submission.source_code } }
            : current
        );
      } catch {
        // The slower full-list refresh will recover transient status polling errors.
      }
    }
    pendingJudgeSubmissionIds.forEach((submissionId) => void waitPending(submissionId));
    return () => {
      cancelled = true;
    };
  }, [pendingJudgeSubmissionKey, showJudge, staffSession.accessToken]);

  function resetContestEditor() {
    setContestTitle("");
    setContestOpenDate(todayInputValue());
    setOrganizationName("");
    setContestStatus("schedule_tbd");
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
          status: "schedule_tbd",
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
      const schedulePending = isScheduleTbd(contestStatus);
      const updated = await apiRequest<Contest>(`/operator/contests/${editingContestId}/settings`, staffSession.accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          title: contestTitle.trim() || current.title,
          organization_name: organizationName,
          status: contestStatus,
          ...(schedulePending ? {} : { start_at: `${contestOpenDate}T00:00:00+09:00` }),
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

  async function openJudgeSubmissionDetail(entry: AdminJudgeSubmissionEntry) {
    setSelectedJudgeEntry(entry);
    try {
      const detail = await apiRequest<AdminJudgeSubmissionEntry>(
        `/admin/judge/submissions/${entry.submission.submission_id}`,
        staffSession.accessToken
      );
      setSelectedJudgeEntry(detail);
    } catch (error) {
      setMessage(formatApiError(error, "제출 상세를 불러오지 못했습니다"));
    }
  }

  useEffect(() => {
    setJudgePageIndex(1);
  }, [section]);

  const judgeSafePage = Math.max(1, judgePageIndex);
  const judgePageItems = judgeEntries;
  const judgeTotalPages = Math.max(1, Math.ceil(judgeTotalCount / judgePageSize));
  const sourceLengthLabel = (submission: Submission) => {
    const length = submission.source_code_length ?? (submission.source_code ? new Blob([submission.source_code]).size : null);
    return typeof length === "number" ? `${length.toLocaleString()} B` : "-";
  };
  const runtimeLabel = (submission: Submission) => typeof submission.runtime_ms === "number" ? `${submission.runtime_ms} ms` : "-";
  const memoryLabel = (submission: Submission) => typeof submission.memory_kb === "number" ? `${submission.memory_kb.toLocaleString()} KB` : "-";

  const adminSchedulePending = isScheduleTbd(contestStatus);
  const contestRows = contests.map((contest) => [
    contest.title,
    contest.organization_name,
    contestStatusLabel(contest.status),
    isScheduleTbd(contest) ? "미정" : formatDate(contest.start_at),
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
      <PageNotice message={message} />
      {showHome && (
        <section className="summaryGrid">
          <InfoCard icon={<Trophy />} title="대회" value={String(dashboard?.contest_count ?? 0)} detail="total contests" />
          <InfoCard icon={<Activity />} title="대기 job" value={String(dashboard?.pending_jobs ?? 0)} detail="pending" />
          <InfoCard icon={<Mail />} title="메일 큐" value={String(dashboard?.mail_queue_pending ?? 0)} detail="pending" />
          <InfoCard
            icon={<Server />}
            title="채점 노드"
            value={`${dashboard?.active_judge_node_count ?? 0}/${dashboard?.judge_node_count ?? 0}`}
            detail="active/registered"
          />
        </section>
      )}
      {showJudge && (
      <section className="panel">
        <div className="panelTitleRow">
          <PanelTitle icon={<Server />} title="채점기" />
          <button className="secondary" onClick={() => loadJudgeInspector(judgePageIndex)}>새로고침</button>
        </div>
        <div className="summaryGrid">
          <InfoCard
            icon={<Server />}
            title="채점 노드"
            value={`${(judgeDashboard?.nodes ?? []).filter((node) => node.is_active).length}/${judgeDashboard?.nodes.length ?? 0}`}
            detail="active/registered"
          />
          <InfoCard icon={<Activity />} title="큐" value={String(judgeDashboard?.queue_stats?.pending_count ?? 0)} detail="pending" />
          <InfoCard icon={<PlayCircle />} title="실행 중" value={String(judgeDashboard?.queue_stats?.running_count ?? 0)} detail="running" />
          <InfoCard icon={<Clock3 />} title="최근 기록" value={String(judgeTotalCount)} detail={`current page ${judgeEntries.length}`} />
        </div>
        <DataTable
          columns={["노드", "상태", "슬롯", "실행", "하트비트"]}
          rows={(judgeDashboard?.nodes ?? []).map((node) => [
            node.node_name,
            node.is_active ? (node.schedulable ? "connected" : "paused") : "stale",
            `${node.free_slots}/${node.total_slots}`,
            String(node.running_job_count),
            `${formatDate(node.last_heartbeat_at)} (${node.heartbeat_age_seconds}s)`,
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
            <button className="textButton" onClick={() => openJudgeSubmissionDetail(entry)}>보기</button>,
          ])}
        />
        {judgeEntries.length > 0 && <SimplePagination page={judgeSafePage} totalPages={judgeTotalPages} onChange={setJudgePageIndex} />}
      </section>
      )}
      {showJudge && selectedJudgeEntry && (
        <div className="modalOverlay" onClick={() => setSelectedJudgeEntry(null)}>
          <aside className="panel submissionInspector modalPanel" onClick={(event) => event.stopPropagation()}>
            <div className="panelTitleRow">
              <PanelTitle icon={<FileCode2 />} title={`제출 상세 · ${selectedJudgeEntry.submission.submission_id}`} />
              <div className="tableActions">
                <SubmissionStatusBadge submission={selectedJudgeEntry.submission} compact />
                <button className="secondary" onClick={() => setSelectedJudgeEntry(null)}>닫기</button>
              </div>
            </div>
            <section className="previewMetaGrid">
              <div className="previewMetaItem"><span>대회</span><strong>{selectedJudgeEntry.contest?.title ?? "-"}</strong></div>
              <div className="previewMetaItem"><span>참가 유형</span><strong>{selectedJudgeEntry.division?.name ?? "-"}</strong></div>
              <div className="previewMetaItem"><span>문제</span><strong>{selectedJudgeEntry.problem ? `${selectedJudgeEntry.problem.problem_code} · ${selectedJudgeEntry.problem.title}` : selectedJudgeEntry.submission.problem_id}</strong></div>
              <div className="previewMetaItem"><span>팀 / 사용자</span><strong>{selectedJudgeEntry.team?.team_name ?? "-"} / {selectedJudgeEntry.member?.email ?? "-"}</strong></div>
              <div className="previewMetaItem"><span>언어</span><strong>{selectedJudgeEntry.submission.language}</strong></div>
              <div className="previewMetaItem"><span>채점 결과</span><strong>{submissionStatusLabel(selectedJudgeEntry.submission.status)}</strong></div>
              <div className="previewMetaItem"><span>코드 길이</span><strong>{sourceLengthLabel(selectedJudgeEntry.submission)}</strong></div>
              <div className="previewMetaItem"><span>시간</span><strong>{runtimeLabel(selectedJudgeEntry.submission)}</strong></div>
              <div className="previewMetaItem"><span>메모리</span><strong>{memoryLabel(selectedJudgeEntry.submission)}</strong></div>
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
          </aside>
        </div>
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
                <label><span>대회 오픈일</span><input type="date" value={contestOpenDate} disabled={adminSchedulePending} onChange={(event) => setContestOpenDate(event.target.value)} /></label>
                <label><span>대회 공개상태</span><select value={contestStatus} onChange={(event) => setContestStatus(event.target.value)}><option value="schedule_tbd">스케줄 미정</option><option value="scheduled">스케줄</option><option value="open">오픈</option></select></label>
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

