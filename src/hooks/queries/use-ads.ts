import { adsService } from "@/src/services/social/ads.service";
import { AdCampaignCreate } from "@/src/services/social/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdCampaigns = () => {
  return useQuery({
    queryKey: ["ad-campaigns"],
    queryFn: () => adsService.getAdCampaigns(),
  });
};

export const useCreateAdCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaign: AdCampaignCreate) =>
      adsService.createAdCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
    },
  });
};

export const useDeleteAdCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: string) => adsService.deleteAdCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
    },
  });
};
