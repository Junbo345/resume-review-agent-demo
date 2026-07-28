import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  Progress,
  Select,
  SimpleGrid,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  AppShell,
  NavLink,
  Alert,
  ActionIcon,
  Checkbox,
  Code,
  ScrollArea,
} from "@mantine/core";
import {
  IconBrain,
  IconBriefcase,
  IconChartBar,
  IconChevronRight,
  IconCircleCheck,
  IconFileText,
  IconShieldCheck,
  IconUpload,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";
import "@mantine/core/styles.css";
import "./styles.css";
import { criteria, job, humanOutcomes, Review } from "@rr/shared";
const API = "http://localhost:8787/api";
async function get<T>(path: string): Promise<T> {
  const r = await fetch(API + path);
  if (!r.ok) throw new Error("API unavailable");
  return r.json();
}
async function post<T>(path: string, body: any): Promise<T> {
  const r = await fetch(API + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok)
    throw new Error((await r.json()).error?.message || "Request failed");
  return r.json();
}
function App() {
  const [page, setPage] = useState("dashboard");
  const [resumes, setResumes] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [active, setActive] = useState<Review | null>(null);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refresh = () => {
    get<any[]>("/demo-resumes")
      .then(setResumes)
      .catch(() => setError("Start the API with pnpm dev to load demo data."));
    get<Review[]>("/reviews")
      .then(setReviews)
      .catch(() => {});
  };
  useEffect(refresh, []);
  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await post<Review>("/candidates/demo/reviews", {
        resumeId: selected,
      });
      setActive(r);
      setPage("review");
      setModal(false);
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AppShell navbar={{ width: 244, breakpoint: "sm" }} header={{ height: 68 }}>
      <AppShell.Header>
        <Group h="100%" px="xl" justify="space-between">
          <Group>
            <ThemeIcon size="36" radius="md" variant="light" color="indigo">
              <IconBrain />
            </ThemeIcon>
            <div>
              <Text fw={800} size="lg" lh={1}>
                ReviewPilot
              </Text>
              <Text size="xs" c="dimmed">
                Responsible hiring intelligence
              </Text>
            </div>
          </Group>
          <Badge
            color="teal"
            variant="light"
            leftSection={<IconShieldCheck size={14} />}
          >
            Decision support only
          </Badge>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Stack gap="xs">
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" mb="xs">
            Workspace
          </Text>
          <NavLink
            label="Dashboard"
            leftSection={<IconChartBar size={18} />}
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
          />
          <NavLink
            label="Review a resume"
            leftSection={<IconFileText size={18} />}
            active={page === "new"}
            onClick={() => setPage("new")}
          />
          <NavLink
            label="Job & rubric"
            leftSection={<IconBriefcase size={18} />}
            active={page === "job"}
            onClick={() => setPage("job")}
          />
          <NavLink
            label="Compare evidence"
            leftSection={<IconUsers size={18} />}
            active={page === "compare"}
            onClick={() => setPage("compare")}
          />
          <NavLink
            label="Candidate workspace"
            leftSection={<IconUsers size={18} />}
            active={page === "candidates"}
            onClick={() => setPage("candidates")}
          />
        </Stack>
        <div className="nav-foot">
          <Text size="xs" c="dimmed">
            DEMO ENVIRONMENT
          </Text>
          <Text size="xs" c="dimmed" mt={5}>
            Synthetic candidates · Mock provider
          </Text>
        </div>
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size="xl" py="xl">
          {error && (
            <Alert color="red" mb="lg">
              {error}
            </Alert>
          )}
          {page === "dashboard" && (
            <Dashboard
              reviews={reviews}
              resumes={resumes}
              onReview={() => setPage("new")}
              onOpen={(r) => {
                setActive(r);
                setPage("review");
              }}
            />
          )}
          {page === "new" && (
            <NewReviewWithPdf
              resumes={resumes}
              selected={selected}
              setSelected={setSelected}
              onRun={run}
              loading={loading}
            />
          )}{" "}
          {page === "job" && <JobPage />}
          {page === "compare" && (
            <Compare
              resumes={resumes}
              reviews={reviews}
              onOpen={(r) => {
                setActive(r);
                setPage("review");
              }}
            />
          )}
          {page === "candidates" && <JobScopedWorkspace />}
          {page === "review" && active && (
            <ReviewPage review={active} onBack={() => setPage("dashboard")} />
          )}
        </Container>
      </AppShell.Main>
      <Modal
        opened={modal}
        onClose={() => setModal(false)}
        title="Select a demo resume"
      >
        <Stack>
          <Select
            label="Resume"
            data={resumes.map((r) => ({
              value: r.id,
              label: `${r.displayCode} · ${r.title}`,
            }))}
            value={selected}
            onChange={(v) => setSelected(v || "")}
          />
          <Button disabled={!selected} loading={loading} onClick={run}>
            Run evidence review
          </Button>
        </Stack>
      </Modal>
    </AppShell>
  );
}
function Header({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-end" mb="xl">
      <div>
        <Text className="eyebrow">{eyebrow}</Text>
        <Title order={1} mt={5}>
          {title}
        </Title>
        <Text c="dimmed" mt="xs" maw={650}>
          {desc}
        </Text>
      </div>
      {action}
    </Group>
  );
}
function Dashboard({
  reviews,
  resumes,
  onReview,
  onOpen,
}: {
  reviews: Review[];
  resumes: any[];
  onReview: () => void;
  onOpen: (r: Review) => void;
}) {
  return (
    <>
      <Header
        eyebrow="Workspace / overview"
        title="Resume review workspace"
        desc="Evidence-led review of one fictional role, designed to keep hiring judgment with a human reviewer."
        action={
          <Button leftSection={<IconFileText size={17} />} onClick={onReview}>
            Review a resume
          </Button>
        }
      />
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Metric
          label="Demo candidates"
          value={resumes.length || 5}
          icon={<IconUsers />}
        />
        <Metric
          label="Awaiting human review"
          value={reviews.filter((r) => !r.humanReview).length}
          icon={<IconShieldCheck />}
        />
        <Metric
          label="Human reviews completed"
          value={reviews.filter((r) => r.humanReview).length}
          icon={<IconCircleCheck />}
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, md: 2 }}>
        <Card withBorder radius="md" className="hero-card">
          <Group justify="space-between">
            <div>
              <Badge color="indigo" variant="light">
                Current opening
              </Badge>
              <Title order={2} mt="md">
                {job.title}
              </Title>
              <Text c="dimmed" mt="sm" lh={1.6}>
                {job.description}
              </Text>
            </div>
            <ThemeIcon variant="light" size={54} radius="xl" color="indigo">
              <IconBriefcase size={27} />
            </ThemeIcon>
          </Group>
          <Divider my="lg" />
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Rubric {job.rubricVersion} · {criteria.length} criteria
            </Text>
            <Button
              variant="subtle"
              rightSection={<IconChevronRight size={16} />}
              onClick={() => (location.hash = "job")}
            >
              View rubric
            </Button>
          </Group>
        </Card>
        <Card withBorder radius="md">
          <Title order={3}>Recent review runs</Title>
          {reviews.length === 0 ? (
            <Text c="dimmed" mt="lg">
              No reviews yet. Start with a synthetic resume to see the workflow.
            </Text>
          ) : (
            <Stack mt="md">
              {reviews.slice(0, 4).map((r) => (
                <Group
                  key={r.id}
                  justify="space-between"
                  className="review-row"
                  onClick={() => onOpen(r)}
                >
                  <div>
                    <Text fw={650}>{r.displayCode}</Text>
                    <Text size="xs" c="dimmed">
                      {r.evidenceBand} ·{" "}
                      {new Date(r.createdAt).toLocaleString()}
                    </Text>
                  </div>
                  <Badge
                    color={r.humanReview ? "teal" : "orange"}
                    variant="light"
                  >
                    {r.humanReview ? "Human reviewed" : "Needs review"}
                  </Badge>
                </Group>
              ))}
            </Stack>
          )}
        </Card>
      </SimpleGrid>
    </>
  );
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card withBorder radius="md">
      <Group>
        <ThemeIcon variant="light" color="indigo" size={42}>
          {icon}
        </ThemeIcon>
        <div>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text fw={800} size="xl">
            {value}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
function NewReview({
  resumes,
  selected,
  setSelected,
  onRun,
  loading,
}: {
  resumes: any[];
  selected: string;
  setSelected: (x: string) => void;
  onRun: () => void;
  loading: boolean;
}) {
  const r = resumes.find((x) => x.id === selected);
  return (
    <>
      <Header
        eyebrow="Workspace / new review"
        title="Start an evidence review"
        desc="Choose a synthetic resume or upload a document. The mock provider runs locally and never makes a hiring decision."
      />
      <Card withBorder radius="md" maw={760}>
        <Group mb="lg">
          <ThemeIcon variant="light" color="indigo">
            <IconUpload size={18} />
          </ThemeIcon>
          <div>
            <Title order={3}>Resume source</Title>
            <Text size="sm" c="dimmed">
              Demo fixtures are safest for a guided walkthrough.
            </Text>
          </div>
        </Group>
        <Select
          label="Select a demo resume"
          placeholder="Choose candidate display code"
          data={resumes.map((x) => ({
            value: x.id,
            label: `${x.displayCode} · ${x.title}`,
          }))}
          value={selected}
          onChange={(v) => setSelected(v || "")}
          searchable
        />
        <Text size="sm" c="dimmed" ta="center" my="md">
          or
        </Text>
        <Button
          variant="default"
          fullWidth
          disabled
          leftSection={<IconUpload size={16} />}
        >
          Upload PDF, DOCX, or TXT{" "}
          <Text span size="xs" c="dimmed" ml={5}>
            (fixture mode)
          </Text>
        </Button>
        {r && (
          <Card withBorder mt="xl" className="preview">
            <Group justify="space-between">
              <div>
                <Text fw={700}>{r.displayCode}</Text>
                <Text size="sm" c="dimmed">
                  {r.title}
                </Text>
              </div>
              <Badge color="gray" variant="light">
                Synthetic
              </Badge>
            </Group>
            <Text
              size="sm"
              mt="md"
              style={{ whiteSpace: "pre-wrap" }}
              lineClamp={8}
            >
              {r.text ||
                "Text is redacted from the selection list. It will be ingested server-side."}
            </Text>
          </Card>
        )}
        <Button
          mt="xl"
          fullWidth
          disabled={!selected}
          loading={loading}
          onClick={onRun}
        >
          Run evidence review
        </Button>
      </Card>
    </>
  );
}
function NewReviewWithPdf({
  resumes,
  selected,
  setSelected,
  onRun,
  loading,
}: {
  resumes: any[];
  selected: string;
  setSelected: (x: string) => void;
  onRun: () => void;
  loading: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [rawText, setRawText] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const upload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    const form = new FormData();
    form.append("resume", file);
    try {
      const response = await fetch(`${API}/candidates/upload/resume`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error?.message || "PDF upload failed");
      setSelected(data.resumeId);
      setUploadedFilename(data.filename || file.name);
      setRawText(data.extractedText || "");
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setUploading(false);
    }
  };
  const r = resumes.find((x) => x.id === selected);
  return (
    <>
      <Header
        eyebrow="Workspace / new review"
        title="Start an evidence review"
        desc="Choose a synthetic resume or upload a text-based PDF. Scanned PDFs are not supported."
      />
      <Card withBorder radius="md" maw={760}>
        <Group mb="lg">
          <ThemeIcon variant="light" color="indigo">
            <IconUpload size={18} />
          </ThemeIcon>
          <div>
            <Title order={3}>Resume source</Title>
            <Text size="sm" c="dimmed">
              PDF only · maximum 5 MB · text extraction happens on the API.
            </Text>
          </div>
        </Group>
        <Select
          label="Select a demo resume"
          placeholder="Choose candidate display code"
          data={resumes.map((x) => ({
            value: x.id,
            label: `${x.displayCode} · ${x.title}`,
          }))}
          value={selected}
          onChange={(v) => setSelected(v || "")}
          searchable
        />
        <Text size="sm" c="dimmed" ta="center" my="md">
          or
        </Text>
        <Button
          component="label"
          variant="default"
          fullWidth
          loading={uploading}
          leftSection={<IconUpload size={16} />}
        >
          Choose PDF
          <input
            hidden
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) upload(file);
              e.currentTarget.value = "";
            }}
          />
        </Button>
        {uploadError && (
          <Alert color="red" mt="md">
            {uploadError}
          </Alert>
        )}
        {(r || rawText) && (
          <Card withBorder mt="xl" className="preview">
            <Group justify="space-between">
              <div>
                <Text fw={700}>{r?.displayCode || "Uploaded PDF"}</Text>
                <Text size="sm" c="dimmed">
                  {r?.title || uploadedFilename}
                </Text>
              </div>
              <Badge color="gray" variant="light">
                {rawText ? "Uploaded PDF" : "Synthetic"}
              </Badge>
            </Group>
            <Text size="sm" mt="md">
              {rawText
                ? "PDF text extracted successfully. Ready for review."
                : "Select this resume to run the offline demo review."}
            </Text>
            {rawText && (
              <Textarea
                label={`Raw extracted text · ${uploadedFilename}`}
                description="First transformation: PDF bytes → plain text. Review this before running the evidence workflow."
                value={rawText}
                readOnly
                minRows={12}
                autosize
                maxRows={24}
                mt="md"
              />
            )}
          </Card>
        )}
        <Button
          mt="xl"
          fullWidth
          disabled={!selected}
          loading={loading}
          onClick={onRun}
        >
          Run evidence review
        </Button>
      </Card>
    </>
  );
}
function JobPage() {
  return (
    <>
      <Header
        eyebrow="Workspace / role"
        title={job.title}
        desc={job.description}
      />
      <Card withBorder radius="md">
        <Group justify="space-between">
          <Title order={2}>Evaluation rubric</Title>
          <Badge color="indigo" variant="light">
            Version {job.rubricVersion}
          </Badge>
        </Group>
        <Table.ScrollContainer minWidth={720} mt="lg">
          <Table verticalSpacing="md">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Criterion</Table.Th>
                <Table.Th>Weight</Table.Th>
                <Table.Th>Required</Table.Th>
                <Table.Th>Scoring guide</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {criteria.map((c) => (
                <Table.Tr key={c.key}>
                  <Table.Td>
                    <Text fw={650}>{c.label}</Text>
                    <Text size="xs" c="dimmed">
                      {c.description}
                    </Text>
                  </Table.Td>
                  <Table.Td>{c.weight}%</Table.Td>
                  <Table.Td>{c.required ? "Yes" : "No"}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{c.guide}</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </>
  );
}
function ReviewPage({
  review,
  onBack,
}: {
  review: Review;
  onBack: () => void;
}) {
  const [outcome, setOutcome] = useState(review.humanReview?.outcome || "");
  const [notes, setNotes] = useState(review.humanReview?.notes || "");
  const [name, setName] = useState("Staff reviewer");
  const [saved, setSaved] = useState(!!review.humanReview);
  const save = async () => {
    const r = await post<Review>(`/reviews/${review.id}/human-review`, {
      outcome,
      notes,
      reviewerName: name,
    });
    Object.assign(review, r);
    setSaved(true);
  };
  return (
    <>
      <Header
        eyebrow="Workspace / review result"
        title={`Evidence review · ${review.displayCode}`}
        desc="Review the traceable evidence below, then record a separate human outcome."
        action={
          <Button variant="default" onClick={onBack}>
            Back to dashboard
          </Button>
        }
      />
      <Alert
        color="orange"
        variant="light"
        title="Human review required"
        mb="lg"
      >
        AI-generated decision support. A Staff Member must make the final
        decision. The assessment does not recommend hiring or rejection.
      </Alert>
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
        <Metric
          label="Overall evidence score"
          value={review.overallScore}
          icon={<IconChartBar />}
        />
        <Card withBorder>
          <Text size="xs" c="dimmed">
            Evidence band
          </Text>
          <Text fw={750} size="lg" mt="xs">
            {review.evidenceBand}
          </Text>
          <Progress value={review.overallScore} mt="md" color="indigo" />
        </Card>
        <Card withBorder>
          <Text size="xs" c="dimmed">
            Run metadata
          </Text>
          <Text size="sm" mt="xs">
            {review.provider} · {review.model}
          </Text>
          <Text size="xs" c="dimmed" mt={5}>
            Rubric {review.rubricVersion} · {review.promptVersion}
          </Text>
        </Card>
      </SimpleGrid>
      <Card withBorder radius="md">
        <Title order={2}>Criterion evidence</Title>
        <Stack mt="lg">
          {review.criteria.map((c) => {
            const meta = criteria.find((x) => x.key === c.criterionKey)!;
            return (
              <Card key={c.criterionKey} withBorder className="criterion">
                <Group justify="space-between">
                  <div>
                    <Text fw={700}>{meta.label}</Text>
                    <Text size="xs" c="dimmed">
                      Weight {meta.weight}% · Confidence{" "}
                      {Math.round(c.confidence * 100)}%
                    </Text>
                  </div>
                  <Badge
                    color={c.score ? "indigo" : "gray"}
                    size="lg"
                    variant="light"
                  >
                    {c.score}/5
                  </Badge>
                </Group>
                <Progress
                  value={c.score * 20}
                  mt="md"
                  color={c.score ? "indigo" : "gray"}
                />
                <Text size="sm" mt="md">
                  {c.rationale}
                </Text>
                {c.evidence.length ? (
                  <Stack gap="xs" mt="sm">
                    {c.evidence.map((e, i) => (
                      <Text key={i} className="quote">
                        “{e.text}”
                      </Text>
                    ))}
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" mt="sm">
                    Insufficient evidence — no exact supporting excerpt was
                    found.
                  </Text>
                )}
                {c.missingInformation.length > 0 && (
                  <Text size="sm" c="orange" mt="sm">
                    Missing: {c.missingInformation.join(" ")}
                  </Text>
                )}
              </Card>
            );
          })}
        </Stack>
      </Card>
      <SimpleGrid cols={{ base: 1, md: 2 }} mt="lg">
        <Card withBorder>
          <Title order={3}>Concerns & review flags</Title>
          {review.concerns.length ? (
            <Stack mt="md">
              {review.concerns.map((c, i) => (
                <Alert
                  key={i}
                  color={c.type === "prompt_injection" ? "orange" : "gray"}
                  title={c.type.replaceAll("_", " ")}
                >
                  {c.description}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Text c="dimmed" mt="md">
              No additional concerns detected.
            </Text>
          )}
          <Title order={3} mt="xl">
            Suggested interview questions
          </Title>
          <Stack mt="md">
            {review.suggestedInterviewQuestions.map((q) => (
              <Text key={q} size="sm">
                • {q}
              </Text>
            ))}
          </Stack>
        </Card>
        <Card withBorder className="human-panel">
          <Badge color="teal" variant="light">
            Separate human action
          </Badge>
          <Title order={3} mt="sm">
            Human review
          </Title>
          <Text size="sm" c="dimmed" mt="xs">
            The AI assessment above is not an outcome.
          </Text>
          <TextInput
            label="Reviewer name"
            mt="lg"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Select
            label="Outcome"
            mt="md"
            placeholder="Select an outcome"
            data={humanOutcomes as unknown as string[]}
            value={outcome}
            onChange={(v) => setOutcome(v || "")}
          />
          <Textarea
            label="Notes"
            mt="md"
            minRows={4}
            value={notes}
            onChange={(e) => setNotes(e.currentTarget.value)}
          />
          <Button
            fullWidth
            mt="lg"
            color="teal"
            disabled={!outcome || !name}
            onClick={save}
          >
            {saved ? "Update human review" : "Save human review"}
          </Button>
        </Card>
      </SimpleGrid>
    </>
  );
}
function Compare({
  resumes,
  reviews,
  onOpen,
}: {
  resumes: any[];
  reviews: Review[];
  onOpen: (r: Review) => void;
}) {
  return (
    <>
      <Header
        eyebrow="Workspace / comparison"
        title="Compare evidence"
        desc="Select up to three completed runs. The table preserves rubric-by-rubric evidence without creating a default leaderboard."
      />
      <Card withBorder>
        <Text size="sm" c="dimmed" mb="lg">
          Run reviews first, then compare their criterion evidence side by side.
        </Text>
        <Table.ScrollContainer minWidth={760}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Criterion</Table.Th>
                {reviews.slice(0, 3).map((r) => (
                  <Table.Th key={r.id}>
                    <Button
                      variant="subtle"
                      size="compact-sm"
                      onClick={() => onOpen(r)}
                    >
                      {r.displayCode}
                    </Button>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {criteria.map((c) => (
                <Table.Tr key={c.key}>
                  <Table.Td>
                    <Text fw={600}>{c.label}</Text>
                    <Text size="xs" c="dimmed">
                      {c.weight}%
                    </Text>
                  </Table.Td>
                  {reviews.slice(0, 3).map((r) => {
                    const x = r.criteria.find((x) => x.criterionKey === c.key);
                    return (
                      <Table.Td key={r.id}>
                        <Text fw={700}>{x?.score || 0}/5</Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {x?.evidence[0]?.text || "Insufficient evidence"}
                        </Text>
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Card>
    </>
  );
}
function JobScopedWorkspace() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobId, setJobId] = useState(job.id);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showNewJob, setShowNewJob] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState("");
  const [fit, setFit] = useState<any>(null);
  const currentJob = jobs.find(item => item.id === jobId);
  const refresh = async () => setCandidates(await get<any[]>(`/candidates?job_id=${encodeURIComponent(jobId)}`));
  useEffect(() => { get<any[]>("/jobs").then(items => { setJobs(items); if (items[0]) setJobId(items.find(item => item.id === job.id)?.id || items[0].id); }).catch(() => setMessage("Unable to load jobs.")); }, []);
  useEffect(() => { if (jobId) { refresh().catch(() => setMessage("Unable to load candidates for this job.")); setSelected([]); setFit(null); } }, [jobId]);
  const upload = async (files: FileList | null) => { if (!files?.length) return; setUploading(true); const form = new FormData(); form.append("job_id", jobId); Array.from(files).forEach(file => form.append("files", file)); try { const response = await fetch(`${API}/documents/upload`, { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || "Upload failed"); await refresh(); } catch (error) { setMessage((error as Error).message); } finally { setUploading(false); } };
  const createJob = async () => { try { const created = await post<any>("/jobs", { title: newTitle, description: newDescription }); setJobs(items => [created, ...items]); setJobId(created.id); setNewTitle(""); setNewDescription(""); setShowNewJob(false); } catch (error) { setMessage((error as Error).message); } };
  const evaluate = async () => { if (!currentJob) return; setEvaluating(true); try { const data = await post<any>("/reviews/evaluate", { job_id: jobId, candidate_ids: selected }); setFit(data); await refresh(); } catch (error) { setMessage((error as Error).message); } finally { setEvaluating(false); } };
  return <><Header eyebrow="HR workspace / jobs" title="Candidate pipeline" desc="Choose a job to isolate its resumes, candidates, and fit reviews." action={<Button variant="default" onClick={refresh}>Refresh</Button>} /><Card withBorder><Group align="flex-end"><Select label="Active job" value={jobId} onChange={value => value && setJobId(value)} data={jobs.map(item => ({ value: item.id, label: `${item.title} · ${item.status}` }))} style={{ flex: 1 }} /><Button variant="light" onClick={() => setShowNewJob(value => !value)}>New job</Button></Group>{currentJob && <Text size="sm" c="dimmed" mt="sm">{currentJob.description}</Text>}{showNewJob && <Card withBorder mt="md"><TextInput label="Job title" value={newTitle} onChange={event => setNewTitle(event.currentTarget.value)} /><Textarea label="Job description" mt="sm" minRows={4} value={newDescription} onChange={event => setNewDescription(event.currentTarget.value)} /><Button mt="sm" disabled={!newTitle.trim() || newDescription.trim().length < 20} onClick={createJob}>Create job</Button></Card>}</Card>{message && <Alert color="red" mt="lg">{message}</Alert>}<Card withBorder mt="lg"><Title order={3}>Upload resumes for {currentJob?.title || "this job"}</Title><Text size="sm" c="dimmed" mt="xs">Every uploaded PDF is assigned to the active job.</Text><Button component="label" mt="lg" loading={uploading} leftSection={<IconUpload size={16} />}>Choose PDFs<input hidden type="file" multiple accept="application/pdf,.pdf" onChange={event => { upload(event.currentTarget.files); event.currentTarget.value = ""; }} /></Button></Card><Card withBorder mt="lg"><Group justify="space-between"><div><Title order={3}>Candidates in this job</Title><Text size="sm" c="dimmed">Candidates from other jobs are not shown or evaluable here.</Text></div><Group><Button variant="subtle" onClick={() => setSelected(candidates.map(item => item.id))}>Select all</Button><Button variant="subtle" onClick={() => setSelected([])}>Clear</Button></Group></Group><Stack mt="lg">{candidates.length ? candidates.map(candidate => <Card key={candidate.id} withBorder className="candidate-row"><Group align="flex-start"><Checkbox checked={selected.includes(candidate.id)} onChange={event => setSelected(ids => event.currentTarget.checked ? [...ids, candidate.id] : ids.filter(id => id !== candidate.id))} /><div style={{ flex: 1 }}><Text fw={700}>{candidate.candidate_name || "Candidate name not provided"}</Text><Text size="xs" c="dimmed">{candidate.original_filename}</Text><Group gap="xs" mt="sm">{(candidate.structured_data.skills || []).slice(0, 8).map((skill: string) => <Badge key={skill} variant="light" color="indigo">{skill}</Badge>)}</Group><AccordionPreview data={candidate.structured_data} /></div></Group></Card>) : <Text c="dimmed">No candidates uploaded for this job yet.</Text>}</Stack><Button mt="lg" disabled={!selected.length} loading={evaluating} onClick={evaluate}>Evaluate selected candidates</Button></Card>{fit && <Card withBorder mt="lg" className="fit-result"><Title order={3}>Fit result for {currentJob?.title}</Title><Text size="sm" c="dimmed">{fit.model_name} · {fit.prompt_version}</Text><Code block mt="lg">{JSON.stringify(fit, null, 2)}</Code></Card>}</>;
}
function CandidateWorkspace() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState(job.title);
  const [jobDescription, setJobDescription] = useState(job.description);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [fit, setFit] = useState<any>(null);
  const refresh = async () => setCandidates(await get<any[]>("/candidates"));
  useEffect(() => { refresh().catch(() => setMessage("Unable to load saved candidates.")); }, []);
  const upload = async (files: FileList | null) => { if (!files?.length) return; setUploading(true); setMessage(""); const form = new FormData(); Array.from(files).forEach(file => form.append("files", file)); try { const response = await fetch(`${API}/documents/upload`, { method: "POST", body: form }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || "Batch upload failed"); setUploadResults(data.results); await refresh(); } catch (error) { setMessage((error as Error).message); } finally { setUploading(false); } };
  const evaluate = async () => { setEvaluating(true); setMessage(""); try { const response = await fetch(`${API}/reviews/evaluate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_title: jobTitle, job_description: jobDescription, candidate_ids: selected }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || "Evaluation failed"); setFit(data); } catch (error) { setMessage((error as Error).message); } finally { setEvaluating(false); } };
  const toggle = (id: string, checked: boolean) => setSelected(current => checked ? [...current, id] : current.filter(x => x !== id));
  return <><Header eyebrow="Workspace / candidates" title="Candidate workspace" desc="Upload multiple PDFs, inspect normalized records saved in SQLite, then evaluate selected candidates against one consistent job rubric." action={<Button variant="default" onClick={refresh}>Refresh</Button>} /><SimpleGrid cols={{ base: 1, md: 2 }}><Card withBorder><Title order={3}>Upload PDF resumes</Title><Text size="sm" c="dimmed" mt="xs">Up to 10 PDFs per batch · 5 MB each · duplicate hashes are skipped.</Text><Button component="label" mt="lg" loading={uploading} leftSection={<IconUpload size={16} />}>Choose multiple PDFs<input hidden type="file" multiple accept="application/pdf,.pdf" onChange={e => { upload(e.currentTarget.files); e.currentTarget.value = ""; }} /></Button>{uploadResults.length > 0 && <Stack mt="lg">{uploadResults.map((result, index) => <Group key={`${result.filename}-${index}`} justify="space-between"><Text size="sm" lineClamp={1}>{result.filename}</Text><Badge color={result.status === "completed" ? "teal" : result.status === "duplicate" ? "yellow" : "red"}>{result.status}{result.error ? ` · ${result.error}` : ""}</Badge></Group>)}</Stack>}</Card><Card withBorder><Title order={3}>Job for evaluation</Title><TextInput label="Job title" mt="md" value={jobTitle} onChange={e => setJobTitle(e.currentTarget.value)} /><Textarea label="Job description" mt="md" minRows={7} value={jobDescription} onChange={e => setJobDescription(e.currentTarget.value)} /></Card></SimpleGrid>{message && <Alert color="red" mt="lg">{message}</Alert>}<Card withBorder mt="lg"><Group justify="space-between"><div><Title order={3}>Saved candidates</Title><Text size="sm" c="dimmed">Select one or more candidates. Only completed extractions can be evaluated.</Text></div><Group><Button variant="subtle" onClick={() => setSelected(candidates.filter(c => c.extraction_status === "completed").map(c => c.id))}>Select all</Button><Button variant="subtle" onClick={() => setSelected([])}>Clear</Button></Group></Group><Stack mt="lg">{candidates.length === 0 ? <Text c="dimmed">No saved candidates yet.</Text> : candidates.map(candidate => <Card key={candidate.id} withBorder className="candidate-row"><Group align="flex-start"><Checkbox checked={selected.includes(candidate.id)} disabled={candidate.extraction_status !== "completed"} onChange={e => toggle(candidate.id, e.currentTarget.checked)} /><div style={{ flex: 1 }}><Group justify="space-between"><div><Text fw={700}>{candidate.candidate_name || "Candidate name not provided"}</Text><Text size="xs" c="dimmed">{candidate.original_filename} · {new Date(candidate.created_at).toLocaleString()}</Text></div><Badge color={candidate.extraction_status === "completed" ? "teal" : "red"}>{candidate.extraction_status}</Badge></Group><Text size="sm" mt="xs" c="dimmed">{candidate.most_recent_position || "Most recent position not provided"}</Text><Group gap="xs" mt="sm">{(candidate.structured_data.skills || []).slice(0, 8).map((skill: string) => <Badge key={skill} variant="light" color="indigo">{skill}</Badge>)}</Group><AccordionPreview data={candidate.structured_data} /></div></Group></Card>)}</Stack><Button mt="lg" disabled={!selected.length || !jobDescription.trim()} loading={evaluating} onClick={evaluate}>Evaluate selected candidates with Gemini</Button></Card>{fit && <Card withBorder mt="lg" className="fit-result"><Group justify="space-between"><div><Title order={3}>Candidate-job fit result</Title><Text size="sm" c="dimmed">{fit.model_name} · {fit.prompt_version}</Text></div><Badge color="indigo">Same rubric applied</Badge></Group><Stack mt="lg">{fit.ranking.map((rank: any) => <Group key={rank.candidate_id} justify="space-between" className="review-row"><div><Text fw={700}>#{rank.rank} · {rank.candidate_name || "Candidate"}</Text><Text size="sm" c="dimmed">{rank.reason}</Text></div><Badge size="lg" color="indigo">{rank.overall_fit_score}/100</Badge></Group>)}</Stack><ScrollArea mt="lg"><Code block>{JSON.stringify(fit, null, 2)}</Code></ScrollArea></Card>}</>;
}
function AccordionPreview({ data }: { data: any }) { const [deleting, setDeleting] = useState(false); const documentId = data.__document_id as string | undefined; const fit = data.__latest_fit; const visible = { ...data }; delete visible.__document_id; delete visible.__latest_fit; const remove = async () => { if (!documentId || !window.confirm("Delete this saved resume and its extracted data?")) return; setDeleting(true); try { const response = await fetch(`${API}/documents/${documentId}`, { method: "DELETE" }); if (!response.ok) throw new Error("Delete failed"); window.location.reload(); } finally { setDeleting(false); } }; return <><Group gap="xs" mt="sm">{fit && <Badge color="indigo">Latest fit: {fit.overall_fit_score}/100</Badge>}{fit && <Text size="xs" c="dimmed">{fit.recommendation}</Text>}</Group><details className="structured-preview"><summary>View structured candidate data</summary><Code block mt="sm">{JSON.stringify(visible, null, 2)}</Code></details>{fit && <Text size="sm" mt="xs" c="dimmed">{fit.summary}</Text>}{documentId && <Group justify="flex-end" mt="sm"><Button size="xs" color="red" variant="subtle" loading={deleting} leftSection={<IconTrash size={14} />} onClick={remove}>Delete resume</Button></Group>}</>; }
function PdfQuickReview() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Review | null>(null);
  const choose = async (file: File) => {
    setBusy(true);
    setMessage("");
    setResult(null);
    const form = new FormData();
    form.append("resume", file);
    try {
      const uploaded = await fetch(`${API}/candidates/upload/resume`, {
        method: "POST",
        body: form,
      });
      const data = await uploaded.json().catch(() => ({ error: { message: `PDF upload failed (${uploaded.status})` } }));
      if (!uploaded.ok)
        throw new Error(data.error?.message || "PDF upload failed");
      const review = await post<Review>("/candidates/demo/reviews", {
        resumeId: data.resumeId,
      });
      setResult(review);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="pdf-quick-review" withBorder shadow="md">
      <Group justify="space-between">
        <div>
          <Text fw={700}>Review a PDF</Text>
          <Text size="xs" c="dimmed">
            PDF only · max 5 MB
          </Text>
        </div>
        <Button
          component="label"
          size="xs"
          loading={busy}
          leftSection={<IconUpload size={14} />}
        >
          Choose PDF
          <input
            hidden
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) choose(file);
              e.currentTarget.value = "";
            }}
          />
        </Button>
      </Group>
      {message && (
        <Alert color="red" mt="sm">
          {message}
        </Alert>
      )}
      {result && (
        <Alert color="teal" mt="sm">
          PDF read successfully · {result.displayCode} · {result.overallScore}
          /100 evidence score
        </Alert>
      )}
    </Card>
  );
}
import { MantineProvider } from "@mantine/core";
createRoot(document.getElementById("root")!).render(
  <MantineProvider>
    <App />
  </MantineProvider>,
);
