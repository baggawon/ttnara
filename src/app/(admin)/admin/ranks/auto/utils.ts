type ProgressionType = "linear" | "convex" | "concave";

export const generatePoints = (
  maxRank: number,
  maxTradeCount: number,
  progressionType: ProgressionType,
  progressionRate: number,
  numPoints: number
) => {
  const points = [];
  const minTradeCount = Math.max(1, Math.floor(maxTradeCount * 0.01));

  for (let i = 0; i <= numPoints; i++) {
    let progress = i / numPoints;

    if (progressionType === "convex") {
      progress = Math.pow(progress, progressionRate);
    } else if (progressionType === "concave") {
      progress = Math.pow(progress, 1 / progressionRate);
    }

    const calculatedTradeCount = Math.round(maxTradeCount * progress);
    const tradeCount = Math.max(
      minTradeCount * (progress * maxRank),
      calculatedTradeCount
    );

    points.push({
      x: progress * maxRank,
      y: tradeCount,
    });
  }

  return points;
};
