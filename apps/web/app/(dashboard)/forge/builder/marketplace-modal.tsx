"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Search,
  Send,
  Shield,
  Sparkles,
  Star,
  Tag,
  Users,
} from "lucide-react";

import type { ForgeMarketplaceItem, MarketplaceReview, RatingSummary } from "./types";
import { useToast } from "../../../../hooks/use-toast";

interface MarketplaceCatalogResponse {
  items: ForgeMarketplaceItem[];
  stats: {
    total: number;
    filtered: number;
    categories: string[];
  };
  generatedAt: string;
}

interface MarketplaceRatingsResponse {
  app: {
    id: string;
    name: string;
    rating: number;
    totalReviews: number;
  };
  stats: RatingSummary;
  reviews: MarketplaceReview[];
  fetchedAt: string;
}

interface MarketplaceInstallResponse {
  installationId: string;
  status: string;
  appId: string;
  appName: string;
  environment: string;
  workspaceId: string;
  version: string;
  deploymentUrl?: string;
  requestedBy?: string;
  analytics: ForgeMarketplaceItem["app"]["analytics"];
  provisioning: {
    startedAt: string;
    completedAt: string;
    steps: { label: string; status: string }[];
  };
  timestamp: string;
}

export interface MarketplaceInstallSuccess {
  app: ForgeMarketplaceItem;
  installation: MarketplaceInstallResponse;
}

interface MarketplaceModalProps {
  onClose: () => void;
  onInstall: (payload: MarketplaceInstallSuccess) => void;
}

const environmentOptions = [
  { label: "Development", value: "development" },
  { label: "Staging", value: "staging" },
  { label: "Production", value: "production" },
];

const reviewDefaults = {
  rating: 5,
  title: "",
  feedback: "",
  persona: "",
  org: "",
  environment: "production" as const,
};

export function MarketplaceModal({ onInstall, onClose }: MarketplaceModalProps) {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<ForgeMarketplaceItem[]>([]);
  const [stats, setStats] = useState<MarketplaceCatalogResponse["stats"]>();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [ratingsSummary, setRatingsSummary] = useState<RatingSummary | null>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [installingAppId, setInstallingAppId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState(reviewDefaults);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [workspaceId, setWorkspaceId] = useState("oru-demo");
  const [environment, setEnvironment] = useState("development");
  const [requestedBy, setRequestedBy] = useState("builder@oru.cloud");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    async function fetchCatalog() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      try {
        const response = await fetch(`/api/forge/marketplace?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Unable to load marketplace");
        }
        const data: MarketplaceCatalogResponse = await response.json();
        if (cancelled) return;
        setCatalog(data.items);
        setStats(data.stats);
        if (!selectedAppId && data.items.length > 0) {
          setSelectedAppId(data.items[0].app.id);
        } else if (selectedAppId && !data.items.some((item) => item.app.id === selectedAppId)) {
          setSelectedAppId(data.items[0]?.app.id ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load marketplace");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCatalog();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, categoryFilter, refreshKey, selectedAppId]);

  useEffect(() => {
    if (!selectedAppId) {
      return;
    }

    let cancelled = false;
    async function fetchRatings() {
      setReviewsLoading(true);
      try {
        const response = await fetch(`/api/forge/marketplace/${selectedAppId}/ratings`);
        if (!response.ok) {
          throw new Error("Unable to load reviews");
        }
        const data: MarketplaceRatingsResponse = await response.json();
        if (cancelled) return;
        setReviews(data.reviews);
        setRatingsSummary(data.stats);
      } catch (err) {
        if (!cancelled) {
          setReviews([]);
          setRatingsSummary(null);
          toast({
            title: "Could not load reviews",
            description: err instanceof Error ? err.message : "Something went wrong",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) {
          setReviewsLoading(false);
        }
      }
    }

    fetchRatings();
    return () => {
      cancelled = true;
    };
  }, [selectedAppId, toast]);

  const selectedApp = useMemo(
    () => catalog.find((entry) => entry.app.id === selectedAppId) ?? null,
    [catalog, selectedAppId]
  );

  const installDisabled = !selectedApp || !workspaceId.trim();

  const handleInstall = async () => {
    if (!selectedApp || installDisabled) return;
    setInstallingAppId(selectedApp.app.id);
    try {
      const response = await fetch("/api/forge/marketplace/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: selectedApp.app.id,
          workspaceId: workspaceId.trim(),
          environment,
          requestedBy: requestedBy.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Install failed");
      }

      toast({
        title: `Installed ${selectedApp.app.name}`,
        description: `Deployment ready in ${environment} for ${workspaceId.trim()}`,
        variant: "success",
      });
      onInstall({ app: selectedApp, installation: data });
    } catch (err) {
      toast({
        title: "Install failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setInstallingAppId(null);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedApp) return;
    if (!reviewForm.title || !reviewForm.feedback || !reviewForm.persona || !reviewForm.org) {
      toast({
        title: "Add the missing details",
        description: "Title, feedback, persona, and organization are required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch(`/api/forge/marketplace/${selectedApp.app.id}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to submit review");
      }

      setReviews(data.reviews);
      setRatingsSummary(data.stats);
      setReviewForm(reviewDefaults);
      toast({
        title: "Review submitted",
        description: "Thanks for sharing feedback with the community",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="max-h-[95vh] w-[1200px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                Oru Forge Marketplace
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Build faster with battle-tested copilots
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Curated partner apps with telemetry, QA guardrails, and AI reviews.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <Sparkles className="h-3 w-3 text-purple-500" />
              {stats?.total ?? "―"} curated apps
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <Shield className="h-3 w-3 text-emerald-500" />
              SOC2 & GMP-ready deployments
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
              <Users className="h-3 w-3 text-indigo-500" />
              {stats?.filtered ?? "―"} matching results
            </span>
          </div>
        </header>

        <div className="flex border-b px-8 py-4">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by use-case, tag, or author"
              className="flex-1 text-sm outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="ml-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600"
          >
            <option value="all">All categories</option>
            {stats?.categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex h-[65vh]">
          <div className="w-[45%] border-r bg-slate-50/50">
            <div className="flex items-center justify-between px-6 py-3 text-xs text-slate-500">
              <span>{loading ? "Loading" : `${catalog.length} apps`}</span>
              <button
                onClick={() => setRefreshKey((key) => key + 1)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-slate-600 hover:bg-white"
              >
                <ChevronRight className="h-3 w-3" /> Refresh
              </button>
            </div>
            <div className="h-[calc(65vh-48px)] overflow-y-auto px-6 pb-6">
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              {loading ? (
                <div className="flex h-40 items-center justify-center text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : catalog.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
                  <Sparkles className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="font-medium text-slate-700">No apps match your filters</p>
                  <p className="text-sm text-slate-500">Try resetting search or category filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {catalog.map((item) => {
                    const isSelected = item.app.id === selectedAppId;
                    return (
                      <button
                        key={item.app.id}
                        onClick={() => setSelectedAppId(item.app.id)}
                        className={`w-full rounded-xl border p-4 text-left transition-shadow ${
                          isSelected
                            ? "border-indigo-300 bg-white shadow-lg shadow-indigo-100"
                            : "border-slate-200 bg-white hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.app.name}
                            </p>
                            <p className="text-xs text-slate-500">by {item.app.author.name}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-600">
                            {item.app.category}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {item.app.description}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {item.app.analytics.rating.toFixed(1)} ({item.app.analytics.reviews})
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="h-3 w-3 text-slate-400" />
                            {item.app.analytics.installations.toLocaleString()} installs
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500"
                            >
                              <Tag className="h-3 w-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6">
            {selectedApp ? (
              <div className="space-y-8">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                        <BadgeCheck className="h-3 w-3" /> Featured
                      </div>
                      <h3 className="mt-3 text-2xl font-bold text-slate-900">{selectedApp.app.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">{selectedApp.app.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-slate-500">Rating</p>
                      <p className="text-3xl font-semibold text-slate-900">
                        {selectedApp.app.analytics.rating.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedApp.app.analytics.reviews} reviews
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase text-slate-500">Installations</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {selectedApp.app.analytics.installations.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase text-slate-500">Active users</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        {selectedApp.app.analytics.activeUsers.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-3">
                      <p className="text-xs uppercase text-slate-500">Version</p>
                      <p className="mt-1 text-xl font-semibold text-slate-900">
                        v{selectedApp.app.version}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">Deploy to workspace</p>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <label className="text-xs font-medium text-slate-500">Workspace ID</label>
                        <input
                          value={workspaceId}
                          onChange={(event) => setWorkspaceId(event.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500">Environment</label>
                          <select
                            value={environment}
                            onChange={(event) => setEnvironment(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          >
                            {environmentOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500">Requested by</label>
                          <input
                            value={requestedBy}
                            onChange={(event) => setRequestedBy(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <button
                        disabled={installDisabled || installingAppId === selectedApp.app.id}
                        onClick={handleInstall}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {installingAppId === selectedApp.app.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {installingAppId === selectedApp.app.id ? "Installing" : "Install app"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">What you get</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600">
                      <li className="flex items-start gap-2">
                        <Sparkles className="mt-1 h-4 w-4 text-purple-500" />
                        Guided workflows ({selectedApp.app.workflows.length}) + AI insights
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="mt-1 h-4 w-4 text-emerald-500" />
                        Compliance-ready audit trails & access policies
                      </li>
                      <li className="flex items-start gap-2">
                        <Users className="mt-1 h-4 w-4 text-slate-500" />
                        {selectedApp.app.permissions.length} permission templates
                      </li>
                    </ul>
                    <div className="mt-3 text-xs text-slate-500">
                      Last updated {new Date(selectedApp.app.updatedAt).toLocaleDateString()}.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Workflows & data sources</p>
                    <span className="text-xs text-slate-500">{selectedApp.app.workflows.length} workflows</span>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Highlighted workflows</p>
                      <div className="mt-2 space-y-2 text-sm text-slate-600">
                        {selectedApp.app.workflows.slice(0, 3).map((workflow) => (
                          <div
                            key={workflow.id}
                            className="rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <p className="font-medium text-slate-900">{workflow.name}</p>
                            <p className="text-xs text-slate-500">Trigger: {workflow.trigger.type}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Data sources</p>
                      <div className="mt-2 space-y-2 text-sm text-slate-600">
                        {selectedApp.app.dataSources.slice(0, 3).map((source) => (
                          <div
                            key={source.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{source.name}</p>
                              <p className="text-xs text-slate-500 capitalize">{source.type}</p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] capitalize text-slate-600">
                              {source.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Reviews & ratings</p>
                      <p className="text-xs text-slate-500">
                        Crowd-sourced telemetry from regulated deployments
                      </p>
                    </div>
                    {ratingsSummary && (
                      <div className="text-right">
                        <p className="text-3xl font-bold text-slate-900">{ratingsSummary.average.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">
                          Based on {ratingsSummary.total} reviews
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Rating distribution</p>
                      <div className="mt-2 space-y-2 text-xs text-slate-500">
                        {([5, 4, 3, 2, 1] as const).map((rating) => {
                          const value = ratingsSummary?.distribution[String(rating) as keyof RatingSummary["distribution"]] ?? 0;
                          const percentage = ratingsSummary && ratingsSummary.total > 0
                            ? Math.round((value / ratingsSummary.total) * 100)
                            : 0;
                          return (
                            <div key={rating} className="flex items-center gap-2">
                              <span className="w-6">{rating}★</span>
                              <div className="flex-1 rounded-full bg-slate-100">
                                <div
                                  className="rounded-full bg-indigo-500 text-[0px]"
                                  style={{ width: `${percentage}%`, height: "6px" }}
                                />
                              </div>
                              <span className="w-10 text-right">{percentage}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-500">Share your experience</p>
                      <div className="mt-2 space-y-2 text-sm">
                        <select
                          value={reviewForm.rating}
                          onChange={(event) =>
                            setReviewForm((current) => ({
                              ...current,
                              rating: Number(event.target.value) as (typeof current.rating),
                            }))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        >
                          {[5, 4, 3, 2, 1].map((value) => (
                            <option key={value} value={value}>
                              {value} Star{value > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                        <input
                          value={reviewForm.title}
                          onChange={(event) =>
                            setReviewForm((current) => ({ ...current, title: event.target.value }))
                          }
                          placeholder="Headline"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <textarea
                          value={reviewForm.feedback}
                          onChange={(event) =>
                            setReviewForm((current) => ({ ...current, feedback: event.target.value }))
                          }
                          placeholder="What changed for your org?"
                          className="h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            value={reviewForm.persona}
                            onChange={(event) =>
                              setReviewForm((current) => ({ ...current, persona: event.target.value }))
                            }
                            placeholder="Role"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                          <input
                            value={reviewForm.org}
                            onChange={(event) =>
                              setReviewForm((current) => ({ ...current, org: event.target.value }))
                            }
                            placeholder="Organization"
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <button
                          onClick={handleReviewSubmit}
                          disabled={isSubmittingReview}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isSubmittingReview ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Submit review
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {reviewsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="h-4 w-4 animate-spin" /> Fetching latest reviews...
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                        Be the first to share how this copilot performs in production.
                      </div>
                    ) : (
                      reviews.slice(0, 4).map((review) => (
                        <div key={review.id} className="rounded-xl border border-slate-200 p-4 text-sm">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {review.persona} · {review.org}
                            </span>
                            <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-2 font-semibold text-slate-900">{review.title}</p>
                          <p className="mt-1 text-slate-600">{review.feedback}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                <ArrowLeft className="mb-3 h-8 w-8" />
                Select an app to view deployment details.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
