# Vue3设计思想和理念

## 学习大纲

- Vue3架构设计响应式原理、reactive、effect、watch、computed、ref原理

- 掌握Vue3源码调试技巧，掌握响应式中数组、map、set处理

- 手写自定义渲染器原理及RuntimeDOM中属性、事件处理

- 手写虚拟DOM、手写Vue3中diff算法及最长递增子序列实现原理

- 手写组件渲染原理、组件挂载流程、及异步渲染原理

- 手写Vue3中生命周期，props、emit、slot实现原理

- 详解Vue3中编译优化、patchFlags、blockTree，实现靶向更新。手写模板转化ast语法树

- 手写编译原理的转化逻辑、及代码生成原理

- 手写Vue中异步组件原理、Teleport、keep-alive实现原理

  

## Vue设计思想

- 拆分模块：Vue3.0更注重模块上的拆分，在2.0中无法单独使用部分模块。需要引入完整的Vuejs(例如只想使用响应式部门，但是需要引入完整的Vuejs)，Vue3中的模块之间的耦合度低，模块可以独立使用。
- 重写API：Vue2中很多方法挂载到了实例中，导致没有使用也会被打包(还有很多组件也是一样)。通过构建工具Tree-shaking机制实现按需引入，减少用户打包后的体积。
- 扩展更方便：Vue3允许自定义渲染器，扩展能力强。不会像以前一样，需要通过改写Vue源码来改造渲染方式。



### 声明式框架

> Vue3依然是声明式框架，用起来简单（声明式代码不需要关注实现，按照要求填代码就可以）。

**命令式和声明式区别：**

- 早期在JQuery的时代编写的代码都是命令式的，命令式框架重要特点就是关注过程。
- 声明式框架更加关注结果。命令式代码封装到了Vuejs中，过程靠Vuejs来实现（声明式编程有点像古代的词牌，词人按照要求填词即可）。

```js
// 命令式编程
let numbers = [1,2,3,4,5];
let total = 0;
for(let i=0; i<numbers.length; i++){
  total += numbers[i];  //关注了过程，需要自己去遍历、自己去累加
}
console.log(total);

// 声明式编程
let total2 = numbers.reduce(function(memo, current){
  return memo + current;
}, 0)
console.log(total2);
```



### 采用虚拟DOM

传统更新页面，拼接一个完整的字符串innerHTML全部重新渲染，添加虚拟DOM后，可以比较新旧虚拟节点，找到变化再进行更新。虚拟DOM就是一个对象，用来描述真实DOM的。

```js
const vnode = {
	_v_isVNode: true,
  _v_skip: true,
  type,
  props,
  key: props && normalizeKey(props),
  ref: props && normalizeRef(props),
  children,
  component: null,
  el: null,
  patchFlag,
  dynamicProps,
  dynamicChildren: null,
  appContext: null
}
```



### 区分编译时和运行时

- 我们需要有一个虚拟DOM，调用渲染方法将虚拟DOM渲染成真实DOM（缺点就是虚拟DOM编写麻烦）
- 专门写个编译时可以将模板编译成虚拟DOM（在构建的时候进行编译性能更高，不需要再运行的时候进行编译，而且vue3在编译中做了很多优化）



# Vue3整体架构

## Vue3架构介绍

### Monorepo管理项目

Monorepo 是管理项目代码的一个方式，指在一个项目仓库(repo)中管理多个模块/包(package)。Vue3源码采用 monorepo 方式进行管理，将模块拆分到 package 目录中。

- 一个仓库可维护多个模块，不用到处找仓库
- 方便版本管理和依赖管理，模块之间的引用、调用都非常方便



### Vue3的项目结构

![image-20220606085343424](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206060853952.png)



### Vue3采用Typescript

Vue2采用Flow来进行类型检测（Vue2中对TS支持并不友好），Vue3源码采用Typescript来进行重写，对TS的支持更加友好。



## Vue3开发环境搭建

### 搭建Monorepo环境

Vue3中使用 pnpm、workspace 来实现 monorepo （pnpm是快速、节省磁盘空间的包管理器，主要采用符号链接的方式管理模块）。

#### 全局安装pnpm

官网：https://www.pnpm.cn/

中文网：https://www.pnpm.cn/installation

```sh
npm install pnpm -g  # 全局安装pnpm

pnpm init -y # 初始化配置文件
```



#### 创建.npmrc文件

```js
shamefully-hoist = true
```

> 这里您可以尝试一下安装 `vue3`，`pnpm install vue@next`，此时默认情况下vue3中依赖的模块不会被提升到 `node_modules `下。添加 `shamefully-hoist` 可以提升 vue3 所依赖的模块提升到 `node_modules` 中。



#### 配置workspace

在根目录下创建 pnpm-workspace.yaml ，然后创建 packages 目录。

```yaml
packages:
  - "packages/*"
```

![image-20220606090933278](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206060909068.png)



#### 安装依赖

> minimist: https://www.npmjs.com/package/minimist
>
> esbuild:  https://github.com/evanw/esbuild   https://esbuild.github.io/api/

```sh
pnpm install -w -D  # -w：安装到 workspace root（根目录下）下

pnpm install typescript minimist esbuild -w -D  # -D：即--save-dev
```

使用 minimist 解析命令行参数示例：

```sh
var argv = require('minimist')(process.argv.slice(2));
console.log(argv);
$ node example/parse.js -a beep -b boop
{ _: [], a: 'beep', b: 'boop' }

$ node example/parse.js -x 3 -y 4 -n5 -abc --beep=boop foo bar baz
{ _: [ 'foo', 'bar', 'baz' ],
  x: 3,
  y: 4,
  n: 5,
  a: true,
  b: true,
  c: true,
  beep: 'boop' 
}
```

使用 esbuild 打包代码示例：

```js
require('esbuild').build({
  entryPoints: ['app.js'],
  outfile: 'out.js',
  bundle: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded:', result)
    },
  },
}).then(result => {
  console.log('watching...')
})
```



### 环境搭建

#### 创建模块

在 packages 目录下创建 reactivity、shared 2个目录。分别创建 src/index.ts（index.ts是入口文件） 、package.json。

- reactivity：响应式模块
- shared：共享模块

如下所示，是目录结构和package.json配置：

![image-20220606102050478](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206061024173.png)

shared模块由于是公共模块，不需要打包，不需要在浏览器下使用，故 buildOptions 中不必配置 name 属性， formats 中也不必配置 global 选项。

```json
{
  "name": "@vue/reactivity",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "buildOptions": {
    "name": "VueReactivity", // 打包的名字
    "formats": [
      "global", // 浏览器中使用
      "cjs",  // commonjs语法
      "esm-bundler" // webpack使用
    ]
  }
}

{
  "name": "@vue/shared",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "buildOptions": {
    "formats": [
      "cjs",
      "esm-bundler"
    ]
  }
}
```



#### 初始化TS

```sh
pnpm tsc --init
```

tsconfig.json 中保留如下配置，其中 baseUrl、paths 的配置，是用于实现packages下各模块之间可以相互引用。

```json
{
  "compilerOptions": {
    "outDir": "dist",                 //输出的目录
    "sourceMap": true,                //采用sourcemap
    "target": "es2016",               //目标语法
    "module": "esnext",               //模块格式
    "moduleResolution": "node",       //模块解析方式
    "strict": true,                   //严格模式
    "resolveJsonModule": true,        //解析json模块
    "esModuleInterop": true,          //允许通过es6语法引入commonjs模块
    "jsx": "preserve",                //jsx不转义
    "lib": ["esnext", "dom"],         //支持的类库
    "baseUrl": ".",
    "paths": {
      "@vue/*": ["packages/*/src"]    //以@vue/*开头的依赖，到packages/*/src路径下去找，实现模块间可以相互引用
    }
  }
}
```

配置完成后测试一下，reactivity 和 shared 之间是否可以相互引用，编译不报错：

```typescript
// shared/src/index.ts
import {isFunction} from "@vue/reactivity";

export const isObject = () => {}


// reactivity/src/index.ts
import {isObject} from "@vue/shared";

export const isFunction = () => {}
```



#### 开发环境esbuild打包

选择原因：esbuild 打包比其它主流打包工具速度更快。

![WechatIMG7](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206061023541.png)

1. **创建 scripts 目录及dev.js文件**

   ![image-20220606124813534](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206061248873.png)

   

2. **在根目录下的 package.json 新增 scripts 配置**

   ```json
   {
     "name": "vue3-plain",
     "version": "1.0.0",
     "description": "",
     "main": "index.js",
     // 新增 dev 命令
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1",
       "dev": "node scripts/dev.js reactivity -f global"
     },
     "keywords": [],
     "author": "",
     "license": "ISC",
     "dependencies": {
       "vue": "^3.2.36"
     },
     "devDependencies": {
       "esbuild": "^0.14.42",
       "minimist": "^1.2.6",
       "typescript": "^4.7.3"
     }
   }
   ```

   

3. **dev.js 初始化代码， 打包 reactivity 模块、格式 global （给浏览器使用）**

   ```js
   // minimist库 用于解析命令行参数
   const args = require("minimist")(process.argv.slice(2))  // node scripts/dev.js reactivity -f global
   // console.log(args);    输出：{ _: [ 'reactivity' ], f: 'global' }
   const {resolve} = require("path");
   const {build} = require("esbuild");
   
   const target = args._[0] || "reactivity";   // 要打包的模块
   const format = args.f || "global"           // 打包的格式
   
   // 可以打包多个，但开发环境只打包某一个
   const pkg = require(resolve(__dirname, `../packages/${target}/package.json`));
   
   // 输出格式
   // 1、iife：立即执行函数； (function(){})()
   // 2、cjs：commonjs，node中的模块；module.exports
   // 3、esm：浏览器中的 esModule 模块; import
   const outputFormat = format.startsWith("global") ? "iife" : format === "cjs" ? "cjs" : "esm";
   
   // 输出路径
   const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`);
   
   // 天生就支持ts
   build({
       entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
       outfile,
       bundle: true,     // 把所有的包全部打包到一起
       sourcemap: true,  // 打包以后需要有 sourcemap
       format: outputFormat, // 输出格式
       globalName: pkg.buildOptions?.name, // 打包的全局的名字
       platform: format === "cjs" ? "node" : "browser", // 平台
       watch: { // 监控文件变化
           onRebuild(error) {
               if (!error) {
                   console.log("rebuild.......");
               }
           }
       }
   }).then(() => {
       console.log("watching.....");
   })
   ```

   

4. **测试打包命令**

   pnpm run dev

   ![image-20220606124253822](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206061320585.png)

​       在dist目录下新增 index.html 文件，以script 标签引入打包后的文件

​        ![image-20220606132032580](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206061320844.png)		



#### 生产环境rollup打包

> rollup: https://github.com/rollup/rollup      https://rollupjs.org/guide/en/#javascript-api



