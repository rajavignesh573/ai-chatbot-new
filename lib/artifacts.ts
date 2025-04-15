import { strollerRecommendationsArtifact } from "@/components/stroller-recommendations-artifact";

export const artifacts = {
  stroller_recommendations: strollerRecommendationsArtifact,
};

export type ArtifactKind = keyof typeof artifacts; 