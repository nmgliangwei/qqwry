function csv_decode(str) {
	return str.replace(/^(.*[,"\n].*)$/, function(k) {
		// console.log(arguments);
		return '"' + k.replace(/"/g, '""') + '"';
	});
}

function format_csv(val) {
	return (
		val
			.map(function(v) {
				return csv_decode(String(v));
			})
			.join(',') + '\n'
	);
}

function format_json(obj) {
	return JSON.stringify(obj);
}

function format_text(arr) {
	var _ipstr = arr[2] + ' - ' + arr[3];
	_ipstr += _ipstr.length < 33 ? new Array(34 - _ipstr.length).join(' ') : '';
	return _ipstr + ' ' + arr[4] + ' ' + arr[5] + '\n';
}

//arr [begInt, endInt, begIP, endIP, Country, Area]
//obj {begInt, endInt, begIP, endIP, Country, Area}
module.exports = function getFormatFn(fomat) {
	switch (fomat) {
		case 'object':
			return function(val) {
				return val;
			};
		case 'csv':
			return format_csv;
		case 'json':
			return format_json;
		case 'text':
		default:
			return format_text;
	}
};
