"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "react-beautiful-dnd";
import {
  Briefcase,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Link2,
  BarChart3,
  MessageSquare,
  FileText,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  columnOrder,
  type BoardState,
  type ColumnKey,
  type Priority,
  type Project,
  type RiskLevel,
} from "@/lib/execution-types";
import { mockExecutionBoard, mockProjectStats } from "@/lib/execution-mock";
import { fetchExecutionProjects } from "@/lib/api";

type ViewMode = "kanban" | "timeline" | "list";

export default function ProjectsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [boardState, setBoardState] = useState<BoardState>(mockExecutionBoard);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: ["execution-projects"],
    queryFn: fetchExecutionProjects,
    initialData: {
      board: mockExecutionBoard,
      stats: mockProjectStats,
      updatedAt: new Date().toISOString(),
    },
  });

  useEffect(() => {
    if (data?.board) {
      setBoardState(data.board);
    }
  }, [data?.board]);

  const stats = data?.stats ?? mockProjectStats;

  const allProjects = useMemo(() => columnOrder.flatMap((column) => boardState[column]), [boardState]);

  const handleDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColumn = source.droppableId as ColumnKey;
    const destColumn = destination.droppableId as ColumnKey;

    setBoardState((prev) => {
      const newState: BoardState = {
        planning: [...prev.planning],
        inProgress: [...prev.inProgress],
        review: [...prev.review],
        completed: [...prev.completed],
      };

      const [moved] = newState[sourceColumn].splice(source.index, 1);
      newState[destColumn].splice(destination.index, 0, moved);
      return newState;
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Project Execution</h1>
          <p className="mt-1 text-gray-500">
            Strategic initiatives connected to operations
            {isFetching && <span className="ml-2 text-xs text-blue-500">Syncing…</span>}
          </p>
          {isError && (
            <button onClick={() => refetch()} className="mt-1 text-xs text-red-600 underline">
              Retry sync
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center rounded-lg border border-gray-200 bg-white">
            {(["kanban", "timeline", "list"] as ViewMode[]).map((mode, idx) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 text-sm ${
                  viewMode === mode ? "bg-blue-50 text-blue-600" : "text-gray-600"
                } ${idx === 0 ? "rounded-l-lg" : idx === 2 ? "rounded-r-lg" : ""}`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <button className="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            <Briefcase className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-6 gap-4">
        <StatCard icon={Briefcase} label="Active Projects" value={stats.activeProjects.value.toString()} trend={stats.activeProjects.trend} />
        <StatCard icon={AlertTriangle} label="At Risk" value={stats.atRisk.value.toString()} trend={stats.atRisk.trend} alert={stats.atRisk.alert} />
        <StatCard icon={Clock} label="Due This Week" value={stats.dueThisWeek.value.toString()} trend={stats.dueThisWeek.trend} />
        <StatCard icon={Brain} label="AI Generated" value={stats.aiGenerated.value.toString()} trend={stats.aiGenerated.trend} />
        <StatCard icon={FileText} label="Decisions Pending" value={stats.decisionsPending.value.toString()} trend={stats.decisionsPending.trend} alert={stats.decisionsPending.alert} />
        <StatCard icon={CheckCircle} label="Completed (MTD)" value={stats.completedMtd.value.toString()} trend={stats.completedMtd.trend} success={stats.completedMtd.success} />
      </div>

      {viewMode === "kanban" && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
            {columnOrder.map((status) => (
              <div key={status} className="rounded-xl bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {status.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <span className="text-sm text-gray-500">{boardState[status].length}</span>
                </div>

                <Droppable droppableId={status}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                      {boardState[status].map((project, index) => (
                        <Draggable key={project.id} draggableId={project.id} index={index}>
                          {(dragProvided, snapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                            >
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedProject(project)}
                                className={`rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
                                  snapshot.isDragging ? "shadow-lg" : ""
                                }`}
                              >
                                <ProjectCard project={project} />
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {viewMode === "timeline" && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <GanttChart projects={allProjects} />
        </div>
      )}

      {viewMode === "list" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-xl bg-white shadow-sm"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Linked Ops</th>
                <th className="px-4 py-3">Due / Completed</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Decisions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {allProjects.map((project) => (
                <tr
                  key={`${project.id}-list`}
                  className="hover:bg-gray-50"
                  onClick={() => setSelectedProject(project)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{project.title}</div>
                    <div className="text-xs text-gray-500">{project.id}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {project.linkedOperations?.join(", ") ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {project.dueDate
                      ? new Date(project.dueDate).toLocaleDateString()
                      : project.completedDate ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {project.completionRate !== undefined ? (
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <div className="h-1.5 w-24 rounded-full bg-gray-200">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${project.completionRate}%` }}
                          />
                        </div>
                        <span>{project.completionRate}%</span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    {project.aiRisk ? `Risk: ${project.aiRisk}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {project.decisionsPending ?? project.decisionsLogged ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {selectedProject && (
        <ProjectDetailsPanel project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
}

function ProjectCard({ project }: ProjectCardProps) {
  const priorityColors: Record<Priority, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  const riskColors: Record<RiskLevel, string> = {
    high: "text-red-600",
    medium: "text-orange-600",
    low: "text-green-600",
  };

  return (
    <div>
      <div className="mb-2 flex items-start justify-between">
        <span className={`rounded-full px-2 py-1 text-xs ${priorityColors[project.priority]}`}>
          {project.priority}
        </span>
        {project.autoGenerated && (
          <div className="flex items-center space-x-1 text-xs text-blue-600">
            <Brain className="h-3 w-3" />
            <span>AI</span>
          </div>
        )}
      </div>

      <h4 className="mb-2 line-clamp-2 font-medium text-gray-900">{project.title}</h4>

      {project.linkedOperations && project.linkedOperations.length > 0 && (
        <div className="mb-3 flex items-center space-x-1 text-xs text-gray-500">
          <Link2 className="h-3 w-3" />
          <span>{project.linkedOperations.join(", ")}</span>
        </div>
      )}

      {project.completionRate !== undefined && (
        <div className="mb-3">
          <div className="mb-1 flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>{project.completionRate}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-blue-500 transition-all"
              style={{ width: `${project.completionRate}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {project.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(project.dueDate).toLocaleDateString()}</span>
            </div>
          )}
          {project.assignees && (
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{project.assignees.length}</span>
            </div>
          )}
        </div>
        {project.aiRisk && <span className={`font-medium ${riskColors[project.aiRisk]}`}>Risk: {project.aiRisk}</span>}
      </div>

      {project.decisionsPending && project.decisionsPending > 0 && (
        <div className="mt-3 flex items-center justify-between rounded bg-orange-50 p-2">
          <span className="text-xs text-orange-700">
            {project.decisionsPending} decisions pending
          </span>
          <button className="text-xs font-medium text-orange-600 hover:text-orange-700">
            Review →
          </button>
        </div>
      )}

      {project.inventoryLink?.alerts && project.inventoryLink.alerts.length > 0 && (
        <div className="mt-2 rounded bg-red-50 p-2">
          <span className="text-xs text-red-700">{project.inventoryLink.alerts[0]}</span>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend?: string;
  alert?: boolean;
  success?: boolean;
}

function StatCard({ icon: Icon, label, value, trend, alert, success }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        alert ? "border-orange-200" : success ? "border-green-200" : "border-gray-200"
      } bg-white`}
    >
      <div className="mb-2 flex items-center justify-between">
        <Icon
          className={`h-4 w-4 ${
            alert ? "text-orange-600" : success ? "text-green-600" : "text-gray-500"
          }`}
        />
        {trend && (
          <span
            className={`text-xs ${
              trend.startsWith("+")
                ? "text-green-600"
                : trend.startsWith("-")
                  ? "text-red-600"
                  : "text-gray-500"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

interface GanttChartProps {
  projects: Project[];
}

function GanttChart({ projects }: GanttChartProps) {
  const timeline = projects.map((project) => ({
    id: project.id,
    title: project.title,
    start: project.dueDate ? new Date(project.dueDate).getTime() - 1000 * 60 * 60 * 24 * 14 : Date.now(),
    end: project.dueDate ? new Date(project.dueDate).getTime() : Date.now(),
    completion: project.completionRate ?? 0,
  }));

  const minDate = Math.min(...timeline.map((item) => item.start));
  const maxDate = Math.max(...timeline.map((item) => item.end));
  const range = maxDate - minDate || 1;

  return (
    <div className="space-y-4">
      {timeline.map((item) => {
        const left = ((item.start - minDate) / range) * 100;
        const width = ((item.end - item.start) / range) * 100;

        return (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="font-medium text-gray-900">{item.title}</span>
              <span>{item.completion}%</span>
            </div>
            <div className="h-8 rounded-full bg-gray-100">
              <div
                className="relative h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ marginLeft: `${left}%`, width: `${width}%` }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                  Due {new Date(item.end).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ProjectDetailsPanelProps {
  project: Project;
  onClose: () => void;
}

function ProjectDetailsPanel({ project, onClose }: ProjectDetailsPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 p-4">
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        className="h-full w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">{project.id}</p>
            <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
          </div>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          {project.dependencies && project.dependencies.length > 0 && (
            <InfoBlock icon={Link2} title="Dependencies" content={project.dependencies} />
          )}
          {project.inventoryLink?.items && project.inventoryLink.items.length > 0 && (
            <InfoBlock icon={BarChart3} title="Inventory Links" content={project.inventoryLink.items} />
          )}
          {project.inventoryLink?.alerts && project.inventoryLink.alerts.length > 0 && (
            <InfoBlock icon={AlertTriangle} title="Alerts" content={project.inventoryLink.alerts} variant="alert" />
          )}
          {project.currentPhase && (
            <InfoBlock icon={Clock} title="Current Phase" content={[project.currentPhase]} />
          )}
          {project.outcomes && (
            <InfoBlock icon={CheckCircle} title="Outcomes" content={[project.outcomes]} variant="success" />
          )}
          {typeof project.decisionsPending === "number" && project.decisionsPending > 0 && (
            <InfoBlock
              icon={FileText}
              title="Decisions"
              content={[`${project.decisionsPending} pending approvals`]}
            />
          )}
          {project.aiAgent && (
            <InfoBlock icon={Brain} title="AI Agent" content={[project.aiAgent]} />
          )}
        </div>

        <div className="mt-6 flex items-center space-x-3">
          <button className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            Open in Execution Suite
          </button>
          <button className="flex items-center space-x-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
            <MessageSquare className="h-4 w-4" />
            <span>Discuss</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

interface InfoBlockProps {
  icon: LucideIcon;
  title: string;
  content: string[];
  variant?: "alert" | "success" | "default";
}

function InfoBlock({ icon: Icon, title, content, variant = "default" }: InfoBlockProps) {
  const bg =
    variant === "alert"
      ? "bg-red-50 text-red-800"
      : variant === "success"
        ? "bg-green-50 text-green-800"
        : "bg-gray-50 text-gray-700";

  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <div className="mb-2 flex items-center space-x-2 text-sm font-semibold">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <ul className="list-disc space-y-1 pl-5 text-xs">
        {content.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
