module.exports = function(GBK){
	var passChars = '!\'()*-._~';	
	var otherPassChars = '#$&+,/:;=?@';
	function getModue(passChars){
		var passBits = passChars.split('').sort();
		var isPass = function (s){
			return ~passChars.indexOf(s) || /[0-9a-zA-Z]/.test(s)
		}
		return {
			encode:function(str){
				return (str+'').replace(/./g,function(v){
					if(isPass(v)) return v;
					var bitArr = GBK.encode(v);
					for(var i=0; i<bitArr.length; i++){
						bitArr[i] = '%' + ('0'+bitArr[i].toString(16)).substr(-2).toUpperCase();
					}
					return bitArr.join('');
				})
			},
			decode:function(enstr){
				return enstr.replace(/(%[\dA-Za-z]{2})+/g,function(a,b,c){
					var str = '';
					var arr = a.match(/.../g);
					for(var i=0; i < arr.length; i++){
						var hex = arr[i]
						var code = parseInt(hex.substr(1),16);
						if(code & 0x80){
							str += GBK.decode([code,parseInt(arr[++i].substr(1),16)])
						}else{
							var char = String.fromCharCode(code);
							if(isPass(char)){
								str += hex;
							}else{
								str += char;
							}
						}
					}
					return str;
				})
			}
		}
	}

	var URIComponent = getModue(passChars);
	var URI = getModue(passChars + otherPassChars);

	return {
		encodeURI:URI.encode,
		decodeURI:URI.decode,
		encodeURIComponent:URIComponent.encode,
		decodeURIComponent:URIComponent.decode
	}
};