"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Download,
  Eye,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Lock,
  MoreVertical,
  Search,
  Share2,
  Upload,
} from "lucide-react";

import { fetchDocuments, uploadDocument, type DocumentRecord, type DocumentUploadResponse } from "@/lib/api";

const DOC_STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  draft: "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  processed: "bg-purple-100 text-purple-700",
  review: "bg-orange-100 text-orange-700",
};

const CATEGORY_OPTIONS = ["All Categories", "Quality", "Procurement", "Operations", "Compliance", "Logistics", "Finance", "Uncategorized"];
const STATUS_OPTIONS = ["All Statuses", "approved", "review", "processing", "pending", "draft", "processed"];
const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.ms-excel": [".xls", ".xlsx"],
  "application/msword": [".doc", ".docx"],
  "image/*": [".png", ".jpg", ".jpeg", ".gif"],
  "text/csv": [".csv"],
};

export default function DocumentManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(CATEGORY_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState(STATUS_OPTIONS[0]);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const normalizedCategory = categoryFilter === CATEGORY_OPTIONS[0] ? undefined : categoryFilter;
  const normalizedStatus = statusFilter === STATUS_OPTIONS[0] ? undefined : statusFilter;
  const queryClient = useQueryClient();

  const documentsQueryKey = useMemo(
    () => ["documents", { category: normalizedCategory, status: normalizedStatus, search: debouncedSearch }],
    [normalizedCategory, normalizedStatus, debouncedSearch],
  );

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () =>
      fetchDocuments({
        category: normalizedCategory,
        status: normalizedStatus,
        search: debouncedSearch || undefined,
      }),
    staleTime: 5_000,
  });

  const documents = documentsQuery.data ?? [];

  const uploadMutation = useMutation<DocumentUploadResponse, Error, File>({
    mutationFn: uploadDocument,
    onSuccess: () => {
      setUploadFeedback("Upload received — AI enrichment in progress.");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: Error) => {
      setUploadFeedback(error.message || "Upload failed");
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;
      setUploadFeedback(null);
      for (const file of acceptedFiles) {
        try {
          await uploadMutation.mutateAsync(file);
        } catch (error) {
          console.error("Upload failed", error);
        }
      }
    },
    [uploadMutation],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>
          <p className="text-gray-500">AI-powered document processing and compliance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="px-4 py-2 border rounded-lg"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-60"
            onClick={() => open()}
            disabled={uploadMutation.isPending}
          >
            <Upload className="inline w-4 h-4 mr-2" /> {uploadMutation.isPending ? "Uploading" : "Upload"}
          </button>
        </div>
      </header>

      {uploadFeedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            uploadFeedback.toLowerCase().includes("failed")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }`}
        >
          {uploadFeedback}
        </div>
      )}

      {documentsQuery.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load documents: {(documentsQuery.error as Error).message}
        </div>
      )}

      <section
        {...getRootProps()}
        className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition ${
          isDragActive ? "border-purple-600 bg-purple-50" : "border-gray-300 bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="font-medium text-gray-600">
            {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-sm text-gray-500">Supports PDF, Excel, Word, Images, CSV</p>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border rounded-lg"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {documentsQuery.isFetching && <span className="text-sm text-gray-500">Refreshing…</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Document</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Uploaded By</th>
                <th className="px-4 py-3 text-left">Size</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Compliance</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentsQuery.isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    Loading documents…
                  </td>
                </tr>
              )}
              {!documentsQuery.isLoading && documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-gray-500">
                    No documents match the current filters.
                  </td>
                </tr>
              )}
              {documents.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DocumentRow({ document }: { document: DocumentRecord }) {
  const [openMenu, setOpenMenu] = useState(false);
  const toggleMenu = () => setOpenMenu((prev) => !prev);
  const closeMenu = () => setOpenMenu(false);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {renderFileIcon(document.type)}
          <div>
            <p className="font-medium text-sm flex items-center gap-1">
              {document.name}
              {document.locked && <Lock className="w-3 h-3 text-gray-400" />}
            </p>
            <p className="text-xs text-gray-500">
              Version {document.version} • {formatTimestamp(document.createdAt)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">{document.category ?? "—"}</td>
      <td className="px-4 py-3 text-sm">
        <p>{document.uploadedBy}</p>
        <p className="text-xs text-gray-500">{formatTimestamp(document.updatedAt)}</p>
      </td>
      <td className="px-4 py-3 text-sm">{formatFileSize(document.size)}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 text-xs rounded ${DOC_STATUS_COLORS[document.status] ?? "bg-gray-100 text-gray-700"}`}>
          {document.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs space-y-1">
        {Array.isArray(document.compliance?.standards) && document.compliance?.standards?.length ? (
          document.compliance?.standards?.map((item) => (
            <div key={item} className="flex items-center gap-1 text-gray-600">
              <CheckCircle className="w-3 h-3 text-green-500" /> {item}
            </div>
          ))
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 relative">
          <IconButton icon={<Eye className="w-4 h-4" />} label="View" onClick={() => handlePreview(document.storageUrl)} />
          <IconButton icon={<Download className="w-4 h-4" />} label="Download" onClick={() => handleDownload(document.storageUrl)} />
          <IconButton icon={<Share2 className="w-4 h-4" />} label="Share" />
          <button onClick={toggleMenu} className="p-1 rounded hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          {openMenu && <DocumentMenu onClose={closeMenu} />}
        </div>
      </td>
    </tr>
  );
}

function DocumentMenu({ onClose }: { onClose: () => void }) {
  const items = [
    { label: "View Details", destructive: false },
    { label: "View History", destructive: false },
    { label: "Add Tags", destructive: false },
    { label: "Lock Document", destructive: false },
    { label: "Delete", destructive: true },
  ];

  return (
    <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg min-w-[160px] text-sm z-10">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={onClose}
          className={`w-full text-left px-4 py-2 transition ${
            item.destructive ? "text-red-600 hover:bg-red-50" : "hover:bg-gray-50"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function IconButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button className="p-1 rounded hover:bg-gray-100" aria-label={label} onClick={onClick} type="button">
      {icon}
    </button>
  );
}

function renderFileIcon(type: string) {
  const normalized = (type || "").toLowerCase();
  if (normalized.includes("pdf")) return <FileText className="w-5 h-5 text-red-500" />;
  if (normalized.includes("excel") || normalized.includes("spreadsheet")) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
  if (normalized.startsWith("image") || normalized.includes("png") || normalized.includes("jpg")) return <Image className="w-5 h-5 text-blue-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatFileSize(bytes?: number | string | null) {
  const value = typeof bytes === "string" ? Number(bytes) : bytes;
  if (!value || Number.isNaN(value)) return "0 Bytes";
  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${Math.round((value / Math.pow(1024, i)) * 100) / 100} ${units[i]}`;
}

function formatTimestamp(value?: string | Date | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function handlePreview(url?: string | null) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function handleDownload(url?: string | null) {
  if (!url) return;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.download = "";
  anchor.click();
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}
