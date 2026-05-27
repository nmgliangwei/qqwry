# opencc-js [![](https://badge.fury.io/js/opencc-js.svg)](https://www.npmjs.com/package/opencc-js) [![](https://github.com/nk2028/opencc-js/workflows/Test/badge.svg)](https://github.com/nk2028/opencc-js/actions?query=workflow%3ATest) [![](https://data.jsdelivr.com/v1/package/npm/opencc-js/badge)](https://www.jsdelivr.com/package/npm/opencc-js)

開放中文轉換 JavaScript 版

字典資料會在建置時從 `opencc-data` 產生，並打包進發布檔案。瀏覽器執行時不會額外下載字典 txt 檔案。

## 載入

**在 HTML 中載入**

載入以下 `script` 標籤：

```html
<script src="https://cdn.jsdelivr.net/npm/opencc-js@1.3.0/dist/umd/full.js"></script>     <!-- 完全版 -->
```

自行託管的話，除了使用原先的 umd，也可以使用 es module

```html
<script type="module">
  import OpenCC from './dist/esm/full.js'; // 完全版
</script>
```

**在 Node.js 中載入**

```sh
npm install opencc-js
```

CommonJS

```javascript
const OpenCC = require('opencc-js');
```

ES Modules

```javascript
import OpenCC from 'opencc-js';
```

## 使用

**基本用法**

```javascript
// 將繁體中文（香港）轉換為簡體中文（中國大陸）
const converter = OpenCC.Converter({ from: 'hk', to: 'cn' });
console.log(converter('漢語')); // output: 汉语
```

- `cn`: 簡體中文（中國大陸）
- `tw`: 繁體中文（臺灣）
    - `twp`: 且轉換詞彙（例如：自行車 -> 腳踏車）
- `hk`: 繁體中文（香港）
- `jp`: 日本新字體
- `t`: 繁體中文（[OpenCC 標準繁體](https://github.com/BYVoid/OpenCC/blob/master/DESIGN_PRINCIPLES.md)。多數場景建議優先使用 `tw` 或 `hk` 等地區 locale）

**自訂轉換器**

```javascript
const converter = OpenCC.CustomConverter([
  ['香蕉', 'banana'],
  ['蘋果', 'apple'],
  ['梨', 'pear'],
]);
console.log(converter('香蕉 蘋果 梨')); // output: banana apple pear
```

或以「空白」及「|」當作分隔符號

```javascript
const converter = OpenCC.CustomConverter('香蕉 banana|蘋果 apple|梨 pear');
console.log(converter('香蕉 蘋果 梨')); // output: banana apple pear
```

**添加字詞**

* `ConverterFactory` 是比較底層的函數，`Converter` 及 `CustomConverter` 都是這個函數的再包裝。
* 透過 `Locale` 屬性可以得到原本的字典，進而添加字詞。

```javascript
const customDict = [
  ['“', '「'],
  ['”', '」'],
  ['‘', '『'],
  ['’', '』'],
];
const converter = OpenCC.ConverterFactory(
  OpenCC.Locale.from.cn,                   // 中國大陸 => OpenCC 標準
  OpenCC.Locale.to.tw.concat([customDict]) // OpenCC 標準 => 臺灣+自訂
);
console.log(converter('悟空道：“师父又来了。怎么叫做‘水中捞月’？”'));
// output: 悟空道：「師父又來了。怎麼叫做『水中撈月』？」
```

下面的寫法也會得到相同的結果，只是內部會多做一次轉換

```javascript
const customDict = [
  ['“', '「'],
  ['”', '」'],
  ['‘', '『'],
  ['’', '』'],
];
const converter = OpenCC.ConverterFactory(
  OpenCC.Locale.from.cn, // 中國大陸 => OpenCC 標準
  OpenCC.Locale.to.tw,   // OpenCC 標準 => 臺灣
  [customDict]           // 臺灣 => 自訂
);
console.log(converter('悟空道：“师父又来了。怎么叫做‘水中捞月’？”'));
// output: 悟空道：「師父又來了。怎麼叫做『水中撈月』？」
```

**DOM 操作**

HTML 屬性 `lang='*'` 定義了目標。

```html
<span lang="zh-HK">漢語</span>
```

```javascript
// 將繁體中文（香港）轉換為簡體中文（中國大陸）
const converter = OpenCC.Converter({ from: 'hk', to: 'cn' });
// 設定轉換起點為根節點，即轉換整個頁面
const rootNode = document.documentElement;
// 將所有 zh-HK 標籤轉為 zh-CN 標籤
const HTMLConvertHandler = OpenCC.HTMLConverter(converter, rootNode, 'zh-HK', 'zh-CN');
HTMLConvertHandler.convert(); // 開始轉換  -> 汉语
HTMLConvertHandler.restore(); // 復原      -> 漢語
```

class list 包含 `ignore-opencc` 的標籤不會被轉換（包括該標籤的所有子節點）。

`HTMLConverter` 也會轉換 `placeholder` 和 `aria-label` 屬性。

## 打包優化

如果使用 rollup 等工具打包程式碼，以下方式能讓打包工具自動移除用不到的部分，減少檔案大小。

建議明確選擇 `tw`、`hk` 或 `cn` 等地區字典；通用的 OpenCC 標準 `t` 模式通常不是面向使用者顯示時最合適的繁體。

```javascript
import * as OpenCC from 'opencc-js/core'; // 核心程式碼
import * as Locale from 'opencc-js/preset'; // 字典資料

const converter = OpenCC.ConverterFactory(Locale.from.hk, Locale.to.cn);
console.log(converter('漢語'));
```

備註：

* 由於這是利用 Tree Shaking，所以必須使用 ES Modules
* 在這個模式之下，沒有 `Converter` 函式，必須直接使用 `ConverterFactory`

## 與 [`opencc`](https://www.npmjs.com/package/opencc) npm package 的區別

[`opencc-js`](https://www.npmjs.com/package/opencc-js) npm package 是面向瀏覽器和 Node.js 的純 JavaScript 實作。它打包了從 `opencc-data` 產生的字典資料，因此不需要 native binary，也不會在執行時下載字典 txt 檔案。

[`opencc-js`](https://www.npmjs.com/package/opencc-js) 的轉換流程已向官方 OpenCC 實作對齊，包括內建轉換器的詞組分詞，並通過 upstream OpenCC test cases 和 golden outputs 驗證。但它仍不保證對所有輸入都與官方 OpenCC 產生 100% 相同的結果。

`opencc-js` 目前支援內建轉換器使用的 OpenCC mmseg 風格分詞，但不支援 jieba 等擴充分詞演算法。

[`opencc`](https://www.npmjs.com/package/opencc) npm package 是官方 OpenCC C++ 專案的 Node.js native binding，主要用於 Node.js，依賴 native 或 prebuilt binary，並跟隨官方 OpenCC 引擎。在官方 OpenCC 設定和執行環境支援時，它可以使用 jieba 等擴充分詞演算法。

[`opencc-wasm`](https://www.npmjs.com/package/opencc-wasm) npm package 是另一個能在瀏覽器中使用的實作。它使用 WebAssembly，配置和轉換邏輯與官方 [`opencc`](https://www.npmjs.com/package/opencc) package 對齊，並可透過官方 OpenCC runtime 支援 jieba 分詞。
