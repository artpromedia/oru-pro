"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Barcode,
  Brain,
  Calculator,
  Camera,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Layers,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Shield,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  Users
} from "lucide-react";

import { inventoryPayloadSchema } from "./types";
import type {
  ABCProgram,
  AccuracyTrend,
  BinStatus,
  CountBin,
  CountMode,
  DocumentType,
  DocumentStatus,
  InventoryDocument,
  MobileTask,
  VarianceInsight,
  WaveTask
} from "./types";


export default function PhysicalInventorySystem() {
  const [activeView, setActiveView] = useState<"documents" | "counting" | "analysis" | "control">("documents");
  const [documents, setDocuments] = useState<InventoryDocument[]>([]);
  const [waveTasks, setWaveTasks] = useState<WaveTask[]>([]);
  const [varianceInsights, setVarianceInsights] = useState<VarianceInsight[]>([]);
  const [accuracyTrend, setAccuracyTrend] = useState<AccuracyTrend[]>([]);
  const [abcPrograms, setAbcPrograms] = useState<ABCProgram[]>([]);
  const [mobileTasks, setMobileTasks] = useState<MobileTask[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("");
  const [countMode, setCountMode] = useState<CountMode>("scanner");
  const [search, setSearch] = useState("");
  const [countInput, setCountInput] = useState<string>("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/operations/physical-inventory", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to load inventory data (${response.status})`);
      }

      const payload = inventoryPayloadSchema.parse(await response.json());

      setDocuments(payload.documents);
      setWaveTasks(payload.waveTasks);
      setVarianceInsights(payload.varianceInsights);
      setAccuracyTrend(payload.accuracyTrend);
      setAbcPrograms(payload.abcPrograms);
      setMobileTasks(payload.mobileQueue);
      setSelectedDocumentId((prev) => {
        if (prev && payload.documents.some((doc) => doc.id === prev)) {
          return prev;
        }
        return payload.documents[0]?.id ?? "";
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load inventory data";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInventory();
  }, [fetchInventory]);

  const filteredDocuments = useMemo(() => {
    if (!search.trim()) return documents;
    return documents.filter((doc) => doc.number.toLowerCase().includes(search.toLowerCase()) || doc.storageLocation.toLowerCase().includes(search.toLowerCase()));
  }, [documents, search]);

  const selectedDocument = documents.find((doc) => doc.id === selectedDocumentId) ?? documents[0];
  const nextPendingBin = selectedDocument?.bins.find((bin) => bin.status !== "counted");

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold text-indigo-700">Loading physical inventory</p>
          <p className="text-xs text-slate-500">Syncing latest documents and variance intelligence…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="space-y-4 rounded-2xl bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-base font-semibold text-rose-600">Unable to load inventory data</p>
          <p className="text-sm text-slate-500">{error}</p>
          <button
            onClick={() => fetchInventory()}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Retry sync
          </button>
        </div>
      </div>
    );
  }

  const handleCreateDocument = (type: DocumentType, bins: string[]) => {
    const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `PI-${Date.now()}`;
    const newDoc: InventoryDocument = {
      id,
      number: `PI${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      type,
      status: "created",
      plant: "1000",
      storageLocation: bins[0]?.split("-")[0] ?? "FG01",
      controller: "AUTO",
      accuracy: 0,
      varianceValue: 0,
      progress: 0,
      scheduledDate: new Date().toISOString(),
      bins: bins.map((binCode, idx) => ({
        id: `${binCode}-${idx}`,
        bin: binCode,
        material: "TBD",
        description: "Awaiting pre-count",
        bookQty: 0,
        unit: "EA",
        countQty: null,
        variance: null,
        status: "pending"
      }))
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDocumentId(newDoc.id);
  };

  const handleCountSubmit = (quantity: number) => {
    if (!selectedDocument || !nextPendingBin) return;
    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== selectedDocument.id) return doc;
        const updatedBins = doc.bins.map((bin) => {
          if (bin.id !== nextPendingBin.id) return bin;
          const variance = quantity - bin.bookQty;
          const varianceRatio = bin.bookQty ? Math.abs(variance) / bin.bookQty : Math.abs(variance);
          const status: BinStatus = varianceRatio > 0.05 ? "recount" : "counted";
          return {
            ...bin,
            countQty: quantity,
            variance,
            status,
            requiresRecount: varianceRatio > 0.1,
            countedBy: "USER",
            countedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
        });
        const counted = updatedBins.filter((bin) => bin.countQty !== null).length;
        const totalVariance = updatedBins.reduce((sum, bin) => sum + Math.abs(bin.variance ?? 0), 0);
        const totalBook = updatedBins.reduce((sum, bin) => sum + bin.bookQty, 0) || 1;
        const accuracy = Math.max(0, 100 - (totalVariance / totalBook) * 100);
        return {
          ...doc,
          bins: updatedBins,
          progress: counted / (doc.bins.length || 1),
          accuracy,
          varianceValue: totalVariance,
          status: updatedBins.some((bin) => bin.status === "recount") ? "recount" : "counting"
        };
      })
    );
    setCountInput("");
  };

  const handlePostDifferences = (docId: string) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, status: "posted", progress: 1 } : doc)));
  };

  const handleReleaseDocument = (docId: string) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, status: "counting" } : doc)));
  };

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase text-indigo-600">
            <ClipboardCheck className="h-5 w-5" />
            LI01N • LI11N • LI14 • LI21
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Physical Inventory Command Center</h1>
          <p className="text-sm text-slate-500">Cycle counting, recount governance, and posting control with AI validation.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl bg-white px-4 py-2 shadow-sm">
            <label className="text-xs text-slate-500">Count mode</label>
            <select
              className="w-full text-sm font-semibold text-slate-900"
              value={countMode}
              onChange={(e) => setCountMode(e.target.value as CountMode)}
            >
              <option value="manual">Manual</option>
              <option value="scanner">Scanner</option>
              <option value="mobile">Mobile</option>
            </select>
          </div>
          <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm">
            <Upload className="h-4 w-4 text-slate-500" />
            Import counts (RFID)
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Document (LI01N)
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
        {[
          { id: "documents", label: "Inventory Docs", icon: FileText, caption: "LX22 replacement" },
          { id: "counting", label: "Counting Workspace", icon: Barcode, caption: "LI11N entry" },
          { id: "analysis", label: "Variance Intelligence", icon: TrendingUp, caption: "LI20 insights" },
          { id: "control", label: "Cycle / ABC Setup", icon: Calculator, caption: "LM07 automation" }
        ].map((tab) => {
          const isActive = activeView === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as typeof activeView)}
              className={`flex flex-1 items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                isActive ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </span>
              <span className={`text-xs ${isActive ? "text-indigo-200" : "text-slate-400"}`}>{tab.caption}</span>
            </button>
          );
        })}
      </nav>

      {activeView === "documents" && (
        <DocumentsBoard
          documents={filteredDocuments}
          search={search}
          onSearch={setSearch}
          onSelect={(id) => setSelectedDocumentId(id)}
          onRelease={handleReleaseDocument}
          onPost={handlePostDifferences}
        />
      )}

      {activeView === "counting" && selectedDocument && (
        <CountingWorkspace
          document={selectedDocument}
          countMode={countMode}
          nextBin={nextPendingBin}
          countInput={countInput}
          setCountInput={setCountInput}
          onSubmit={(qty) => handleCountSubmit(qty)}
          mobileTasks={mobileTasks}
        />
      )}

      {activeView === "analysis" && (
        <AnalysisWorkspace accuracyTrend={accuracyTrend} varianceInsights={varianceInsights} waveTasks={waveTasks} documents={documents} />
      )}

  {activeView === "control" && <ControlWorkspace abcPrograms={abcPrograms} mobileTasks={mobileTasks} />}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 p-6"
      >
        <div className="flex flex-wrap items-start gap-4">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <Brain className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">AI Inventory Intelligence</h3>
            <p className="mt-1 text-sm text-slate-600">Real-time insights from cycle counting operations across all plants</p>
            <div className="mt-4 grid gap-4 text-sm text-slate-600 md:grid-cols-2">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>47 duplicate bins merged via computer vision</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>Cycle cadence optimized: 32% faster coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                  <span>Variance cluster detected in Zone 300-A</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                  <span>RFID upgrade ROI &lt; 6 months for A-items</span>
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                  <span>Auto-create LI14 recounts for ±5% deviations</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                  <span>Accuracy trending to 98.8% with AI validation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      {showCreateModal && (
        <CreateDocumentDialog
          onClose={() => setShowCreateModal(false)}
          onCreate={(type, bins) => {
            handleCreateDocument(type, bins);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function DocumentsBoard({
  documents,
  search,
  onSearch,
  onSelect,
  onRelease,
  onPost
}: {
  documents: InventoryDocument[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
  onRelease: (id: string) => void;
  onPost: (id: string) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Filter documents, plants, or bins"
            className="flex-1 text-sm text-slate-700 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Aging alerts · 5</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Recounts queued · 12</span>
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Posted today · 8</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-base font-semibold text-slate-900">Inventory Documents (Replacing LX22)</h2>
          <p className="text-xs text-slate-500">Complete visibility across all physical count operations</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Document</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-center">Items</th>
              <th className="px-4 py-3 text-center">Progress</th>
              <th className="px-4 py-3 text-center">Accuracy</th>
              <th className="px-4 py-3 text-center">Variance</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  <ClipboardCheck className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="text-sm font-medium">No inventory documents found</p>
                  <p className="text-xs">Create a new count document to get started</p>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{doc.number}</div>
                    <div className="text-xs text-slate-500">
                      {doc.type.toUpperCase()} • Controller {doc.controller}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {doc.plant}/{doc.storageLocation}
                    <div className="text-xs text-slate-500">
                      {new Date(doc.scheduledDate).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-slate-900">{doc.bins.length}</span>
                    <div className="text-xs text-slate-500">bins</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ProgressBar value={Math.round(doc.progress * 100)} />
                    <span className="text-xs text-slate-500">{Math.round(doc.progress * 100)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {doc.accuracy ? (
                      <span className={`font-semibold ${
                        doc.accuracy >= 98 ? 'text-green-600' :
                        doc.accuracy >= 95 ? 'text-amber-600' :
                        'text-rose-600'
                      }`}>
                        {doc.accuracy.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-rose-600">${doc.varianceValue.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onSelect(doc.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Open
                      </button>
                      {doc.status === "created" && (
                        <button
                          onClick={() => onRelease(doc.id)}
                          className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          Release
                        </button>
                      )}
                      {doc.status === "recount" && (
                        <button className="rounded-lg border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">
                          LI14 Recount
                        </button>
                      )}
                      {doc.status === "counting" && (
                        <button
                          onClick={() => onPost(doc.id)}
                          className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Post LI21
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CountingWorkspace({
  document,
  countMode,
  nextBin,
  countInput,
  setCountInput,
  onSubmit,
  mobileTasks
}: {
  document: InventoryDocument;
  countMode: CountMode;
  nextBin?: CountBin;
  countInput: string;
  setCountInput: (value: string) => void;
  onSubmit: (qty: number) => void;
  mobileTasks: MobileTask[];
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Count Entry • {document.number}</h2>
            <p className="text-xs text-slate-500">
              {document.bins.length} bins • {Math.round(document.progress * 100)}% complete
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">{countMode.toUpperCase()} MODE</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{document.status.toUpperCase()}</span>
          </div>
        </header>

        {countMode === "scanner" && (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
            <QrCode className="h-8 w-8 animate-pulse text-indigo-600" />
            <div className="flex-1">
              <p className="font-semibold text-indigo-900">Scanner Mode Active</p>
              <p className="text-xs text-indigo-700">Scan bin barcode to begin counting • Auto-load material + book quantity</p>
            </div>
            <div className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm">
              Ready
            </div>
          </div>
        )}

        {countMode === "mobile" && (
          <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-4">
            <Smartphone className="h-8 w-8 text-green-600" />
            <div className="flex-1">
              <p className="font-semibold text-green-900">Mobile Sync Active</p>
              <p className="text-xs text-green-700">Connected to Zebra TC52 • Real-time sync enabled</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-green-600 shadow-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              Live
            </div>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-semibold text-slate-500">Bin queue</p>
            <div className="mt-3 space-y-2 text-sm">
              {document.bins.slice(0, 4).map((bin) => (
                <div key={bin.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="font-semibold text-slate-800">{bin.bin}</span>
                  <StatusPill status={bin.status} />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 p-4 lg:col-span-2">
            <p className="text-xs font-semibold text-slate-500">Count entry (LI11N)</p>
            {nextBin ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{nextBin.material}</p>
                    <p className="text-xs text-slate-500">{nextBin.description}</p>
                    {nextBin.batch && <p className="text-xs text-slate-400">Batch: {nextBin.batch}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Book qty</div>
                    <div className="text-lg font-bold text-slate-900">{nextBin.bookQty} {nextBin.unit}</div>
                  </div>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Bin Location</label>
                    <input
                      value={nextBin.bin}
                      disabled
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500">Count quantity *</label>
                    <div className="flex gap-2">
                      <input
                        value={countInput}
                        onChange={(e) => setCountInput(e.target.value)}
                        placeholder="Enter count"
                        type="number"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900"
                        autoFocus
                      />
                      {countMode === "manual" && (
                        <button className="rounded-lg border border-slate-200 px-3 hover:bg-slate-50">
                          <Camera className="h-4 w-4 text-slate-600" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {countInput && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Variance:</span>
                      <span className={`font-bold ${
                        Number(countInput) === nextBin.bookQty ? 'text-green-600' :
                        Math.abs(Number(countInput) - nextBin.bookQty) > nextBin.bookQty * 0.05 ? 'text-rose-600' :
                        'text-amber-600'
                      }`}>
                        {Number(countInput) - nextBin.bookQty > 0 ? '+' : ''}{Number(countInput) - nextBin.bookQty} {nextBin.unit}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-100 pt-3 text-xs">
                  <button className="text-slate-500 hover:text-slate-700">Skip bin</button>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 hover:bg-amber-100">
                      Flag for Recount
                    </button>
                    <button
                      onClick={() => countInput && onSubmit(Number(countInput))}
                      disabled={!countInput}
                      className="rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Save & Next
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                All bins counted for this document.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Smartphone className="h-4 w-4 text-indigo-600" />
            Mobile mission control
          </h3>
          <p className="mt-1 text-xs text-slate-500">Syncs instantly with Zebra scanners + iOS/Android.</p>
          <div className="mt-4 space-y-3 text-sm">
            {mobileTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{task.bin}</span>
                  <span className={`rounded-full px-2 py-0.5 ${priorityClasses(task.priority)}`}>{task.priority}</span>
                </div>
                <p className="text-xs text-slate-500">{task.material}</p>
                <p className="text-xs text-slate-600">{task.instructions}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">AI Assistant</h3>
          <div className="mt-3 space-y-3 text-sm">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Camera className="h-4 w-4 text-indigo-600" />
                Visual count available
              </div>
              <p className="text-xs text-slate-500">Computer vision estimates 474 units. Confidence 93%.</p>
              <button className="text-xs font-semibold text-indigo-600">Apply AI value</button>
            </div>

            {nextBin && (
              <div className="rounded-xl border border-slate-100 p-3">
                <h4 className="mb-2 text-xs font-semibold text-slate-700">Historical Accuracy</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">This bin:</span>
                    <span className="font-medium text-slate-900">99.2%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">This material:</span>
                    <span className="font-medium text-slate-900">97.8%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Common variance:</span>
                    <span className="font-medium text-slate-900">-2 to +1 {nextBin.unit}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Last count:</span>
                    <span className="font-medium text-slate-900">3 days ago</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-100 p-3">
              <div className="flex items-center gap-2 text-slate-700">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Variance playbook
              </div>
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                <li>• Inspect pallet corner for loose cases</li>
                <li>• Validate returns cage postings</li>
                <li>• Confirm batch closure before variance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalysisWorkspace({
  accuracyTrend,
  varianceInsights,
  waveTasks,
  documents
}: {
  accuracyTrend: AccuracyTrend[];
  varianceInsights: VarianceInsight[];
  waveTasks: WaveTask[];
  documents: InventoryDocument[];
}) {
  const posted = documents.filter((doc) => doc.status === "posted").length;
  const recounts = documents.filter((doc) => doc.status === "recount").length;

  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard icon={TrendingUp} label="Accuracy" value="98.6%" subtext="↑ 1.2% vs last month" tone="success" />
          <SummaryCard icon={TrendingDown} label="Variance value" value="$14.9K" subtext="↓ 32% vs last wave" tone="warning" />
          <SummaryCard icon={CheckCircle} label="Posted today" value={posted} subtext="LI21 documents" />
          <SummaryCard icon={AlertTriangle} label="Recounts" value={recounts} subtext="Awaiting LI14" tone="warning" />
        </div>

        <div className="rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Accuracy trend</h3>
            <button className="text-xs text-slate-500">Export</button>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-3 text-center">
            {accuracyTrend.map((point) => (
              <div key={point.month} className="space-y-1">
                <div className="rounded-full bg-indigo-50 py-3 text-indigo-700">{point.value}%</div>
                <p className="text-xs text-slate-500">{point.month}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Variance reason codes</h3>
            <RefreshCw className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-4 space-y-3">
            {varianceInsights.map((variance) => (
              <div key={variance.reason} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{variance.reason}</p>
                  <p className="text-xs text-slate-500">{variance.count} occurrences</p>
                </div>
                <span className={`text-sm font-semibold ${variance.severity === "high" ? "text-rose-600" : variance.severity === "medium" ? "text-amber-600" : "text-slate-500"}`}>
                  ${variance.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Wave timeline</h3>
          <div className="mt-3 space-y-3 text-sm">
            {waveTasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{task.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${waveStatusClasses(task.status)}`}>{task.status}</span>
                </div>
                <p className="text-xs text-slate-500">{task.location}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{task.bins} bins</span>
                  <span>{task.owner}</span>
                  <span>{task.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Exception heat-map</h3>
          <p className="text-xs text-slate-500">Top zones by value variance</p>
          <div className="mt-4 space-y-2 text-xs">
            {["Zone 300-A", "Cooler 02", "Dock Returns", "Raw RM-5"].map((zone, idx) => (
              <div key={zone} className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{zone}</span>
                <div className="w-2/3 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-rose-500" style={{ width: `${70 - idx * 12}%` }} />
                </div>
                <span className="text-rose-600">${(9000 - idx * 1800).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ControlWorkspace({ abcPrograms, mobileTasks }: { abcPrograms: ABCProgram[]; mobileTasks: MobileTask[] }) {
  return (
    <section className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-900">Cycle program orchestration</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {abcPrograms.map((program) => (
            <div key={program.bucket} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">{program.bucket}</span>
                <Layers className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-xs text-slate-500">Volume {program.volume}</p>
              <p className="text-sm font-semibold text-slate-800">{program.frequency}</p>
              <p className="text-xs text-slate-500">Coverage {program.coverage}%</p>
              <button className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">Adjust cadence</button>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-100 p-5">
          <h4 className="text-sm font-semibold text-slate-900">Automation policies</h4>
          <div className="mt-4 space-y-3 text-sm">
            {[
              { label: "Auto-schedule recount when variance > 5%", enabled: true },
              { label: "Push LI11N tasks to mobile when scanner idle", enabled: true },
              { label: "Require photo evidence for A-class variances", enabled: false }
            ].map((policy) => (
              <div key={policy.label} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                <span className="text-slate-700">{policy.label}</span>
                <span className={`text-xs font-semibold ${policy.enabled ? "text-emerald-600" : "text-slate-400"}`}>
                  {policy.enabled ? "ENABLED" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900">Resource readiness</h4>
          <div className="mt-3 space-y-2 text-sm">
            <ResourceRow icon={Users} label="Counters on shift" value="18" trend="+3" />
            <ResourceRow icon={Truck} label="Movements paused" value="6" trend="Hold" />
            <ResourceRow icon={Shield} label="QA approvals" value="4" trend="Awaiting" />
            <ResourceRow icon={Activity} label="Scanners online" value="12/14" trend="Online" />
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold text-slate-900">Mobile readiness checklist</h4>
          <div className="mt-3 space-y-3 text-sm">
            {mobileTasks.slice(0, 2).map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-semibold text-slate-500">{task.id}</p>
                <p className="text-sm font-semibold text-slate-900">{task.bin}</p>
                <p className="text-xs text-slate-500">{task.instructions}</p>
              </div>
            ))}
            <button className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">Manage handheld fleet</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CreateDocumentDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (type: DocumentType, bins: string[]) => void }) {
  const [type, setType] = useState<DocumentType>("cycle");
  const [bins, setBins] = useState("300-A-01,300-A-02");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Create inventory document</h3>
          <button onClick={onClose} className="text-slate-400">✕</button>
        </div>
        <div className="space-y-4 p-5 text-sm">
          <div>
            <label className="text-xs font-semibold text-slate-600">Document type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              <option value="cycle">Cycle count</option>
              <option value="annual">Annual</option>
              <option value="spot">Spot check</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Bin list (comma separated)</label>
            <textarea
              value={bins}
              onChange={(e) => setBins(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </div>
          <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            System will auto-reserve bins, suspend movements, and notify assigned counters.
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-4">
          <button onClick={onClose} className="text-sm font-semibold text-slate-500">Cancel</button>
          <button
            onClick={() => onCreate(type, bins.split(",").map((bin) => bin.trim()).filter(Boolean))}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, subtext, tone }: { icon: typeof Activity; label: string; value: string | number; subtext?: string; tone?: "success" | "warning" }) {
  const colors = tone === "success" ? "text-emerald-600" : tone === "warning" ? "text-amber-600" : "text-indigo-600";
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <Icon className={`h-5 w-5 ${colors}`} />
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mb-1 h-2 w-full rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${value}%` }} />
    </div>
  );
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const map: Record<DocumentStatus, string> = {
    created: "bg-slate-100 text-slate-600",
    released: "bg-blue-100 text-blue-700",
    counting: "bg-amber-100 text-amber-700",
    recount: "bg-rose-100 text-rose-700",
    posted: "bg-emerald-100 text-emerald-700"
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>{status}</span>;
}

function StatusPill({ status }: { status: BinStatus }) {
  const map: Record<BinStatus, string> = {
    pending: "bg-slate-100 text-slate-600",
    counted: "bg-emerald-100 text-emerald-700",
    recount: "bg-amber-100 text-amber-700"
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[status]}`}>{status}</span>;
}

function waveStatusClasses(status: WaveTask["status"]) {
  switch (status) {
    case "counting":
      return "bg-amber-100 text-amber-700";
    case "precheck":
      return "bg-slate-100 text-slate-600";
    case "recount":
      return "bg-rose-100 text-rose-700";
    case "posted":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function priorityClasses(priority: MobileTask["priority"]) {
  switch (priority) {
    case "high":
      return "bg-rose-50 text-rose-600";
    case "medium":
      return "bg-amber-50 text-amber-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function ResourceRow({ icon: Icon, label, value, trend }: { icon: typeof Users; label: string; value: string; trend: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <div className="text-right text-sm font-semibold text-slate-900">
        {value}
        <div className="text-xs text-slate-500">{trend}</div>
      </div>
    </div>
  );
}
