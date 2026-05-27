var libqqwry = require('../');
var qqwry1 = libqqwry();
var argv = process.argv.slice(2);
var arg = argv[0];

function getQPS(n, s) {
	return 'QPS: ' + (n / s).toFixed(1) + 'k';
}

function openspeed() {
	qqwry1.speed();
	console.log('- 开启speed模式 -');
}

var ips = [],
	ipds = [];

//随机生成100个IP
for (var i = 0; i < 100; i++) {
	ips.push((Math.random() * 0xffffffff) >>> 0);
}

//随机生成10个IP
for (var i = 0; i < 5; i++) {
	var _ip = ips[i];
	ipds.push([(Math.random() * _ip) >>> 0, _ip]);
}

if (arg == '-1') {
	console.log('--- 效率测试 IP查询(searchIP) ---');
	var tb, te, nn;

	tb = new Date();
	nn = v1(500, qqwry1);
	te = new Date();
	console.log('单次查询(' + nn / 10000 + '万次):' + (te - tb) + 'ms - ' + getQPS(nn, te - tb));

	openspeed();

	tb = new Date();
	nn = v1(1000, qqwry1);
	te = new Date();
	console.log('单次查询(' + nn / 10000 + '万次):' + (te - tb) + 'ms - ' + getQPS(nn, te - tb));
} else if (arg == '-2') {
	console.log('--- 效率测试 IP段查询(searchIPScope) ---');
	var tb, te, n;

	tb = new Date();
	n = v2(null, qqwry1);
	te = new Date();
	console.log(
		'IP段查询' +
			n[0] +
			'次(共获取' +
			n[1] / 10000 +
			'万条记录):' +
			(te - tb) +
			'ms - ' +
			getQPS(n[1], te - tb)
	);

	openspeed();

	tb = new Date();
	n = v2(null, qqwry1);
	te = new Date();
	console.log(
		'IP段查询' +
			n[0] +
			'次(共获取' +
			n[1] / 10000 +
			'万条记录):' +
			(te - tb) +
			'ms - ' +
			getQPS(n[1], te - tb)
	);
} else if (arg == '-3') {
	console.log('--- 效率测试 IP段异步查询(searchIPScope) ---');
	var tb, te, n, _mark;

	tb = new Date();
	// openspeed();
	v3(qqwry1)
		.then(function(ns) {
			te = new Date();
			n = ns;
			console.log(
				'IP段异步查询(共获取' + n / 10000 + '万条记录):' + (te - tb) + 'ms - ' + getQPS(n, te - tb)
			);
		})
		.then(function() {
			openspeed();
			tb = new Date();
			return v3(qqwry1);
		})
		.then(function(ns) {
			te = new Date();
			n = ns;
			console.log(
				'IP段异步查询(共获取' + n / 10000 + '万条记录):' + (te - tb) + 'ms - ' + getQPS(n, te - tb)
			);
		});
} else if (arg) {
	//验证是否正常
	// qqwry1.speed();
	console.log(qqwry1.apply(null, argv));
} else {
	qqwry1.speed();
	var ips = ['0.0.0.0', '255.255.255.255'];
	var time1 = Date.now();
	var data = qqwry1.apply(null, ips);
	var time2 = Date.now();
	var version = data[data.length - 1];
	console.log(version.Country + version.Area);
	console.log(ips.join(' - ') + ' | 共有数据:' + data.length + '条', '查询耗时:' + (time2 - time1));
	console.log(getQPS(data.length, time2 - time1));
	return;
}

//单个IP查询
function v1(n, qqwry) {
	var nb = 0,
		ipsl = ips.length;
	for (var i = 0; i < n; i++) {
		for (var ii = 0; ii < ipsl; qqwry(ips[ii++]));
		nb += ipsl;
	}
	return nb;
}

//IP段查询
function v2(n, qqwry) {
	var nb = 0,
		k = n || 1,
		ipdsl = ipds.length;
	for (var i = 0; i < k; i++) {
		for (var ii = 0; ii < ipdsl; ii++) {
			nb += qqwry.apply(null, ipds[ii]).length;
		}
	}
	return [k * ipdsl, nb];
}

function v3(qqwry) {
	function qqwryIPs(ip, ip1) {
		return new Promise(function(reslove, reject) {
			qqwry(ip, ip1, function(err, data) {
				if (err) return reject(err);
				reslove(data);
			});
		});
	}
	return Promise.all([
		qqwryIPs('0.0.0.0', '50.255.255.255'),
		qqwryIPs('51.0.0.0', '99.255.255.255'),
		// qqwryIPs('100.0.0.0', '150.255.255.255')
		// qqwryIPs('151.0.0.0', '199.255.255.255'),
		// qqwryIPs('200.0.0.0', '255.255.255.255'),
	]).then(function(arr) {
		return arr.reduce((a, b) => {
			return a + b.length;
		}, 0);
	});
}
