import { NextResponse } from "next/server";
import { z } from "zod";

import { marketplaceIndex } from "@/app/(dashboard)/forge/builder/marketplace-data";
import type { MarketplaceReview } from "@/app/(dashboard)/forge/builder/types";

import { appendReview, fetchReviews, summarizeReviews } from "../../storage";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(3),
  feedback: z.string().min(10),
  persona: z.string().min(2),
  org: z.string().min(2),
  environment: z.enum(["development", "staging", "production"]).default("production"),
  workspaceId: z.string().optional(),
});

export async function GET(
  _request: Request,
  context: { params: { appId: string } }
) {
  const { appId } = context.params;
  const marketplaceItem = marketplaceIndex.get(appId);

  if (!marketplaceItem) {
    return NextResponse.json({ error: "Marketplace app not found" }, { status: 404 });
  }

  const reviews = await fetchReviews(appId);
  const stats = summarizeReviews(reviews);

  return NextResponse.json({
    app: {
      id: marketplaceItem.app.id,
      name: marketplaceItem.app.name,
      rating: stats.total > 0 ? stats.average : marketplaceItem.app.analytics.rating,
      totalReviews: stats.total,
    },
    stats,
    reviews,
    fetchedAt: new Date().toISOString(),
  });
}

export async function POST(
  request: Request,
  context: { params: { appId: string } }
) {
  const { appId } = context.params;
  const marketplaceItem = marketplaceIndex.get(appId);

  if (!marketplaceItem) {
    return NextResponse.json({ error: "Marketplace app not found" }, { status: 404 });
  }

  const payload = reviewSchema.parse(await request.json());
  const review: MarketplaceReview = {
    id: `review-${Date.now()}`,
    appId,
    rating: payload.rating,
    title: payload.title,
    feedback: payload.feedback,
    persona: payload.persona,
    org: payload.org,
    environment: payload.environment,
    votes: { helpful: 0, notHelpful: 0 },
    createdAt: new Date().toISOString(),
  };

  const reviews = await appendReview(appId, review);
  const stats = summarizeReviews(reviews);
  const analytics = {
    ...marketplaceItem.app.analytics,
    reviews: stats.total,
    rating: stats.total > 0 ? stats.average : marketplaceItem.app.analytics.rating,
  };

  return NextResponse.json({
    review,
    stats,
    analytics,
    submittedAt: review.createdAt,
  });
}
