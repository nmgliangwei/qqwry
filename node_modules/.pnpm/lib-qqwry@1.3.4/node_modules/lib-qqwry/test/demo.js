var Qqwry = require('../');
var path = require('path');
var dp = path.join(__dirname,"../data/qqwry.dat");
var qqwry = Qqwry(); // Qqwry.init() <=> Qqwry()

//init 参数测试
console.log('int 参数测试')
new Qqwry(true);
Qqwry(true).searchIP("255.255.255.255");
Qqwry(dp).searchIP("255.255.255.255");
Qqwry(dp,true).searchIP("255.255.255.255");
Qqwry(true,dp).searchIP("255.255.255.255");

var ip1 = qqwry("0.0.255.0"),
	ip2 = qqwry(0xFFFFFF00);
	ips = qqwry("8.8.8.0","8.8.8.8"); //IP 段查询
console.log(ip1);
console.log(ip2);
console.log(ips);

//异步IP段查询；
qqwry("8.8.8.0","8.8.8.8",function(err,iparr){
	if(err) return console.error(err);
	console.log(iparr);
});
console.log("----------");

// return; 