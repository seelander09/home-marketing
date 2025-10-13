import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  console.log('🏗  Building Census ACS cache...')
  
  try {
    // Use ts-node to run the TypeScript file
    const tsNodePath = path.join(__dirname, '..', 'node_modules', '.bin', 'ts-node')
    const censusModulePath = path.join(__dirname, '..', 'lib', 'insights', 'census.ts')
    
    const process = spawn('node', ['--loader', 'ts-node/esm', censusModulePath], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    })
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Census cache build complete')
      } else {
        console.error('❌ Census cache build failed')
        process.exitCode = 1
      }
    })
    
  } catch (error) {
    console.error('❌ Census cache build failed:', error)
    process.exitCode = 1
  }
}

main()
