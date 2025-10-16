import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type Task = {
  label: string
  command: string[]
  cwd?: string
}

type Directory = {
  label: string
  path: string
}

async function ensureDirectories(directories: Directory[]) {
  for (const dir of directories) {
    await fs.mkdir(dir.path, { recursive: true })
    console.log(`• Ensured ${dir.label} -> ${dir.path}`)
  }
}

function runTask(task: Task) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n▶ Running ${task.label}`)
    const child = spawn(task.command[0]!, task.command.slice(1), {
      stdio: 'inherit',
      cwd: task.cwd ?? path.resolve(__dirname, '..', '..')
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✓ Completed ${task.label}`)
        resolve()
      } else {
        reject(new Error(`${task.label} exited with code ${code}`))
      }
    })
  })
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..', '..')
  const tsxCli = path.resolve(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs')

  const directories: Directory[] = [
    {
      label: 'Redfin cache directory',
      path: process.env.REDFIN_CACHE_DIR ?? path.resolve(projectRoot, '..', 'redfin-data', 'cache')
    },
    {
      label: 'Census cache directory',
      path: path.resolve(projectRoot, '..', 'census-data', 'cache')
    },
    {
      label: 'HUD cache directory',
      path: path.resolve(projectRoot, '..', 'hud-data', 'cache')
    },
    {
      label: 'FRED cache directory',
      path: path.resolve(projectRoot, '..', 'fred-data', 'cache')
    }
  ]

  await ensureDirectories(directories)

  const tasks: Task[] = [
    {
      label: 'Redfin cache build',
      command: ['node', path.resolve(projectRoot, 'scripts', 'build-redfin-cache.mjs')]
    },
    {
      label: 'Census cache build',
      command: ['node', tsxCli, path.resolve(projectRoot, 'scripts', 'build-census-cache.ts')]
    },
    {
      label: 'HUD cache build',
      command: ['node', tsxCli, path.resolve(projectRoot, 'scripts', 'build-hud-cache.ts')]
    },
    {
      label: 'FRED cache build',
      command: ['node', tsxCli, path.resolve(projectRoot, 'scripts', 'build-fred-cache.ts')]
    }
  ]

  const failures: string[] = []

  for (const task of tasks) {
    try {
      await runTask(task)
    } catch (error) {
      failures.push(task.label)
      console.warn(`⚠️  ${task.label} failed: ${(error as Error).message}`)
    }
  }

  if (failures.length) {
    console.warn(
      `\n⚠️  Completed with ${failures.length} failure(s):${failures
        .map((label) => `\n  - ${label}`)
        .join('')}`
    )
  } else {
    console.log('\n✅ Market cache refresh completed without errors')
  }
}

void main()
