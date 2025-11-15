import { DecisionRegistryResponse, ExecutionProjectsResponse } from "./execution-types";
import type { PharmaValidationResponse } from "./pharma-types";
import type { ManufacturingShopfloorResponse } from "./manufacturing-types";
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
