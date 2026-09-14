export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const { startMarketRefreshScheduler } = await import("@/infrastructure/jobs/scheduler");
  startMarketRefreshScheduler();
}
