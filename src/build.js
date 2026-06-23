import fs from 'fs'
import { execa } from 'execa'
import libqqwry from 'lib-qqwry'
import Decoder from '@ipdb/czdb'
import OpenCC from 'opencc-js'
import QQWryPacker from './packer.js'

const DOWNLOAD_TOKEN = process.env.DOWNLOAD_TOKEN
const CZDB_TOKEN = process.env.CZDB_TOKEN
const GIT_USERNAME = process.env.GIT_USERNAME
const GIT_EMAIL = process.env.GIT_EMAIL

const s2t = OpenCC.Converter({ from: 'cn', to: 'tw' })

// 把远端版本号(v20260520) 转成本地版本号格式(2026-05-20)
const normalizeRemoteVersion = (raw) => {
  const m = /^v?(\d{4})(\d{2})(\d{2})$/.exec(raw || '')
  if (!m) return null
  return `${m[1]}-${m[2]}-${m[3]}`
}

const readLocalVersion = () => {
  try {
    return fs.readFileSync('./version', 'utf-8').trim()
  } catch {
    return null
  }
}

// 先查询官方最新版本号，若与本地版本一致，则跳过下载
// 接口异常时返回 null，按原流程继续下载，避免阻塞每日更新
const checkRemoteVersion = async () => {
  try {
    const url = `https://cz88.net/api/communityIpVersions/getLatestVersion?key=${DOWNLOAD_TOKEN}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn(`Version API HTTP ${res.status}, fallback to download`)
      return null
    }
    const body = await res.json()
    if (body.code !== 200 || !body.data) {
      console.warn(`Version API unexpected payload: ${JSON.stringify(body)}, fallback to download`)
      return null
    }
    const remote = normalizeRemoteVersion(body.data)
    if (!remote) {
      console.warn(`Version API unrecognized format: ${body.data}, fallback to download`)
      return null
    }
    return remote
  } catch (err) {
    console.warn(`Version API error: ${err.message}, fallback to download`)
    return null
  }
}

const download = async () => {
  const url = `https://www.cz88.net/api/communityIpAuthorization/communityIpDbFile?fn=czdb&key=${DOWNLOAD_TOKEN}`
  await fs.promises.mkdir('./temp', { recursive: true })
  await execa('wget', ['-O', './temp/download.zip', url])
  // 解压
  await execa('unzip', ['./temp/download.zip', '-d', './temp'])
}

const extract = async () => {
  const records = []
  const decoder = new Decoder('./temp/cz88_public_v4.czdb', CZDB_TOKEN)
  decoder.dump(info => {
    const { startIp, endIp, regionInfo } = info
    // 过滤 IPv6
    if (startIp.includes(':')) {
      return
    }
    // 分离 geo, isp
    const [geo, isp] = regionInfo.split('\t', 2)
    records.push({ startIp, endIp, geo, isp })
  })

  await fs.promises.mkdir('./dist', { recursive: true })

  // 生成简体版
  const packerCN = new QQWryPacker()
  for (const { startIp, endIp, geo, isp } of records) {
    packerCN.insert(startIp, endIp, geo, isp)
  }
  fs.writeFileSync('./dist/qqwry.dat', packerCN.build())

  // 生成繁体版
  const packerTW = new QQWryPacker(text => s2t(text))
  for (const { startIp, endIp, geo, isp } of records) {
    packerTW.insert(startIp, endIp, geo, isp)
  }
  fs.writeFileSync('./dist/qqwry_zh-hant.dat', packerTW.build())
}

const parseQQwryInfo = async () => {
  const qqwry = libqqwry(true, './dist/qqwry.dat')

  const info = {
    count: 0,
    unique: 0,
  }
  
  const unique = new Set()

  let ip = '0.0.0.0'
  while (true) {
    let data = qqwry.searchIPScope(ip, ip)[0]
    // stat
    info.count += 1
    const hashkey = `${data.Country}${data.Area}`
    if (!unique.has(hashkey)) {
      info.unique += 1
      unique.add(hashkey)
    }
    if (data.endIP === '255.255.255.255') break
    ip = libqqwry.intToIP(data.endInt + 1)
  }

  return info
}

const readInfo = () => {
  const data = fs.readFileSync('./version.json', 'utf-8')
  return JSON.parse(data)
}

const parseQQWryVersion = () => {
  const qqwry = libqqwry(true, './dist/qqwry.dat')
  const info = qqwry.searchIP('255.255.255.255')
  return info.Area.match(/(\d+)/gi).join('-')
}

const release = async () => {
  const info = await readInfo()
  const currentVersion = parseQQWryVersion()
  if (info.latest === currentVersion || info.versions[currentVersion]) {
    console.log('No new version, skip')
    return
  }

  const currentInfo = await parseQQwryInfo()

  if (!info.versions[currentVersion]) {
    info.versions[currentVersion] = currentInfo
    if (info.latest < currentVersion) {
      info.latest = currentVersion
    }
    fs.writeFileSync('./version.json', JSON.stringify(info, null, 2))
    fs.writeFileSync('./version', info.latest)

    console.log({
      info,
      currentVersion,
      currentInfo
    })

//     await execa('gh', ['release', 'create', currentVersion, '-t', currentVersion, '-n', `#### czip db file info
// | Name               | Value                      |
// | :----------------: | :------------------------: |
// | Dat File Fast Download:     | https://raw.gitmirror.com/nmgliangwei/qqwry/main/qqwry.dat |
// <p align="right"><code>Version: ${currentVersion} </code></p>`, './qqwry.dat'])
//     await execa('git', ['config', 'user.name', GIT_USERNAME])
//     await execa('git', ['config', 'user.email', GIT_EMAIL])
//     await execa('git', ['add', './version.json'])
//     await execa('git', ['add', './version'])
//     await execa('git', ['add', './qqwry.dat'])
//     await execa('git', ['commit', '-m', `update db file in ${currentVersion}`])
//     await execa('git', ['push'])
  }

}

const main = async () => {
  // 0. 先比对版本号，若与本地一致则直接退出，避免每日重复下载
  const remoteVersion = await checkRemoteVersion()
  const localVersion = readLocalVersion()
  if (remoteVersion && localVersion && remoteVersion === localVersion) {
    console.log(`Remote version ${remoteVersion} equals local, skip build`)
    return
  }
  if (remoteVersion) {
    console.log(`Remote version: ${remoteVersion}, local version: ${localVersion}, continue`)
  }

  // 1. 下载 czdb 并解压
  await download()
  console.log('Downloaded')

  // 2. 反解压 czdb 并生成 qqwry.dat
  await extract()
  console.log('Extracted')

  // 3. 生成版本信息
  await release()
  console.log('Released')
}
main()
