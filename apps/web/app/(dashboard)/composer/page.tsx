"use client";

import { useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  Play,
  Pause,
  Save,
  Settings,
  Package,
  AlertCircle,
  CheckCircle,
  GitBranch,
  Mail,
  Database,
  Brain,
  Webhook,
  Timer,
  Filter,
  Zap,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ComponentCategory = "trigger" | "condition" | "action" | "approval";

type LibraryComponent = {
  type: ComponentCategory;
  name: string;
  icon: LucideIcon;
  color: "blue" | "purple" | "green" | "orange" | "yellow" | "red";
};

type WorkflowNode = {
  id: string;
  type: ComponentCategory;
  name: string;
  icon: LucideIcon;
  position: { x: number; y: number };
  metadata?: Record<string, string | number | undefined>;
};

type WorkflowConnection = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

type WorkflowState = {
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
};

type DragItem = LibraryComponent;

type NodeUpdate = {
  name?: string;
  metadata?: Record<string, string | number | undefined>;
};

const componentLibrary: LibraryComponent[] = [
  { type: "trigger", name: "Inventory Low", icon: Package, color: "blue" },
  { type: "trigger", name: "Schedule", icon: Timer, color: "purple" },
  { type: "trigger", name: "Webhook", icon: Webhook, color: "green" },
  { type: "condition", name: "If/Then", icon: GitBranch, color: "orange" },
  { type: "condition", name: "Filter", icon: Filter, color: "yellow" },
  { type: "action", name: "Create PO", icon: Database, color: "blue" },
  { type: "action", name: "Send Alert", icon: Mail, color: "red" },
  { type: "action", name: "Update Stock", icon: Package, color: "green" },
  { type: "action", name: "AI Decision", icon: Brain, color: "purple" },
  { type: "approval", name: "Approval Gate", icon: CheckCircle, color: "orange" },
];

const seededNodes: WorkflowNode[] = [
  {
    id: "node-1",
    type: "trigger",
    name: "Inventory < 20%",
    icon: Package,
    position: { x: 120, y: 160 },
    metadata: { threshold: 20, comparator: "Less than", skuFilter: "All" },
  },
  {
    id: "node-2",
    type: "condition",
    name: "Value > $1000?",
    icon: GitBranch,
    position: { x: 340, y: 160 },
    metadata: { comparator: "Greater than", amount: 1000 },
  },
  {
    id: "node-3",
    type: "action",
    name: "Create PO",
    icon: Database,
    position: { x: 560, y: 120 },
    metadata: { supplier: "Preferred", currency: "USD" },
  },
  {
    id: "node-4",
    type: "action",
    name: "Send Alert",
    icon: Mail,
    position: { x: 560, y: 220 },
    metadata: { channel: "Teams", severity: "Medium" },
  },
  {
    id: "node-5",
    type: "approval",
    name: "Manager Approval",
    icon: CheckCircle,
    position: { x: 780, y: 160 },
    metadata: { approver: "Supply Lead", sla: "4h" },
  },
];

const seededConnections: WorkflowConnection[] = [
  { id: "conn-1", from: "node-1", to: "node-2", label: "Trigger" },
  { id: "conn-2", from: "node-2", to: "node-3", label: "Yes" },
  { id: "conn-3", from: "node-2", to: "node-4", label: "No" },
  { id: "conn-4", from: "node-3", to: "node-5" },
  { id: "conn-5", from: "node-4", to: "node-5" },
];

const nodeFields: Record<
  ComponentCategory,
  { key: string; label: string; placeholder?: string; type?: "text" | "number" }[]
> = {
  trigger: [
    { key: "threshold", label: "Threshold", type: "number" },
    { key: "comparator", label: "Comparator", placeholder: "Less than" },
    { key: "skuFilter", label: "SKU Filter", placeholder: "All" },
  ],
  condition: [
    { key: "comparator", label: "Comparator", placeholder: "Greater than" },
    { key: "amount", label: "Amount", type: "number" },
    { key: "field", label: "Field", placeholder: "Order value" },
  ],
  action: [
    { key: "channel", label: "Channel", placeholder: "Teams" },
    { key: "owner", label: "Owner", placeholder: "Planning" },
    { key: "sla", label: "SLA", placeholder: "4h" },
  ],
  approval: [
    { key: "approver", label: "Approver", placeholder: "Manager" },
    { key: "backup", label: "Backup", placeholder: "Director" },
    { key: "sla", label: "SLA", placeholder: "4h" },
  ],
};

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function WorkflowComposer() {
  const [workflow, setWorkflow] = useState<WorkflowState>({
    name: "Low Stock Auto-Replenishment",
    description: "Automatically create purchase orders when inventory falls below threshold",
    nodes: seededNodes,
    connections: seededConnections,
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(seededNodes[0]?.id ?? null);
  const [runState, setRunState] = useState<"idle" | "testing" | "paused">("idle");

  const activeNode = useMemo(
    () => workflow.nodes.find((node) => node.id === selectedNodeId),
    [selectedNodeId, workflow.nodes]
  );

  const completion = useMemo(() => {
    const total = workflow.nodes.length || 1;
    const ready = workflow.nodes.filter((node) => node.metadata && Object.keys(node.metadata ?? {}).length > 0).length;
    return Math.round((ready / total) * 100);
  }, [workflow.nodes]);

  const handleNodeUpdate = (updates: NodeUpdate) => {
    if (!activeNode) return;

    setWorkflow((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => {
        if (node.id !== activeNode.id) {
          return node;
        }

        const nextNode: WorkflowNode = {
          ...node,
          ...(updates.name !== undefined ? { name: updates.name } : {}),
        };

        if (updates.metadata) {
          nextNode.metadata = {
            ...(node.metadata ?? {}),
            ...updates.metadata,
          };
        }

        return nextNode;
      }),
    }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen flex-col bg-gray-50">
        <ComposerHeader
          workflow={workflow}
          runState={runState}
          completion={completion}
          onChangeRunState={setRunState}
        />

        <div className="flex flex-1 overflow-hidden">
          <ComponentLibraryPanel components={componentLibrary} />

          <div className="relative flex-1 overflow-hidden">
            <WorkflowCanvas
              workflow={workflow}
              onUpdate={setWorkflow}
              onSelectNode={setSelectedNodeId}
              selectedNodeId={selectedNodeId}
            />
          </div>

          <PropertiesPanel selectedNode={activeNode} onUpdateNode={handleNodeUpdate} />
        </div>
      </div>
    </DndProvider>
  );
}

function ComposerHeader({
  workflow,
  runState,
  completion,
  onChangeRunState,
}: {
  workflow: WorkflowState;
  runState: "idle" | "testing" | "paused";
  completion: number;
  onChangeRunState: (state: "idle" | "testing" | "paused") => void;
}) {
  const testing = runState === "testing";

  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{workflow.name}</h1>
          <p className="mt-1 text-sm text-gray-500">{workflow.description}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            {completion}% configured
          </div>
          <button className="flex items-center space-x-2 rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => onChangeRunState(testing ? "paused" : "testing")}
            className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-white ${
              testing ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {testing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{testing ? "Pause Test" : "Test Run"}</span>
          </button>
          <button className="flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
            <Save className="h-4 w-4" />
            <span>Save Workflow</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ComponentLibraryPanel({ components }: { components: LibraryComponent[] }) {
  return (
    <div className="w-64 overflow-y-auto border-r border-gray-200 bg-white p-4">
      <h3 className="mb-4 font-medium text-gray-900">Components</h3>
      {(["trigger", "condition", "action", "approval"] as ComponentCategory[]).map((category) => (
        <div key={category} className="mb-6">
          <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">{category}s</h4>
          <div className="space-y-2">
            {components
              .filter((component) => component.type === category)
              .map((component) => (
                <DraggableComponent key={component.name} component={component} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DraggableComponent({ component }: { component: LibraryComponent }) {
  const dragRef = useRef<HTMLDivElement | null>(null);
  const [{ isDragging }, drag] = useDrag<DragItem, void, { isDragging: boolean }>(() => ({
    type: "component",
    item: component,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  drag(dragRef);

  const colorClasses: Record<LibraryComponent["color"], string> = {
    blue: "border-blue-200 bg-blue-100 text-blue-700",
    purple: "border-purple-200 bg-purple-100 text-purple-700",
    green: "border-green-200 bg-green-100 text-green-700",
    orange: "border-orange-200 bg-orange-100 text-orange-700",
    yellow: "border-yellow-200 bg-yellow-100 text-yellow-700",
    red: "border-red-200 bg-red-100 text-red-700",
  };

  const Icon = component.icon;

  return (
    <div
      ref={dragRef}
      className={`flex cursor-move items-center space-x-2 rounded-lg border p-2 text-sm font-medium transition ${
        colorClasses[component.color]
      } ${isDragging ? "opacity-50" : "hover:shadow-sm"}`}
    >
      <Icon className="h-4 w-4" />
      <span>{component.name}</span>
    </div>
  );
}

function WorkflowCanvas({
  workflow,
  onUpdate,
  onSelectNode,
  selectedNodeId,
}: {
  workflow: WorkflowState;
  onUpdate: Dispatch<SetStateAction<WorkflowState>>;
  onSelectNode: (nodeId: string | null) => void;
  selectedNodeId: string | null;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>(() => ({
    accept: "component",
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!offset || !rect) return;

      const position = {
        x: offset.x - rect.left,
        y: offset.y - rect.top,
      };

      onUpdate((prev) => ({
        ...prev,
        nodes: [
          ...prev.nodes,
          {
            id: generateId(),
            type: item.type,
            name: item.name,
            icon: item.icon,
            position,
            metadata: {},
          },
        ],
      }));
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  drop(canvasRef);

  const statusBadge = workflow.nodes.length
    ? "bg-green-500/10 text-green-600"
    : "bg-gray-100 text-gray-500";

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-3 text-xs text-gray-500">
        <div className={`rounded-full px-3 py-1 ${statusBadge}`}>{workflow.nodes.length} nodes configured</div>
        <div className="flex items-center space-x-1 rounded-full bg-blue-500/10 px-3 py-1 text-blue-600">
          <Zap className="h-3 w-3" />
          Live validation
        </div>
      </div>
      <div
        ref={canvasRef}
        className={`absolute inset-0 overflow-auto pt-10 ${isOver ? "bg-blue-50" : "bg-transparent"}`}
        style={{
          backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        onClick={() => onSelectNode(null)}
      >
        <div className="relative h-[1400px] w-[1400px]">
          <ConnectionsLayer workflow={workflow} />
          {workflow.nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={() => onSelectNode(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ConnectionsLayer({ workflow }: { workflow: WorkflowState }) {
  return (
    <svg className="pointer-events-none absolute inset-0" width="100%" height="100%">
      {workflow.connections.map((connection) => {
        const fromNode = workflow.nodes.find((node) => node.id === connection.from);
        const toNode = workflow.nodes.find((node) => node.id === connection.to);
        if (!fromNode || !toNode) return null;

        const startX = fromNode.position.x + 140;
        const startY = fromNode.position.y + 20;
        const endX = toNode.position.x;
        const endY = toNode.position.y + 20;
        const midX = (startX + endX) / 2;

        return (
          <g key={connection.id} className="text-blue-500">
            <path
              d={`M ${startX} ${startY} Q ${midX} ${startY - 40} ${endX} ${endY}`}
              strokeWidth={2}
              stroke="currentColor"
              fill="none"
            />
            {connection.label ? (
              <text x={midX} y={startY - 16} fill="#2563EB" className="text-[10px]">
                {connection.label}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function WorkflowNode({
  node,
  isSelected,
  onSelect,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const typeStyles: Record<ComponentCategory, string> = {
    trigger: "bg-blue-500",
    condition: "bg-orange-500",
    action: "bg-green-500",
    approval: "bg-purple-500",
  };

  const Icon = node.icon;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`absolute flex items-center space-x-2 rounded-xl px-4 py-3 text-left text-sm font-medium shadow-md transition ${
        isSelected ? "ring-2 ring-offset-2 ring-blue-400" : "hover:-translate-y-0.5"
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 200,
        backgroundColor: "white",
      }}
    >
      <span className={`rounded-lg ${typeStyles[node.type]} p-2 text-white`}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs uppercase text-gray-400">{node.type}</p>
        <p className="text-gray-900">{node.name}</p>
      </div>
    </button>
  );
}

function PropertiesPanel({
  selectedNode,
  onUpdateNode,
}: {
  selectedNode: WorkflowNode | undefined;
  onUpdateNode: (updates: NodeUpdate) => void;
}) {
  if (!selectedNode) {
    return (
      <div className="w-80 border-l border-gray-200 bg-white p-6">
        <div className="mt-10 flex h-full flex-col items-center justify-center text-center text-sm text-gray-500">
          <ShieldCheck className="mb-3 h-6 w-6 text-gray-300" />
          Select a node to configure its properties
        </div>
      </div>
    );
  }

  const fields = nodeFields[selectedNode.type];

  return (
    <div className="w-80 border-l border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-gray-400">Selected node</p>
          <h3 className="text-lg font-semibold text-gray-900">{selectedNode.name}</h3>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          {selectedNode.type}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Display name</label>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={selectedNode.name}
            onChange={(event) => onUpdateNode({ name: event.target.value })}
          />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase text-gray-400">Node metadata</p>
          <PropertiesList node={selectedNode} />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase text-gray-400">Configuration</p>
          {fields.map((field) => (
            <PropertyField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={String(selectedNode.metadata?.[field.key] ?? "")}
              type={field.type}
              onChange={(value) => onUpdateNode({ metadata: { [field.key]: value } })}
            />
          ))}
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
            <span>Execution readiness</span>
            <span className="font-semibold text-green-600">98%</span>
          </div>
          <div className="space-y-2 text-xs">
            <StatusRow label="Validations" status="All passing" tone="green" />
            <StatusRow label="Approvals" status="1 pending" tone="amber" />
            <StatusRow label="Testing" status="Last run 2m ago" tone="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertiesList({ node }: { node: WorkflowNode }) {
  const entries = Object.entries(node.metadata ?? {});

  if (!entries.length) {
    return <p className="mt-2 text-xs text-gray-500">No metadata yet.</p>;
  }

  return (
    <dl className="mt-2 space-y-1 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between text-gray-600">
          <dt className="uppercase text-[10px] text-gray-400">{key}</dt>
          <dd className="font-medium text-gray-800">{String(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function PropertyField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs text-gray-500">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
    </label>
  );
}

function StatusRow({
  label,
  status,
  tone,
}: {
  label: string;
  status: string;
  tone: "green" | "amber" | "blue";
}) {
  const toneMap: Record<"green" | "amber" | "blue", string> = {
    green: "text-green-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${toneMap[tone]}`}>{status}</span>
    </div>
  );
}
