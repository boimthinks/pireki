import 'dotenv/config'
import { Client } from 'basic-ftp'
import { readdirSync, statSync, createReadStream } from 'fs'
import { join, relative } from 'path'

const {
  FTP_HOST,
  FTP_USER,
  FTP_PASS,
  FTP_PORT = '21',
  FTP_ROOT = '/',
  FTP_SECURE = 'true'
} = process.env

async function walk(dir, baseDir = dir) {
  const files = []
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      files.push(...await walk(full, baseDir))
    } else {
      const rel = relative(baseDir, full).replace(/\\/g, '/')
      files.push({ local: full, remote: (FTP_ROOT.replace(/\\/g, '/') + '/' + rel).replace(/\/+$/, '') })
    }
  }
  return files
}

async function deploy() {
  const client = new Client()
  client.ftp.verbose = true

  try {
    console.log('Connecting to FTP server...')
    const isSecure = FTP_SECURE === 'true' ? true : FTP_SECURE === 'implicit' ? 'implicit' : false
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASS,
      port: Number(FTP_PORT),
      secure: isSecure,
      ...(isSecure && {
        secureOptions: {
          rejectUnauthorized: false,
          checkServerIdentity: () => undefined
        }
      })
    })

    console.log('Uploading dist/ ...')
    const files = await walk('dist')
    for (const file of files) {
      const remoteDir = file.remote.split('/').slice(0, -1).join('/')
      await client.ensureDir(remoteDir)
      console.log(`  → ${file.remote}`)
      await client.uploadFrom(file.local, file.remote)
    }

    console.log('Deploy complete!')
  } catch (err) {
    console.error('Deploy failed:', err.message)
    process.exit(1)
  } finally {
    client.close()
  }
}

deploy()
