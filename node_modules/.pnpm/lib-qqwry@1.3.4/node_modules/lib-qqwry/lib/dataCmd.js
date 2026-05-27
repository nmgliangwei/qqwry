var fs = require('fs');

/**
 * 对数据Buffer的操作类
 * @param {buffer} buffer 数据文件的buffer
 */
function bufferCmd(path) {
	var buffer = fs.readFileSync(path);
	var max = buffer.length;
	var api = {
		readBuffer: function(start, length) {
			start = start || 0;
			length = length || 1;
			return buffer.slice(start, start + length);
		},
		readUIntLE: function(start, length) {
			start = start || 0;
			length = length < 1 ? 1 : length > 6 ? 6 : length;
			return buffer.readUIntLE(start, length);
		},
		getStringByteArray: function(start) {
			var B = start || 0;
			var toarr = [];
			for (var i = B; i < max; i++) {
				var s = buffer[i];
				if (s === 0) break;
				toarr.push(s);
			}
			return toarr;
		},
		close: function() {}
		// dispose: function() {
		// 	buffer = null;
		// }
	};
	return function bufferCmd() {
		return api;
	};
}

/**
 * 对数据文件的操作类
 * @param {string} path 文件地址
 */
function fileCmd(path) {
	return function fileCmd() {
		var fd, max;
		function open() {
			fd = fs.openSync(path, 'r');
			max || (max = fs.fstatSync(fd).size);
		}
		open();
		return {
			name: 'bufferCmd',
			readBuffer: function(start, length) {
				start = start || 0;
				length = length || 1;
				var buf = Buffer.alloc(length);
				// fd || open();
				fs.readSync(fd, buf, 0, length, start);
				return buf;
			},
			readUIntLE: function(start, length) {
				start = start || 0;
				length = length < 1 ? 1 : length > 6 ? 6 : length;
				return this.readBuffer(start, length).readUIntLE(0, length);
			},
			getStringByteArray: function(start) {
				var B = start || 0;
				var toarr = [];
				for (var i = B; i < max; i++) {
					var s = this.readBuffer(i, 1)[0];
					if (s === 0) break;
					toarr.push(s);
				}
				return toarr;
			},
			close: function() {
				if (fd != null) {
					fs.closeSync(fd);
					fd = null;
				}
			}
		};
	};
}

module.exports = {
	bufferCmd: bufferCmd,
	fileCmd: fileCmd
};
