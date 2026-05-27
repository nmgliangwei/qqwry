/**
 * lib-qqwry
 * @module lib-qqwry
 */

'use strict';
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var GBK_decode = require('gbk.js').decode;
var dataCmd = require('./dataCmd');
var getFormatfn = require('./format');
var fileCmd = dataCmd.fileCmd,
	bufferCmd = dataCmd.bufferCmd;

var IP_RECORD_LENGTH = 7,
	REDIRECT_MODE_1 = 1,
	REDIRECT_MODE_2 = 2,
	IP_REGEXP = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;

var pathDefined = path.join(__dirname, '../data/qqwry.dat'); //IP库默认路径
var dbug = false;

var unArea = '',
	unCountry = '';

// console.log(Buffer.alloc);
if (!Buffer.alloc) {
	Buffer.alloc = function(a, b, c) {
		return new Buffer(a, b, c);
	};
}

//封装,方便使用
function pack() {
	var self = this;
	function IP(ip) {
		switch (arguments.length) {
			case 0:
				return self.searchIP('255.255.255.255');
			case 1:
				return self.searchIP(ip);
			case 2:
			default:
				return self.searchIPScope.apply(self, arguments);
		}
	}
	IP._lib = self;
	Object.keys(QqwryDriver.prototype).forEach(function(key) {
		if (typeof self[key] == 'function') {
			IP[key] = self[key].bind(self);
		}
	});
	return IP;
}
/**
 * ip库查询类
 * @class QqwryDriver
 * @param {boolean} speed 开启极速模式
 * @param {string} dataPath IP库路径
 */
function QqwryDriver(speed, dataPath) {
	if (!(this instanceof QqwryDriver)) {
		return new QqwryDriver(speed, dataPath);
	}
	var isspeed;
	if (typeof speed == 'string') {
		this.dataPath = speed || pathDefined;
		isspeed = !!dataPath;
	} else {
		isspeed = !!speed;
		this.dataPath = dataPath || pathDefined;
	}
	if (isspeed) {
		this.speed();
	} else {
		this.unSpeed();
	}
	var cmd = this.cmd();
	this.ipBegin = cmd.readUIntLE(0, 4);
	this.ipEnd = cmd.readUIntLE(4, 4);
	cmd.close();
	return pack.call(this);
}

/**
 * 极速模式
 */
QqwryDriver.prototype.speed = function() {
	if (this.cmd && this.cmd.name == 'bufferCmd') return this;
	// if (this.cmd) this.cmd.close();
	this.cmd = bufferCmd(this.dataPath);
	return this;
};

/**
 * 关闭极速模式
 */
QqwryDriver.prototype.unSpeed = function() {
	if (this.cmd && this.cmd.name == 'fileCmd') return this;
	// if (this.cmd) this.cmd.close();
	this.cmd = fileCmd(this.dataPath);
	return this;
};

/**
 * 单IP查询
 * @param {number|string} IP IP地址
 * @return {object}
 */
QqwryDriver.prototype.searchIP = function(IP) {
	var cmd = this.cmd();
	var lib = getLib(this, cmd);
	var ip = ipToInt(IP),
		g = LocateIP.call(lib, ip),
		loc = {};
	if (g == -1) {
		return { int: ip, ip: intToIP(ip), Country: unArea, Area: unCountry };
	}
	var add = setIPLocation.call(cmd, g);
	loc.int = ip;
	loc.ip = intToIP(ip);
	loc.Country = add.Country;
	loc.Area = add.Area;
	// closeData.call(this);
	cmd.close();
	dbug && log(loc);
	return loc;
};

/**
 * IP段查询
 * @param {number|string} bginIP 起始IP
 * @param {number|string} endIP 结束IP
 * @param {function} [callback] 回调函数,没有回调函数择执行同步查询
 * @return {object[]}
 */
QqwryDriver.prototype.searchIPScope = function(bginIP, endIP, callback) {
	var self = this;
	if (typeof callback === 'function') {
		return process.nextTick(function() {
			try {
				callback(null, self.searchIPScope(bginIP, endIP));
			} catch (e) {
				callback(e);
			}
		});
	}
	var cmd = self.cmd();
	var lib = getLib(self, cmd);
	// cmd.open();
	var _ip1, _ip2, b_g, e_g;
	var ips = [];
	_ip1 = ipToInt(bginIP);
	_ip2 = ipToInt(endIP);
	b_g = LocateIP.call(lib, _ip1);
	e_g = LocateIP.call(lib, _ip2);
	for (var i = b_g; i <= e_g; i += IP_RECORD_LENGTH) {
		var loc = {},
			add = setIPLocation.call(cmd, i);
		loc.begInt = cmd.readUIntLE(i, 4);
		loc.endInt = cmd.readUIntLE(cmd.readUIntLE(i + 4, 3), 4);
		loc.begIP = intToIP(loc.begInt);
		loc.endIP = intToIP(loc.endInt);
		loc.Country = add.Country;
		loc.Area = add.Area;
		ips.push(loc);
	}
	// closeData.call(this);
	cmd.close();
	return ips;
};

/**
 * IP段查询
 * @param {number|string} bginIP 起始IP
 * @param {number|string} endIP 结束IP
 * @param {object} [options] 输出配制
 * @param {string} [options.fromat] 输出数据的格式 支持 'json','csv' 默认 'text'
 * @param {Boolean} [options.outHeader] 是否输出字段名 默认 'false'
 * @return {stream.Readable}
 */
QqwryDriver.prototype.searchIPScopeStream = function(bginIP, endIP, options) {
	options = options || {};
	var format = options.format;
	var objectMode = format === 'object';
	var outHeader = options.outHeader == undefined ? false : !!options.outHeader;
	var cmd = this.cmd();
	var lib = getLib(this, cmd);
	var formatFn = getFormatfn(format);

	// cmd.open();
	var _ip1, _ip2, b_g, e_g;
	var ips = [];
	_ip1 = ipToInt(bginIP);
	_ip2 = ipToInt(endIP);

	b_g = LocateIP.call(lib, _ip1);
	e_g = LocateIP.call(lib, _ip2);

	var i = b_g;
	var read = function(size) {
		var self = this;
		if (i > e_g) return cmd.close(), self.push(null);
		var add = setIPLocation.call(cmd, i),
			begInt = cmd.readUIntLE(i, 4),
			endInt = cmd.readUIntLE(cmd.readUIntLE(i + 4, 3), 4),
			begIP = intToIP(begInt),
			endIP = intToIP(endInt),
			Country = add.Country,
			Area = add.Area;
		var outstr = '';
		switch (format) {
			case 'csv':
				if (i == b_g && outHeader) {
					outstr += formatFn(['begInt', 'endInt', 'begIP', 'endIP', 'Country', 'Area']);
				}
				outstr += formatFn([begInt, endInt, begIP, endIP, Country, Area]);
				self.push(outstr);
				break;
			case 'json':
				outstr += i == b_g ? '[' : '';
				outstr += formatFn(
					outHeader
						? {
								begInt: begInt,
								endInt: endInt,
								begIP: begIP,
								endIP: endIP,
								Country: Country,
								Area: Area
						  }
						: [begInt, endInt, begIP, endIP, Country, Area]
				);
				outstr += i == e_g ? ']\n' : ',';
				self.push(outstr);
				break;
			case 'object':
			case 'text':
			default:
				self.push(formatFn([begInt, endInt, begIP, endIP, Country, Area]));
				break;
		}
		i += IP_RECORD_LENGTH;
	};
	var outss = new stream.Readable({
		objectMode: objectMode,
		// read: read,
		destroy: function(err, callback) {
			cmd.close();
			callback(err);
		}
	});
	outss._read = read;
	return outss;
};

function getLib(consts, cmd) {
	return {
		ipBegin: consts.ipBegin,
		ipEnd: consts.ipEnd,
		cmd: cmd
	};
}

// 取得begin和end中间的偏移(用于2分法查询);
function GetMiddleOffset(begin, end, recordLength) {
	var records = (((end - begin) / recordLength) >> 1) * recordLength + begin;
	return records ^ begin ? records : records + recordLength;
}

//2分法查找指定的IP偏移
function LocateIP(ip) {
	var g, temp;
	for (var b = this.ipBegin, e = this.ipEnd; b < e; ) {
		g = GetMiddleOffset(b, e, IP_RECORD_LENGTH); //获取中间位置
		temp = this.cmd.readUIntLE(g, 4);
		if (ip > temp) {
			b = g;
		} else if (ip < temp) {
			if (g == e) {
				g -= IP_RECORD_LENGTH;
				break;
			}
			e = g;
		} else {
			break;
		}
	}
	if (dbug) {
		var begip = this.cmd.readUIntLE(g, 4);
		endip = this.cmd.readUIntLE(this.cmd.readUIntLE(g, 3), 4); //获取结束IP的值
		log(exports.intToIP(ip) + ' >> ' + ip);
		log('>> Indexes as "' + g + '" ( ' + begip + ' --> ' + endip + ' )');
		if (ip > endip) {
			//与结束IP比较；正常情况不会出现这种情况,除非IP库漏掉了一些IP;
			return -1;
		}
	}
	return g;
}

//获取IP地址对应区域
function setIPLocation(g) {
	var cmd = this;
	var ipwz = cmd.readUIntLE(g + 4, 3) + 4;
	var lx = cmd.readUIntLE(ipwz, 1),
		loc = {};
	if (lx == REDIRECT_MODE_1) {
		//Country根据标识再判断
		ipwz = cmd.readUIntLE(ipwz + 1, 3); //读取国家偏移`
		lx = cmd.readUIntLE(ipwz, 1); //再次获取标识字节
		var Gjbut;
		if (lx == REDIRECT_MODE_2) {
			//再次检查标识字节
			Gjbut = cmd.getStringByteArray(cmd.readUIntLE(ipwz + 1, 3));
			loc.Country = GBK_decode(Gjbut);
			// loc.Country = Gjbut.toString();
			ipwz = ipwz + 4;
		} else {
			Gjbut = cmd.getStringByteArray(ipwz);
			loc.Country = GBK_decode(Gjbut);
			// loc.Country = Gjbut.toString();
			ipwz += Gjbut.length + 1;
		}
		loc.Area = ReadArea.call(cmd, ipwz);
	} else if (lx == REDIRECT_MODE_2) {
		//Country直接读取偏移处字符串
		var Gjbut = cmd.getStringByteArray(cmd.readUIntLE(ipwz + 1, 3));
		loc.Country = GBK_decode(Gjbut);
		// loc.Country = Gjbut.toString();
		loc.Area = ReadArea.call(cmd, ipwz + 4);
	} else {
		//Country直接读取 Area根据标志再判断
		var Gjbut = cmd.getStringByteArray(ipwz);
		ipwz += Gjbut.length + 1;
		loc.Country = GBK_decode(Gjbut);
		// loc.Country = Gjbut.toString();
		loc.Area = ReadArea.call(cmd, ipwz);
	}
	return loc;
}

//读取Area
function ReadArea(offset) {
	var cmd = this;
	var one = cmd.readUIntLE(offset, 1);
	if (one == REDIRECT_MODE_1 || one == REDIRECT_MODE_2) {
		var areaOffset = cmd.readUIntLE(offset + 1, 3);
		if (areaOffset == 0) return unArea;
		else {
			return GBK_decode(cmd.getStringByteArray(areaOffset));
		}
	} else {
		return GBK_decode(cmd.getStringByteArray(offset));
	}
}

var ipToInt =
	/**
	 * ip地址转数值
	 * @param {number|string} IP ip地址
	 */
	(QqwryDriver.ipToInt = function(IP) {
		var result = IP_REGEXP.exec(IP),
			ip;
		if (result) {
			var ip_Arr = result.slice(1);
			ip =
				((parseInt(ip_Arr[0]) << 24) |
					(parseInt(ip_Arr[1]) << 16) |
					(parseInt(ip_Arr[2]) << 8) |
					parseInt(ip_Arr[3])) >>>
				0;
		} else if (/^\d+$/.test(IP) && (ip = parseInt(IP)) >= 0 && ip <= 0xffffffff) {
			ip = +IP;
		} else {
			throw 'The IP address is not normal! >> ' + IP;
		}
		return ip;
	});

var intToIP =
	/**
	 * 数值转IP地址
	 * @param {number} int ip数值
	 */
	(QqwryDriver.intToIP = function(int) {
		if (int < 0 || int > 0xffffffff) {
			throw 'The IP number is not normal! >> ' + int;
		}
		return (
			(int >>> 24) +
			'.' +
			((int >>> 16) & 0xff) +
			'.' +
			((int >>> 8) & 0xff) +
			'.' +
			((int >>> 0) & 0xff)
		);
	});

var ipEndianChange =
	/**
	 * 32位 Big Endian 与 Little Endian 数值互转
	 * 适用于一些特殊场景 IP数值读取错误时使用
	 * @param {number} int 32位数值
	 */
	(QqwryDriver.ipEndianChange = function(int) {
		int = int & 0xffffffff;
		return ((int >>> 24) | ((int >> 8) & 0xff00) | ((int << 8) & 0xff0000) | (int << 24)) >>> 0;
	});

QqwryDriver.init = function() {
	return QqwryDriver.apply(null, arguments);
};

module.exports = QqwryDriver;
