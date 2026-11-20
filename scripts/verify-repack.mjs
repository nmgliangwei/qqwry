// 验证脚本：用现有 dat 文件的全部记录喂 src/packer.js 重建，逐段对比内容等价性。
// 用途：packer 改动后的回归验证（记录区大小、段内容、lib-qqwry 读取兼容性）。
// 用法: node scripts/verify-repack.mjs [源dat文件]
import fs from 'fs'
import iconv from 'iconv-lite'
import libqqwry from 'lib-qqwry'
import QQWryPacker from '../src/packer.js'

const src = process.argv[2] || './qqwry.dat'
const isHant = src.includes('hant')

// ---------- 1. 解析源文件 ----------
const parseQQWry = (file) => {
  const buf = fs.readFileSync(file)
  const indexStart = buf.readUInt32LE(0)
  const indexEnd = buf.readUInt32LE(4)
  const readCString = (offset) => {
    let end = offset
    while (buf[end] !== 0) end++
    return iconv.decode(buf.subarray(offset, end), 'gbk')
  }
  const read3 = (p) => buf[p] | (buf[p + 1] << 8) | (buf[p + 2] << 16)
  const readArea = (p) => (buf[p] === 2 ? readCString(read3(p + 1)) : readCString(p))
  const readRecord = (offset) => {
    const endIP = buf.readUInt32LE(offset)
    let p = offset + 4
    let country, area
    const m1 = buf[p]
    if (m1 === 1) {
      const target = read3(p + 1)
      const t = buf[target]
      if (t === 2) {
        country = readCString(read3(target + 1))
        area = readArea(target + 4)
      } else {
        country = readCString(target)
        let e = target
        while (buf[e] !== 0) e++
        area = readArea(e + 1)
      }
    } else if (m1 === 2) {
      country = readCString(read3(p + 1))
      area = readArea(p + 4)
    } else {
      country = readCString(p)
      let e = p
      while (buf[e] !== 0) e++
      area = readArea(e + 1)
    }
    return { endIP, country, area }
  }
  const records = []
  for (let off = indexStart; off <= indexEnd; off += 7) {
    const startIP = buf.readUInt32LE(off)
    const { endIP, country, area } = readRecord(read3(off + 4))
    records.push({ startIP, endIP, country, area })
  }
  return { records, recordArea: indexStart - 8, fileSize: buf.length }
}

const intToIP = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.')

// ---------- 2. 新 packer 重建 ----------
const { records, recordArea: oldRecordArea, fileSize: oldSize } = parseQQWry(src)
console.log(`源文件: ${src}  记录数=${records.length} 记录区=${oldRecordArea} 总大小=${oldSize}`)

const packer = new QQWryPacker(null) // 数据源已是目标文本(简/繁)，无需再转换
for (const r of records) {
  packer.insert(intToIP(r.startIP), intToIP(r.endIP), r.country, r.area)
}
const outBuf = packer.build()
const outFile = `./temp/verify-${isHant ? 'hant' : 'cn'}.dat`
fs.mkdirSync('./temp', { recursive: true })
fs.writeFileSync(outFile, outBuf)

const newRecordArea = outBuf.readUInt32LE(0) - 8
console.log(`重建文件: ${outFile} 记录区=${newRecordArea} 总大小=${outBuf.length}`)
console.log(`记录区: ${oldRecordArea} -> ${newRecordArea} (省 ${oldRecordArea - newRecordArea} 字节, 距 16MB 上限余量 ${0x1000000 - newRecordArea})`)

// ---------- 3. 逐段对比内容等价 ----------
const parsed = parseQQWry(outFile)
if (parsed.records.length !== records.length) {
  console.error(`段数不一致: ${records.length} vs ${parsed.records.length}`)
  process.exit(1)
}
let mismatch = 0
for (let i = 0; i < records.length; i++) {
  const a = records[i]
  const b = parsed.records[i]
  if (a.startIP !== b.startIP || a.endIP !== b.endIP || a.country !== b.country || a.area !== b.area) {
    if (mismatch < 5) {
      console.error(`第 ${i} 段不一致:\n  旧: ${JSON.stringify(a)}\n  新: ${JSON.stringify(b)}`)
    }
    mismatch++
  }
}
console.log(mismatch === 0 ? '✓ 逐段对比: 全部 ' + records.length + ' 段 (startIP, endIP, country, area) 完全一致' : `✗ 不一致段数: ${mismatch}`)
if (mismatch > 0) process.exit(1)

// ---------- 4. lib-qqwry 第三方读取验证 ----------
const qqwry = libqqwry(true, outFile)
let count = 0
let ip = '0.0.0.0'
const last = qqwry.searchIPScope('255.255.255.255', '255.255.255.255')[0]
while (true) {
  const data = qqwry.searchIPScope(ip, ip)[0]
  count++
  if (data.endIP === '255.255.255.255') break
  ip = libqqwry.intToIP(data.endInt + 1)
}
const lastArea = last.Area
console.log(`✓ lib-qqwry 遍历: ${count} 段 (与源 ${records.length} ${count === records.length ? '一致' : '不一致!'})`)
console.log(`✓ lib-qqwry 版本号提取: ${lastArea.match(/(\d+)/gi)?.join('-')} (末段 Area: ${lastArea})`)
