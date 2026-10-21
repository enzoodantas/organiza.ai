// Esboço puro de regras: nenhuma recompensa é persistida nesta sprint.
export interface RewardRule { event: "weekly_review" | "first_entry"; xp: number; coins: number }
export const rewardRules: readonly RewardRule[] = [{ event: "weekly_review", xp: 20, coins: 5 }, { event: "first_entry", xp: 10, coins: 2 }];
export function evaluateReward(event: RewardRule["event"], sourceId: string, rewardedKeys: readonly string[], rules = rewardRules) {
  const key = `${event}:${sourceId}`;
  if (rewardedKeys.includes(key)) return null;
  const rule = rules.find(r => r.event === event);
  return rule ? { key, xp: rule.xp, coins: rule.coins } : null;
}
