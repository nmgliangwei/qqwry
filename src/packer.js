import iconv from 'iconv-lite'

class QQWryPacker {
  constructor(textConverter = null) {
    this.indexList = []      // IP索引区
    this.recordList = []     // 记录区
    this.ipTree = new Map()  // IP树
    this.stringCache = new Map() // 字符串缓存
    this.maxRecordOffset = 8
    this.textConverter = textConverter
  }

  _convertText(text) {
    return this.textConverter ? this.textConverter(text) : text
  }

  // 插入一条IP记录
  insert(startIP, endIP, country, area) {
    const startIPInt = this._ipToInt(startIP)
    const endIPInt = this._ipToInt(endIP)
    const geoOffset = this.maxRecordOffset
    this._createRecord(endIPInt, country, area || 'CZ88.NET')
    this.ipTree.set(startIPInt, { endIPInt, geoOffset })
  }

  // 生成最终的二进制文件
  build() {
    // 1. 构造数据区
    const recordBuffer = Buffer.concat(this.recordList)

    // 2. 构造索引区
    const sortedIPs = Array.from(this.ipTree.keys()).sort((a, b) => a - b)
    const indexList = []
    
    for (let i = 0; i < sortedIPs.length; i++) {
      // [startIP, nextOffset]
      const startIP = sortedIPs[i]
      const { geoOffset } = this.ipTree.get(startIP)
      const indexRecord = Buffer.alloc(7)
      indexRecord.writeUInt32LE(startIP, 0)
      if (geoOffset > 0xFFFFFF) {
        throw new Error(
          `Offset overflow: record area is ${8 + recordBuffer.length} bytes ` +
          `(${sortedIPs.length} IP entries), beyond the qqwry format's 3-byte ` +
          `offset limit of 16777215 bytes. The dataset no longer fits the qqwry.dat format.`
        )
      }
      indexRecord.writeUInt8((geoOffset >> 0) & 0xFF, 4)
      indexRecord.writeUInt8((geoOffset >> 8) & 0xFF, 5)
      indexRecord.writeUInt8((geoOffset >> 16) & 0xFF, 6)
      indexList.push(indexRecord)
    }

    // 3. 构造文件头
    const headerBuffer = Buffer.alloc(8)
    headerBuffer.writeUInt32LE(8 + recordBuffer.length, 0)
    headerBuffer.writeUInt32LE(8 + recordBuffer.length + sortedIPs.length * 7 - 7, 4)

    // 4. 合并所有部分
    return Buffer.concat([
      headerBuffer,  // 文件头
      recordBuffer,  // 记录区
      ...indexList // 索引区
    ])
  }

  _ipToInt(ip) {
    const parts = ip.split('.')
    // 使用无符号右移确保结果为正数
    return ((parseInt(parts[0]) << 24) |
      (parseInt(parts[1]) << 16) |
      (parseInt(parts[2]) << 8) |
      parseInt(parts[3])) >>> 0
  }

  // 0x01 + 3字节偏移：整条(country+area)重定向
  _redirectWhole(offset) {
    const buf = Buffer.alloc(4)
    buf.writeUInt8(0x01, 0)
    buf.writeUInt8((offset >> 0) & 0xFF, 1)
    buf.writeUInt8((offset >> 8) & 0xFF, 2)
    buf.writeUInt8((offset >> 16) & 0xFF, 3)
    return buf
  }

  // 0x02 + 3字节偏移：单字段重定向，目标处为纯字符串
  _redirectField(offset) {
    const buf = Buffer.alloc(4)
    buf.writeUInt8(0x02, 0)
    buf.writeUInt8((offset >> 0) & 0xFF, 1)
    buf.writeUInt8((offset >> 8) & 0xFF, 2)
    buf.writeUInt8((offset >> 16) & 0xFF, 3)
    return buf
  }

  // GBK字符串 + 0x00结尾
  _stringField(s) {
    return Buffer.concat([
      iconv.encode(s || '', 'gbk'),
      Buffer.from([0x00])
    ])
  }

  _createRecord(endIPInt, country, area) {
    country = this._convertText(country)
    area = this._convertText(area)
    const comboKey = `${country}\t${area}`

    // 写入 endIP
    const recordBuf = Buffer.alloc(4)
    recordBuf.writeUInt32LE(endIPInt, 0)
    this.recordList.push(recordBuf)
    this.maxRecordOffset += 4

    // 整条组合已缓存：4字节重定向指向首见记录的country字段
    const comboOffset = this.stringCache.get(comboKey)
    if (comboOffset !== undefined) {
      this.recordList.push(this._redirectWhole(comboOffset))
      this.maxRecordOffset += 4
      return
    }

    // country字段：已见则0x02重定向(4字节)，否则写字符串
    const countryOffset = this.stringCache.get(country)
    const countryBuf = countryOffset !== undefined
      ? this._redirectField(countryOffset)
      : this._stringField(country)
    const countryFieldOffset = this.maxRecordOffset

    // area字段：同上（字符串缓存country/area通用，同一字符串只落盘一次）
    const areaOffset = this.stringCache.get(area)
    const areaBuf = areaOffset !== undefined
      ? this._redirectField(areaOffset)
      : this._stringField(area)
    const areaFieldOffset = countryFieldOffset + countryBuf.length

    this.recordList.push(countryBuf)
    this.recordList.push(areaBuf)
    this.maxRecordOffset += countryBuf.length + areaBuf.length

    // 登记缓存：字符串位置(供0x02重定向)与组合位置(供0x01重定向)
    if (countryOffset === undefined) {
      this.stringCache.set(country, countryFieldOffset)
    }
    if (areaOffset === undefined) {
      this.stringCache.set(area, areaFieldOffset)
    }
    this.stringCache.set(comboKey, countryFieldOffset)
  }
}

export default QQWryPacker
