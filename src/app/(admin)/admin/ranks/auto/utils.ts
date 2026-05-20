type ProgressionType = "linear" | "convex" | "concave";

export const generatePoints = (
  maxRank: number,
  maxTradeCount: number,
  progressionType: ProgressionType,
  progressionRate: number,
  numPoints: number
) => {
  const points = [];

  for (let i = 0; i <= numPoints; i++) {
    const x = 1 + (i / numPoints) * (maxRank - 1);
    let progress = maxRank > 1 ? (x - 1) / (maxRank - 1) : 0;

    if (progressionType === "convex") {
      progress = Math.pow(progress, progressionRate);
    } else if (progressionType === "concave") {
      progress = 1 - Math.pow(1 - progress, progressionRate);
    }

    points.push({
      x,
      y: Math.round(maxTradeCount * progress),
    });
  }

  return points;
};
