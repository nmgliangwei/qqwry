# lib-qqwry

`lib-qqwry`是一个高效纯真IP库(qqwry.dat)引擎;  

## 安装
```
npm i lib-qqwry
```

## 使用

### cli (v1.3.0+) 
从1.3版本开始支持命令模式, 你可以用把`lib-qqwry`安装到全局来使用;
![search](https://cnwhy.github.io/gh-res/images/qqwry-cli-search.svg)

 * `qqwry search <ip> [ips...]` 查询IP/IP段
 * `qqwry find <keyword> [keyword...]` 反查IP段
    
### node

```js 
var libqqwry = require('lib-qqwry');
var qqwry = libqqwry() //初始化IP库解析器
qqwry.speed(); //启用急速模式;

var ip1 = qqwry.searchIP("202.103.102.10"); //查询IP信息
var ips = qqwry.searchIPScope("0.0.0.0","1.0.0.0");  //查询IP段信息
//异步查询IP段信息
qqwry.searchIPScope("0.0.0.0","1.0.0.0",function(err,iparr){
  console.log(iparr);
});
//查询IP段信息,结果以可读流返回
var ipStream = qqwry.searchIPScopeStream('0.0.0.0','1.0.0.0',{format:'json'});
// s.pipe(fs.readFileSync(outFile))
ipStream.pipe(process.stdout)
```

## API

### libqqwry.ipToInt(IP) IP地址转数值
```
> libqqwry.ipToInt("255.255.255.255")
4294967295
```

### libqqwry.intToIP(INT) 数值转IP地址
```
> libqqwry.intToIP(4294967295)
'255.255.255.255'
```

### libqqwry.ipEndianChange(INT) 字节序转换
按32位转换参数的字节序  
一些云平台的环境变量中IP信息可能是Little-Endian形式的数值; 

```
> libqqwry.ipEndianChange(0x010000FF)
4278190081 //0xFF000001
```

### new libqqwry(speed,dataPath) 实例化一个IP库解析器对像(Qqwry)
speed : 是否开启急速模式,可选; //默认false;  
dataPath : IP库路径,可选; //默认路径为data文件夹中(__dirname + "/data/qqwry.dat");
// 可以简写为 libqqwry(speed,dataPath)
```js
var libqqwry = require('lib-qqwry');
var qqwry = libqqwry(true);
```
*libqqwry(), libqqwry.init()* 功能相同

## 解析器对像 Qqwry
### qqwry.searchIP(IP) 单个IP查询
IP : IP地址/IP数值  
> 便捷调用: `qqwry(IP)` v1.2.0+

```
> qqwry("255.255.255.255");
{ int: 4294967295,
  ip: '255.255.255.255',
  Country: '纯真网络',
  Area: '2017年1月5日IP数据' }
```

### qqwry.searchIPScope(beginIP,endIP,[callback]) IP段查询
beginIP : 启始IP  
endIP : 结束IP  
callback: function(err,arrdata){} 没有回调则使用同步查询;  
> 便捷调用: `qqwry(beginIP,endIP,callback)` v1.2.0+

```
> qqwry("8.8.8.0","8.8.8.8");
[ { begInt: 134744064,
    endInt: 134744071,
    begIP: '8.8.8.0',
    endIP: '8.8.8.7',
    Country: '美国',
    Area: '加利福尼亚州圣克拉拉县山景市谷歌公司' },
  { begInt: 134744072,
    endInt: 134744072,
    begIP: '8.8.8.8',
    endIP: '8.8.8.8',
    Country: '美国',
    Area: '加利福尼亚州圣克拉拉县山景市谷歌公司DNS服务器' } ]
```

### qqwry.searchIPScopeStream(beginIP,endIP,options) 流形式反回IP段结果 v1.3.0+
`beginIP` : <string|int> // 启始IP  
`endIP` : <string|int>   // 结束IP  
`options`:
 - `format` : <string> //输出格式, 支持 'text' , 'csv', 'json', 'object'  
 - `outHeader`: <boolean> //为`true`时 'csv' 会输出表头 , 'json' 会以对像数组形式输出(参考`searchIPScope`方法); 默认 `false`

> 流模式适合查询结果数据量较大的情况使用  
> format说明: 'csv' , 'json' 格式适合直接输出到文件, 'object' 将返回对像流, 适合程序二次处理数据

```shell
> qqwry.searchIPScopeStream("8.8.8.0","8.8.8.8").pipe(process.stdout);
8.8.8.0 - 8.8.8.7                   美国 加利福尼亚州圣克拉拉县山景市谷歌公司
8.8.8.8 - 8.8.8.8                   美国 加利福尼亚州圣克拉拉县山景市谷歌公司DNS服务器

> qqwry.searchIPScopeStream("8.8.8.0","8.8.8.8",{format:'csv'}).pipe(process.stdout);
134744064,134744071,8.8.8.0,8.8.8.7,美国,加利福尼亚州圣克拉拉县山景市谷歌公司
134744072,134744072,8.8.8.8,8.8.8.8,美国,加利福尼亚州圣克拉拉县山景市谷歌公司DNS服务器

> qqwry.searchIPScopeStream("8.8.8.0","8.8.8.8",{format:'json'}).pipe(process.stdout);
[[134744064,134744071,"8.8.8.0","8.8.8.7","美国","加利福尼亚州圣克拉拉县山景市谷歌公司"],[134744072,134744072,"8.8.8.8","8.8.8.8","美国","加利福尼亚州圣克拉拉县山景市谷歌公司DNS服务器"]]
```

### qqwry.speed() 启用急速模式
急速模式实质为将IP库文件读入内存中以提升效率.

### qqwry.unSpeed() 停用急速模式
