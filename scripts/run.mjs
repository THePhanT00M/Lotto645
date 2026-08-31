/**
 * TypeScript 진단 스크립트 실행기
 *
 * 스크립트가 앱과 같은 `@/` 경로 별칭과 타입을 쓰므로, esbuild로 한 번 묶어
 * 임시 파일로 실행한다. 별도 러너를 의존성에 더하지 않으려는 목적이다.
 */
import { build } from "esbuild"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const entry = process.argv[2]

if (!entry) {
  console.error("실행할 스크립트를 지정해 주세요. 예: node scripts/run.mjs scripts/engine-backtest.ts")
  process.exit(1)
}

// Supabase 접속 정보를 읽는다. 없으면 스크립트가 알아서 알려 준다.
try {
  process.loadEnvFile(".env")
} catch {
  console.warn(".env를 찾지 못했습니다. 환경 변수가 이미 설정돼 있어야 합니다.")
}

const workDir = await mkdtemp(join(tmpdir(), "lotto-script-"))
const outfile = join(workDir, "bundle.mjs")

try {
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    alias: { "@": process.cwd() },
    logLevel: "error",
  })

  await import(pathToFileURL(outfile).href)
} finally {
  await rm(workDir, { recursive: true, force: true })
}
