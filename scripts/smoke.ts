/**
 * Production and staging smoke test runner.
 * Usage: npx tsx scripts/smoke.ts [baseUrl]
 * Example: npx tsx scripts/smoke.ts https://playtheory.vercel.app
 */

const baseUrl = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function runSmokeTests() {
  console.log(`\n🔍 Running PlayTheory smoke test against: ${baseUrl}\n`);
  let hasErrors = false;

  // 1. Check Root Homepage
  try {
    const homeRes = await fetch(`${baseUrl}/`);
    if (homeRes.ok) {
      console.log(`✅ [200] Homepage loaded (${homeRes.status} ${homeRes.statusText})`);
    } else {
      console.error(`❌ [${homeRes.status}] Homepage returned non-200`);
      hasErrors = true;
    }
  } catch (err: any) {
    console.error(`❌ Failed to connect to Homepage:`, err.message);
    hasErrors = true;
  }

  // 2. Check /api/health
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    if (healthRes.ok) {
      const data = await healthRes.json();
      console.log(`✅ [200] /api/health responded:`, JSON.stringify(data, null, 2));
      if (data.status !== "ok" && data.status !== "degraded") {
        console.warn(`⚠️ Unexpected health status: ${data.status}`);
      }
    } else {
      console.error(`❌ [${healthRes.status}] /api/health returned non-200`);
      hasErrors = true;
    }
  } catch (err: any) {
    console.error(`❌ Failed to connect to /api/health:`, err.message);
    hasErrors = true;
  }

  if (hasErrors) {
    console.error(`\n💥 Smoke test failed!\n`);
    process.exit(1);
  } else {
    console.log(`\n🎉 All smoke tests passed successfully!\n`);
  }
}

runSmokeTests().catch((err) => {
  console.error("Unhandled smoke test error:", err);
  process.exit(1);
});
