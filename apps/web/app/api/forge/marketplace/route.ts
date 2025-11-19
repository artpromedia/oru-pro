import { NextResponse } from "next/server";

import { marketplaceItems } from "@/app/(dashboard)/forge/builder/marketplace-data";
import { forgeMarketplaceItemSchema } from "@/app/(dashboard)/forge/builder/types";

import { getInstallationTotals, getReviewSummaries } from "./storage";

const baseCatalog = marketplaceItems.map((item) => forgeMarketplaceItemSchema.parse(item));

export async function GET(request: Request) {
  const [installationTotals, reviewSummaries] = await Promise.all([
    getInstallationTotals(),
    getReviewSummaries(),
  ]);

  const catalog = baseCatalog.map((entry) => structuredClone(entry));

  catalog.forEach((entry) => {
    const installsDelta = installationTotals[entry.app.id] ?? 0;
    const reviewSummary = reviewSummaries[entry.app.id];

    entry.app.analytics = {
      ...entry.app.analytics,
      installations: entry.app.analytics.installations + installsDelta,
      reviews: reviewSummary ? reviewSummary.total : entry.app.analytics.reviews,
      rating:
        reviewSummary && reviewSummary.total > 0
          ? reviewSummary.average
          : entry.app.analytics.rating,
    };
  });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();
  const category = searchParams.get("category")?.toLowerCase();
  const tags = searchParams.getAll("tag").map((tag) => tag.toLowerCase());

  const filtered = catalog.filter((entry) => {
    const matchesSearch = search
      ? [
          entry.app.name,
          entry.app.description,
          entry.tags.join(" "),
          entry.app.analytics.installations.toString(),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
      : true;

    const matchesCategory = category && category !== "all" ? entry.app.category === category : true;

    const matchesTags =
      tags.length > 0
        ? tags.every((tag) =>
            entry.tags.some((candidate) => candidate.toLowerCase().includes(tag)) ||
            entry.app.workflows.some((workflow) => workflow.name.toLowerCase().includes(tag))
          )
        : true;

    return matchesSearch && matchesCategory && matchesTags;
  });

  return NextResponse.json(
    {
      items: filtered,
      stats: {
        total: catalog.length,
        filtered: filtered.length,
        categories: [...new Set(catalog.map((item) => item.app.category))],
      },
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
