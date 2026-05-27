var Qqwry = require('../');
var qqwry = Qqwry();

// var ss = lib.searchIPScopeStream('223.0.0.0', '255.255.255.255', { type: 'csv', outHeader: true });
// ss.pipe(process.stdout);

qqwry.searchIPScopeStream("8.8.8.0","8.8.8.0").pipe(process.stdout);
// qqwry.searchIPScopeStream("8.8.8.0","8.8.8.8",{format:'csv'}).pipe(process.stdout);
// qqwry.searchIPScopeStream("8.8.8.0","8.8.8.8",{format:'json',outHeader:true}).pipe(process.stdout);
// var ss = qqwry.searchIPScopeStream("8.8.8.0","8.8.8.8",{format:'object'});
// ss.pipe(process.stdout);
// ss.on('data',function(data){
// 	console.log('> ', typeof data);
// })


// while (true) {
// 	var obj = ss.read();
// 	if (obj) {
// 		console.log(obj.toString());
// 	} else {
// 		break;
// 	}
// }

// console.log(lib.searchIP('255.255.255.0'));
// console.log(ss.read());
// ss.on('error',console.error)
// ss.on('data',d=>console.log(d.toString()));
// setTimeout(function(){
// 	ss.destroy('end');
// },10)
// var kk = ss.read(5);
// console.log(ss.read().toString());
// console.log(lib.searchIP(-1>>>0));
