import { adsService } from "@/services/social/ads.service";
import { AdCampaignCreate } from "@/services/social/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdCampaigns = () => {
  return useQuery({
    queryKey: ["ad-campaigns"],
    queryFn: () => adsService.listCampaigns(),
  });
};

export const useCreateAdCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaign: AdCampaignCreate) =>
      adsService.createCampaign(campaign),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad-campaigns"] });
    },
  });
};
