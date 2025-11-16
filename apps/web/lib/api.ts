import { DecisionRegistryResponse, ExecutionProjectsResponse } from "./execution-types";
import type { ManufacturingShopfloorResponse } from "./manufacturing-types";
import type { PharmaValidationResponse } from "./pharma-types";
import type { RetailOperationsResponse } from "./retail-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

const resolveUrl = (path: string) => {
  if (path.startsWith("http")) {
    return path;
  }

  if (API_BASE_URL && API_BASE_URL.length > 0) {
    try {
      return new URL(path, API_BASE_URL).toString();
    } catch {
      return path;
    }
  }

  return path;
};

async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const response = await fetch(resolveUrl(path), {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request to ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type LoginResponse = {
  success: boolean;
  token?: string;
  user?: {
    name: string;
    email: string;
    roles: string[];
  };
  message?: string;
  requiresMfa?: boolean;
};

export const login = (payload: LoginPayload) =>
  apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });

export const fetchExecutionProjects = () =>
  apiFetch<ExecutionProjectsResponse>("/api/execution/projects");

export const fetchDecisionRegistry = () =>
  apiFetch<DecisionRegistryResponse>("/api/execution/decisions");

export const fetchPharmaValidation = () =>
  apiFetch<PharmaValidationResponse>("/api/pharma/validation");

export const fetchManufacturingShopfloor = () =>
  apiFetch<ManufacturingShopfloorResponse>("/api/manufacturing/shopfloor");

export const fetchRetailOperations = () =>
  apiFetch<RetailOperationsResponse>("/api/retail/operations");

export type DocumentRecord = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  size: number;
  hash: string;
  storageUrl: string;
  uploadedBy: string;
  status: string;
  category?: string | null;
  tags?: string[] | null;
  aiExtracted?: {
    entities?: string[];
    summary?: string;
    sentiment?: string;
    keyPhrases?: string[];
  } | null;
  compliance?: {
    standards?: string[];
    violations?: string[];
    signature?: string;
    [key: string]: unknown;
  } | null;
  version: number;
  locked?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentFilters = {
  category?: string;
  status?: string;
  search?: string;
};

export const fetchDocuments = (filters: DocumentFilters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  const endpoint = query ? `/api/v1/documents?${query}` : "/api/v1/documents";

  return apiFetch<DocumentRecord[]>(endpoint);
};

export type DocumentUploadResponse = {
  document: DocumentRecord;
  aiAnalysis: Record<string, unknown>;
  compliance: Record<string, unknown>;
};

export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(resolveUrl("/api/v1/documents"), {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed with status ${response.status}`);
  }

  return response.json() as Promise<DocumentUploadResponse>;
};
