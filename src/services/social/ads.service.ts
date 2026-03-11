import { api } from "@/src/services/api";
import type { AdCampaign, AdCampaignCreate } from "./types";

/**
 * POST /api/v1/ads/campaigns
 * GET  /api/v1/ads/campaigns
 * POST /api/v1/ads/impressions/{campaign_id}
 * POST /api/v1/ads/impressions/batch
 * POST /api/v1/ads/clicks/{campaign_id}
 *
 * Frontend flow after batch view logging:
 *   1. Call postsService.batchLogViews(postIds)
 *   2. Check which posts have is_sponsored=true → collect campaign_ids
 *   3. Call ads.batchLogImpressions(campaignIds) — deducts CPM/1000 per impression
 *   4. If user taps a sponsored post → call ads.logClick(campaignId)
 */
export const adsService = {
  /** POST /api/v1/ads/campaigns */
  createCampaign: async (payload: AdCampaignCreate): Promise<AdCampaign> => {
    const { data } = await api.post<AdCampaign>(
      "/api/v1/ads/campaigns",
      payload,
    );
    return data;
  },

  /** GET /api/v1/ads/campaigns — lists campaigns owned by current user */
  listCampaigns: async (): Promise<AdCampaign[]> => {
    const { data } = await api.get<AdCampaign[]>("/api/v1/ads/campaigns");
    return data;
  },

  /**
   * POST /api/v1/ads/impressions/{campaign_id}
   * Deducts CPM/1000 from remaining budget.
   * Campaign auto-pauses when budget hits 0.
   */
  logImpression: async (campaignId: string): Promise<void> => {
    await api.post(`/api/v1/ads/impressions/${campaignId}`);
  },

  /**
   * POST /api/v1/ads/impressions/batch
   * Send up to 50 campaign IDs at once.
   */
  batchLogImpressions: async (campaignIds: string[]): Promise<void> => {
    await api.post("/api/v1/ads/impressions/batch", {
      campaign_ids: campaignIds,
    });
  },

  /**
   * POST /api/v1/ads/clicks/{campaign_id}
   * Call when user taps a sponsored post. Used for CTR calculation.
   */
  logClick: async (campaignId: string): Promise<void> => {
    await api.post(`/api/v1/ads/clicks/${campaignId}`);
  },
};
