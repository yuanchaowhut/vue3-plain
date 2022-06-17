# 学习大纲

- Vue3架构设计响应式原理、reactive、effect、watch、computed、ref原理

- 掌握Vue3源码调试技巧，掌握响应式中数组、map、set处理

- 手写自定义渲染器原理及RuntimeDOM中属性、事件处理

- 手写虚拟DOM、手写Vue3中diff算法及最长递增子序列实现原理

- 手写组件渲染原理、组件挂载流程、及异步渲染原理

- 手写Vue3中生命周期，props、emit、slot实现原理

- 详解Vue3中编译优化、patchFlags、blockTree，实现靶向更新。手写模板转化ast语法树

- 手写编译原理的转化逻辑、及代码生成原理

- 手写Vue中异步组件原理、Teleport、keep-alive实现原理

  

# Vue3设计思想和理念

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



#### 各个版本Vuejs的区别

> 下面内容摘自node_modules目录下的  vue/dist/README.md
>
> 官网：https://cn.vuejs.org/v2/guide/installation.html
>
> UMD 叫做通用模块定义规范（Universal Module Definition），它可以通过运行时或者编译时让同一个代码模块在使用 CommonJs、CMD 甚至是 AMD 的项目中运行。[参考这里](https://blog.csdn.net/terrychinaz/article/details/112730629)。

|                               | UMD                | CommonJS              | ES Module          |
| ----------------------------- | ------------------ | --------------------- | ------------------ |
| **Full**                      | vue.js             | vue.common.js         | vue.esm.js         |
| **Runtime-only**              | vue.runtime.js     | vue.runtime.common.js | vue.runtime.esm.js |
| **Full (production)**         | vue.min.js         |                       |                    |
| **Runtime-only (production)** | vue.runtime.min.js |                       |                    |

![image-20220526082748059](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202205260827798.png)  



# Vue3响应式原理

Vue2.0 实现双向数据绑定的原理就是利用了 Object.defineProperty() 这个方法重新定义了对象获取属性值(get)和设置属性值(set)的操作来实现的，Vue3.0 用原生 Proxy 替换 Object.defineProperty。

## defineProperty的缺点

1. 在 Vue 中，Object.defineProperty 无法监控到数组下标的变化，导致直接通过数组的下标给数组设置值，不能实时响应。

   > 为了解决这个问题，经过vue内部处理后可以使用以下几种方法来监听数组（push、pop、shift、unshift、splice、sort、reverse）。由于Vue 只针对了以上八种方法进行了hack处理,所以其他数组的属性也是检测不到的，还是具有一定的局限性。

2. Object.defineProperty只能劫持对象的属性,因此我们需要对每个对象的每个属性进行遍历。Vue 2.x里，是通过 递归 + 遍历 data 对象来实现对数据的监控的，如果属性值也是对象那么需要深度遍历,显然如果能劫持一个完整的对象是才是更好的选择。



## Proxy的引入

> 参考资料：https://www.jianshu.com/p/860418f0785c

### 含义

Proxy 是 ES6 中新增的一个特性，翻译过来意思是"代理"，用在这里表示由它来“代理”某些操作。 Proxy 让我们能够以简洁易懂的方式控制外部对对象的访问。其功能非常类似于设计模式中的代理模式。

Proxy 可以理解成，在目标对象之前架设一层“拦截”，外界对该对象的访问，都必须先通过这层拦截，因此提供了一种机制，可以对外界的访问进行过滤和改写。

使用 Proxy 的核心优点是可以交由它来处理一些非核心逻辑（如：读取或设置对象的某些属性前记录日志；设置对象的某些属性值前，需要验证；某些属性的访问控制等）。 从而可以让对象只需关注于核心逻辑，达到关注点分离，降低对象复杂度等目的。

### 基本用法

`let p = new Proxy(target, handler);`

参数：

- target 是用Proxy包装的被代理对象（可以是任何类型的对象，包括原生数组，函数，甚至另一个代理）。

- handler 是一个对象，其声明了代理target 的一些操作，其属性是当执行一个操作时定义代理的行为的函数。

- p 是代理后的对象。当外界每次对 p 进行操作时，就会执行 handler 对象上的一些方法。Proxy共有13种劫持操作，handler代理的一些常用的方法有如下几个：

  ```
  get： 读取
  set： 修改
  has： 判断对象是否有该属性
  construct： 构造函数
  ```



### 示例

下面就用Proxy来定义一个对象的get和set，作为一个基础demo

```js
let target = {};
let p = new Proxy(target, {
    get(target, property) {
        console.log(`${property} 被读取`);
        return property in target ? target[property] : 3;
    },
    set(target, property, value) {
        console.log(`${property} 被设置为 ${value}`);
        target[property] = value;
    }
});

p.name = 'tom' //name 被设置为 tom
p.age; //age 被读取 3
```

p 读取属性的值时，实际上执行的是 handler.get() ：在控制台输出信息，并且读取被代理对象 obj 的属性。

p 设置属性值时，实际上执行的是 handler.set() ：在控制台输出信息，并且设置被代理对象 obj 的属性的值。

以上介绍了Proxy基本用法，实际上这个属性还有许多内容，具体可参考[Proxy文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)。



### Proxy的优势

1. 可以劫持整个对象，并返回一个新对象

2. 有13种劫持操作

3. 既然Proxy能解决以上两个问题，而且Proxy作为es6的新属性在vue2.x之前就有了，为什么vue2.x不使用Proxy呢？一个很重要的原因就是：Proxy是es6提供的新特性，兼容性不好，最主要的是这个属性无法用polyfill来兼容。



## reactive

我们希望reactive函数的功能包括：

- reactive(target) 返回一个 target 的 Proxy 代理对象

- 同一个对象代理多次，返回同一个代理对象

- 代理对象被再次代理，返回原来的代理对象

  

### 具体实现

```js
import {isObject} from "@vue/shared";

// 用于缓存原对象和代理对象的映射关系，注意，WeakMap的key只能是对象。
const reactiveMap = new WeakMap();

const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

/**
 * 1.实现同一个对象代理多次，返回同一个代理对象
 * 2.实现代理对象被再次代理，返回原来的代理对象
 * @param target
 */
export function reactive(target: any) {
    if (!isObject(target)) {
        return;
    }

    // 第一次普通对象代理，我们会通过new Proxy 代理一次，下一次你传递的如果本身就是Proxy就不需要再new Proxy了。
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target;
    }

    // 实现同一个对象代理多次，返回同一个代理对象
    let existingProxy = reactiveMap.get(target);
    if (existingProxy) {
        return existingProxy;
    }

    // 并没有重新定义属性，只是代理，在取值的时候调用get，当赋值时会调用set.
    const proxy = new Proxy(target, {
        get(target, key, receiver) { // receiver 就是 proxy 自己
            if (key === ReactiveFlags.IS_REACTIVE) {
                return true
            }
            // Reflect 保证this指向的是proxy对象
            return Reflect.get(target, key)
        },
        set(target, key, value, receiver) {
            // 这里可以监控到用户设置值了
            return Reflect.set(target, key, value)
        }
    })
    // 缓存
    reactiveMap.set(target, proxy);

    return proxy;
}
```



### 测试用例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/@vue/reactivity/dist/reactivity.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    // effect: 代表的是副作用函数，如果此函数依赖的数据发生变化，会重新执行
    // reactivity: 将数据变成响应式
    const {effect, reactive} = VueReactivity
    const data = {name: "张三", age: 20, address: {num: 100}};
    const state1 = reactive(data);
    const state2 = reactive(data);
    const state3 = reactive(state1);
    console.log(state1);
    console.log(state2);
    console.log(state3);
    console.log(state1 === state2);
    console.log(state1 === state3);

</script>
</body>
</html>
```

输出结果：

![image-20220607092050507](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206070920434.png)



## baseHandler

将Proxy的handler单独抽出来放到一个文件中。在 get 中完成依赖收集track，在set中完成触发更新。

```js
import {track, trigger} from "./effect"

export const enum ReactiveFlags {
    IS_REACTIVE = "__v_isReactive"
}

export const mutableHandlers = {
    get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }

        // 收集依赖.
        track(target, "get", key);

        // Reflect 保证this指向的是proxy对象
        return Reflect.get(target, key)
    },
    set(target, key, value, receiver) {
        // 这里可以监控到用户设置值了
        let oldValue = target[key];
        let result = Reflect.set(target, key, value);
        if (oldValue !== value) {
            //要更新
            trigger(target, "set", key, value, oldValue);
        }
        return result;
    }
}
```



## effect

1. 创建一个 ReactiveEffect 来封装原effect(fn)的回调函数fn。

   ```js
   class ReactiveEffect {
       // effect默认是激活状态
       public active = true;
       public fn = null;
       // parent属性解决effect嵌套问题
       public parent = null;
       // effect记录它被哪些属性收集过
       public deps = [];
   
       constructor(fn) {
           this.fn = fn;
       }
   
       run() {
           // 如果是非激活的状态，只需要执行函数，不需要依赖收集
           if (!this.active) {
               this.fn();
           }
           try {
               this.parent = activeEffect;
               // 这里依赖收集，核心就是将当前的 effect 和稍后渲染的属性关联在一起
               activeEffect = this;
               // 执行this.fn()的时候会使用state.name、state.age等，会调用取值操作get，
               // 在get内部就可以获取到全局的activeEffect，在get里边就可以进行依赖收集，
               // 将fn中使用到的响应式数据与activeEffect关联起来。
               return this.fn();
           } catch (e) {
               console.log(e);
           } finally {
               activeEffect = this.parent;
               this.parent = null;
           }
       }
   }
   
   // fn 可以根据状态变化重新执行, effect可以嵌套着写
   export function effect(fn) {
       // 创建响应式 effect.
       const _effect = new ReactiveEffect(fn);
       // 默认先执行一次
       _effect.run();
   }
   ```

   

2. parent属性解决effect嵌套使用问题，Vue3早期版本还使用栈实现过，但使用树形结构的思想更加简便。

   ```js
   effect(() => {
       state.name = "aa";
       effect(() => {
           state.age = 18;
       })
       state.address = {num: 220}
   })
   ```

   

## 依赖收集

### 数据结构

![依赖收集数据结构](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206081114006.png)

### 代码实现

1. 依赖收集是在 baseHandler 中的 get 中触发的，即只要用到了响应式变量，就会触发 get ，然后在 get 中触发依赖收集。
2. 依赖收集需双向记录，属性记录effect，effect也记录它被哪些属性收集过，这样做的好处是方便将来清理。一个effect可以对应多个属性，一个属性也可以对应多个effect。

```js
// 用于做依赖收集，一个effect可以对应多个属性，一个属性也可以对应多个effect
const targetMap = new WeakMap();

export function track(target, type, key) {
    // 收集依赖. 对象 某个属性 -> 多个effect.
    // WeakMap = {target: Map:{key: Set}}。WeakMap的key必须是对象，Set可以去重。
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
        dep.add(activeEffect);
        // 单向记录指的是属性记录了effect，反向记录应该让effect也记录它被哪些属性收集过，这样做的好处是方便清理。
        // dep里有activeEffect,activeEffect的deps属性里也有dep，互相记录.
        activeEffect.deps.push(dep);
    }
}
```



## 触发更新

1. 触发更新是在 baseHandler 中的 set 中触发的，即只要修改了响应式变量的值，就会触发 set ，然后在 set 中触发更新渲染。本质上就是根据之前收集到的依赖关系，找到对应的ReactiveEffect（ReactiveEffect里封装了fn）并执行run方法。

   ```js
   export function trigger(target, type, key, value, oldValue) {
       const depsMap = targetMap.get(target);
       if (!depsMap) return;
       const effects = depsMap.get(key); // effects是一个Set.
       effects && effects.forEach(effect => {
           // 避免无限死循环
           if (effect !== activeEffect) {
               effect.run();
           }
       });
   }
   ```

   


2. 触发更新时，需避免无限死循环的情况。例如：state.age = Math.random();  每次赋值都会调用 set 钩子，进而调用 trigger，trigger 又会调用 fn，fn 内部又会执行 state.age = Math.random()。

   ```js
    // effect 函数默认会先执行一次，对响应式数据取值(取值的过程中数据会依赖于当前的effect)
       effect(() => {
           state.age = Math.random();
           console.log("effect 函数执行了...");
           document.getElementById("app").innerHTML = `${state.name}今年${state.age}岁了`;
       })
   
       // 如果state发生变化，则effect会再次出发执行
       setTimeout(() => {
           state.name = "李四";
           state.age = 30;
       }, 2000)
   ```

   

## 初版effect.ts

```js
export let activeEffect = undefined;

class ReactiveEffect {
    // effect默认是激活状态
    public active = true;
    public fn = null;
    // parent属性解决effect嵌套问题
    public parent = null;
    // effect记录它被哪些属性收集过
    public deps = [];

    constructor(fn) {
        this.fn = fn;
    }

    run() {
        // 如果是非激活的状态，只需要执行函数，不需要依赖收集
        if (!this.active) {
            this.fn();
        }
        try {
            this.parent = activeEffect;
            // 这里依赖收集，核心就是将当前的 effect 和稍后渲染的属性关联在一起
            activeEffect = this;
            // 执行this.fn()的时候会使用state.name、state.age等，会调用取值操作get，
            // 在get内部就可以获取到全局的activeEffect，在get里边就可以进行依赖收集，
            // 将fn中使用到的响应式数据与activeEffect关联起来。
            return this.fn();
        } catch (e) {
            console.log(e);
        } finally {
            activeEffect = this.parent;
            this.parent = null;
        }
    }
}

// fn 可以根据状态变化重新执行, effect可以嵌套着写
export function effect(fn) {
    // 创建响应式 effect.
    const _effect = new ReactiveEffect(fn);
    // 默认先执行一次
    _effect.run();
}

// 用于做依赖收集，一个effect可以对应多个属性，一个属性也可以对应多个effect
const targetMap = new WeakMap();
// 依赖收集函数
export function track(target, type, key) {
    // 收集依赖. 对象 某个属性 -> 多个effect.
    // WeakMap = {target: Map:{key: Set}}。WeakMap的key必须是对象，Set可以去重。
    if (!activeEffect) return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        targetMap.set(target, (depsMap = new Map()));
    }
    let dep = depsMap.get(key);
    if (!dep) {
        depsMap.set(key, (dep = new Set()));
    }
    const shouldTrack = !dep.has(activeEffect);
    if (shouldTrack) {
        dep.add(activeEffect);
        // 单向记录指的是属性记录了effect，反向记录应该让effect也记录它被哪些属性收集过，这样做的好处是方便清理。
        // dep里有activeEffect,activeEffect的deps属性里也有dep，互相记录.
        activeEffect.deps.push(dep);
    }
}

// 触发更新函数
export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    const effects = depsMap.get(key); // effects是一个Set.
    effects && effects.forEach(effect => {
        // 避免无限死循环
        if (effect !== activeEffect) {
            effect.run();
        }
    });
}
```



## 分支切换

### 需求引入

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/@vue/reactivity/dist/reactivity.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {effect, reactive} = VueReactivity
    const data = {flag: true, name: "张三", age: 20};
    const state = reactive(data);

    effect(() => {
        console.log("effect 函数执行了...");
        document.getElementById("app").innerHTML = state.flag ? state.name : state.age;
    })

    setTimeout(() => {
        state.flag = false;
        setTimeout(() => {
            console.log("修改name，原则上不用更新");
            state.name = "李四";
        }, 1000)
    }, 1000)
</script>
</body>
</html>
```

![2022-06-08 08.28.09](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206080829281.gif)



理论上 state.flag = false 后，页面上呈现的是 age， 那么后面再修改name不应该再触发更新，但目前来说实际上还是会触发。所以我们接下来的需求是每次执行effect的时候都可以清理一遍，重新收集依赖。



### cleanup

```js
function cleanupEffect(effect) {
    // activeEffect.deps -> [(name->Set), (age->Set)]
    const {deps} = effect;

    // 遍历每个Set，在Set中删除当前这个effect.
    for (let i = 0; i < deps.length; i++) {
        //解除依赖，重做依赖收集
        deps[i].delete(effect);
    }
    effect.deps.length = 0;
}
```



### 避免死循环

调用 clearupEffect() 的时机是在 effect.run() 方法里边，但是如果仅仅加入一行代码而不做其它任何处理的话，则 trigger 中的 effects.forEach 会陷入死循环。原因是这里的 effects 来自于 `targetMap.get(target).get(key)`，我们假设是 "name" 属性对应的 Set，当执行 cleanupEffect(this)  时确实会删除 Set 中之前收集到的这个 effect，假设 Set 中原来有 n 个元素，那么现在变成了 n - 1 个，但是紧接着执行 this.fn() 又会触发get（因为fn里用到了响应式数据），get中又开始收集依赖，这个 effect 又会被添加进刚才的 Set，它的元素个数又变回 n 个，所以周而复始，陷入死循环。

```js
 run() {
        ............
        try {
            this.parent = activeEffect;
           
            activeEffect = this;
          
            cleanupEffect(this);  
          
            return this.fn();
        } catch (e) {
            console.log(e);
        } finally {
            activeEffect = this.parent;
            this.parent = null;
        }
 }

// 优化前
export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    let effects = depsMap.get(key); // effects是一个Set.
    if(effects && effects.size > 0){
       effects.forEach(effect => {
            if (effect !== activeEffect) {
                effect.run();
            }
        });
    }
}
```



解决办法是在 trigger 函数中，通过 ` targetMap.get(target).get(key)` 拿到effects后，紧接着拷贝一份 effects。然后 forEach 循环拷贝后的 effects。由于这里采用的是浅拷贝，故虽然 effects 集合的引用地址变了，但是里边的一个一个的 effect 元素的引用地址还是原来的地址。所以执行 effect.run() 内部，执行 cleanupEffect(this)  ，仍然会清理掉之前的 Set 集合中对应的 effect，并且执行 this.fn() 新收集的依赖，也仍然放到原来的拷贝前的 Set 集合中，与我们当前正在 forEach 的集合已经没有关系，也就不会陷入死循环。一句话概括就是：当前正在遍历的集合和遍历过程中做增删元素的集合不是同一个，自然也就不会造成死循环。

> 数据结构：
>
> activeEffect.deps -> [(name->Set), (age->Set)] 
>
> targetMap -> WeakMap = {target: Map:{key: Set}}

优化后的代码为：

```js
export function trigger(target, type, key, value, oldValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    let effects = depsMap.get(key); // effects是一个Set.
    if (effects && effects.size > 0) {
        // 拷贝一份，新effects和原来的effects内存地址已经不同，但是里边一个一个的effect元素的指向还是保持一致。
        effects = new Set(effects);
        effects.forEach(effect => {
            // 避免无限死循环
            if (effect !== activeEffect) {
                effect.run();
            }
        });
    }
}
```



## 调度执行

### 停止依赖收集(stop)

```js
// ReactiveEffect 中增加 stop 方法
stop() {
   if (this.active) {
       this.active = false;
       cleanupEffect(this);
   }     
}
```



### 强制渲染(runner)

1. effect 方法返回一个 runner，runner 指向_effect 的run方法。

```js
// effect 方法增加返回 runner 
export function effect(fn) {
    // 创建响应式 effect.
    const _effect = new ReactiveEffect(fn);
    // 默认先执行一次
    _effect.run();
  
    // 如果不使用bind则将来执行runner() 时，里边的this就是window。
    const runner = _effect.run.bind(_effect);
    // 将_effect挂在runner上
    runner.effect = _effect;
    return runner;
}


run() {
    // stop 后走这里，只需要执行函数，不需要依赖收集
    if (!this.active) {
        this.fn();
    }    
    //.....下面是收集依赖的代码但得不到执行......        
}
```

2. 测试用例(stop 、runner)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/@vue/reactivity/dist/reactivity.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {effect, reactive} = VueReactivity
    const data = {flag: true, name: "张三", age: 20};
    const state = reactive(data);

    const runner = effect(() => {
        console.log("effect 函数执行了...");
        document.getElementById("app").innerHTML = state.age;
    })

    // 停止收集依赖
    runner.effect.stop();

    setTimeout(() => {
        state.age = 1000;
      
        // 如果没有下面的手动调用 runner 强制渲染，则1000 根本显示不到页面上去。手动调用 runner 之后，会在内部调用fn，更新数据. 
        setTimeout(() => {
            // 手动调用 runner() 强制渲染，但是只执行不会收集依赖
            runner();
        }, 1000)
    }, 1000)
</script>
</body>
</html>
```



### 调度器实现(scheduler)

**调度器的目的是：不要每次修改响应式数据的值，都触发执行渲染函数，而是提供一个用户自己控制如何更新渲染的入口。**

1. Effect 函数增加一个options参数，options对象可以包含一个scheduler属性。

   ```js
   export function effect(fn, options: any = {}) {
       // 创建响应式 effect.
       const _effect = new ReactiveEffect(fn, options.scheduler);
       // 默认先执行一次
       _effect.run();
       // 如果不使用bind则将来执行runner() 时，里边的this就是window。
       const runner = _effect.run.bind(_effect);
       // 将_effect挂在runner上
       runner.effect = _effect;
       return runner;
   }
   ```

   

2. ReactiveEffect构造函数增加scheduler参数

   ```js
   // 调度器
   public scheduler = null;
   constructor(fn, scheduler) {
      this.fn = fn;
      this.scheduler = scheduler;
   }            
   ```

   

3. trigger 方法改造

   ```js
   export function trigger(target, type, key, value, oldValue) {
       const depsMap = targetMap.get(target);
       if (!depsMap) return;
       let effects = depsMap.get(key); // effects是一个Set.
       if (effects && effects.size > 0) {
           // 拷贝一份，新effects和原来的effects内存地址已经不同，但是里边一个一个的effect元素的指向还是保持一致。
           effects = new Set(effects);
           effects.forEach(effect => {
               if (effect !== activeEffect) {
                   // 如果用户传入了调度函数，则执行调度函数，否则默认执行
                   if (effect.scheduler) {
                       effect.scheduler();
                   } else {
                       effect.run();
                   }
               }
           });
       }
   }
   ```

   

4. 测试用例

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>Title</title>
       <!-- 引入官方的包 -->
       <!--    <script src="../../../node_modules/@vue/reactivity/dist/reactivity.global.js"></script>-->
       <!-- 引入打包好的文件 -->
       <script src="./reactivity.global.js"></script>
   </head>
   
   <body>
   <div id="app"></div>
   
   <script>
       const {effect, reactive} = VueReactivity
       const data = {flag: true, name: "张三", age: 20};
       const state = reactive(data);
   
       let waiting = false;
       const runner = effect(() => {
           console.log("effect 函数执行了...");
           document.getElementById("app").innerHTML = state.age;
       }, {
           // 调度器，用户自己决定如何更新
           scheduler() {
               console.log("scheduler run!");
               if (!waiting) {
                   waiting = true
                   setTimeout(() => {
                       runner();
                       waiting = false;
                   }, 1000)
               }
           }
       })
   		
   		// 批量更新：修改很多次，但fn只执行一次，只显示最终结果。
       state.age = 1000;
       state.age = 2000;
       state.age = 3000;
       state.age = 4000;
       state.age = 5000;
   
   </script>
   </body>
   </html>
   ```

如下图所示，首页刷新页面回到初始状态。最开始显示20，接着5个state.age=xxx，每次都会触发执行调度器，而不是直接执行fn渲染函数，我们通过调度器编写相关代码控制只渲染一次，显示最终结果5000。

![2022-06-08 14.27.47](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206081428396.gif)



## 深度代理

### 需求引入

前面在 reactive 函数中，我们实现了响应式，用到了 Proxy。现在我们看一下下面这个场景：

```js
<script>
    const {effect, reactive} = VueReactivity
    const data = {flag: true, name: "张三", age: 20, address: {num: 10}};
    const state = reactive(data);

    console.log(state.address);
    effect(() => {
        document.getElementById("app").innerHTML = `金融港 ${state.address.num} 栋`;
    })

		// 修改 state.address 可以出发更新，但是修改 state.address.num 不会，因为 address 不是响应式的。
    setTimeout(() => {
        state.address.num = 15
    }, 2000)

</script>
```

控制台输出：

![image-20220608220645502](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206082206114.png)



显然 state.address 是一个普通对象，如果后面我们对 state.address.num 做出修改，并不会触发更新，因为address不是响应式对象。也就是说，如果我们的 reactive 函数暂时只能处理简单的对象，如果data对象足够复杂，如对象嵌套对象，对于深层的属性就不能监听。所以，我们下一步的需求就是要能够监听任意复杂对象，这就需要引入深度代理。



### 代码实现

修改 baseHandler 中代码：

```js
  get(target, key, receiver) {
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        // 收集依赖.
        track(target, "get", key);

        // Reflect 保证this指向的是proxy对象
        let res = Reflect.get(target, key, receiver);

        // 如果 res 是对象，则响应式处理一下。
        if (isObject(res)) {
            return reactive(res);
        }
        return res;
    },
```



刷新页面，观察控制台输出 Proxy 对象。表明 state.address 也转换为响应式数据了。并且在 effect 和 setTimeout 的作用下，页面也触发了更新。

![2022-06-08 22.13.08](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206082214909.gif)





# Computed & Watch

## Computed

### 使用示例

1. 标准用法，传入对象，对象中包含 get、set。
2. 简化用法，传入函数，函数就相当于标准用法中的 get。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
<!--    <script src="../../../node_modules/@vue/reactivity/dist/reactivity.global.js"></script>-->
    <!-- 引入打包好的文件 -->
        <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {effect, reactive, computed} = VueReactivity
    const state = reactive({firstName: "Jim", lastName: "Green"});

    // 标准写法
    const fullName = computed({
        get() {
            return `${state.firstName} ${state.lastName}`
        },
        set(value) {
            state.firstName = value.split(/\s+/)[0];
            state.lastName = value.split(/\s+/)[1];
        },
    })

    // 简化写法(不需要使用set时，set实际开发中使用的场景少)
    // const fullName = computed(() => {
    //     return `${state.firstName} ${state.lastName}`
    // })

    console.log(fullName);

    effect(() => {
        document.getElementById("app").innerHTML = `firtName: ${state.firstName} <br/><br/>
                                                              lastName: ${state.lastName} <br/><br/>
                                                              fullName: ${fullName.value}`;
    })

    setTimeout(() => {
        state.firstName = "Kate";
        state.lastName = "Brown";
        fullName.value = "Marry Brown"
    }, 3000)

</script>
</body>
</html>
```

![2022-06-09 07.30.11](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206090858142.gif)







### 原理分析

根据上述使用示例及效果，可以有如下推论：

1. 计算属性的特点是缓存。当计算属性依赖的响应式数据发生了变化，计算属性的值才会跟着变化。

2. 计算属性中肯定要有一个缓存标识dirty（是否是脏数据），当依赖有变化，要重新执行get，如果没有变化就不重新执行get。
3. 计算属性内部要封装一个 effect，将 computed(fn) 或 computed({get: fn})  中的 fn 用内部 effect 包装，这样 fn 中使用到的响应式变量被读取时就能能够搜集到内部 effect、被修改时就能去触发执行内部 effect 的调度器函数。



如下所示，反映了计算属性的工作流程：

- 计算属性依赖的响应式变量 firtName、lastName 能够搜集 computed 内部封装的effect，并且当 firtName 或 lastName 发生变化时，能够触发内部 effect 执行。
- 计算属性能够搜集外部 effect （本例即使用 fullName.value 的effect），当依赖的变量发生变化、内部 effect 调度器函数执行时，同时也能够通知外部 effect 执行更新。

![image-20220609074739622](../../../Library/Application%20Support/typora-user-images/image-20220609074739622.png)



### 代码实现

1. 新增 computed.ts

   ```js
   import {isFunction} from "@vue/shared";
   import {ReactiveEffect, trackEffects, triggerEffects} from "./effect";
   
   class ComputedRefImpl {
       public getter!: Function;
       public setter!: Function | undefined;
       public effect: ReactiveEffect;
       public _value: any;
       public _dirty = true;  // 默认应该进行取值计算
       public __v_isReadonly = true;
       public __v_isRef = true;
       public dep!: Set<any>; // 计算属性用于收集外部依赖
   
       constructor(getter: Function, setter?: Function) {
           this.getter = getter;
           this.setter = setter;
           // computed内部封装了一个effect，将用户传入的getter放到内部effect中，这里边的firstName、lastName
           // 就会收集到这个内部effect。当 firstName、lastName 后面发生变化时，这个内部effect就会执行它的调度器函数。
           this.effect = new ReactiveEffect(getter, () => {
               if (!this._dirty) {
                   this._dirty = true;
                   // 触发外部effect更新
                   triggerEffects(this.dep);
               }
           });
       }
   
       // get value() 、set value(newValue) 是类中的属性访问器，底层就是 Object.defineProperty.
       get value() {
           // 做依赖收集，它收集到的是使用了计算属性的effect(外层effect)
           trackEffects(this.dep || (this.dep = new Set));
   
           if (this._dirty) {
               this._dirty = false;
               this._value = this.effect.run();
           }
           return this._value;
       }
   
       set value(newValue) {
           this.setter && this.setter(newValue);
       }
   }
   
   export const computed = (getterOrOptions: any) => {
       let onlyGetter = isFunction(getterOrOptions);
       let getter;
       let setter;
       if (onlyGetter) {
           getter = getterOrOptions
           setter = () => {
               console.warn('no set')
           }
       } else {
           getter = getterOrOptions.get;
           setter = getterOrOptions.set;
       }
   
       return new ComputedRefImpl(getter, setter);
   }
   ```

   

2. 修改 effect.ts 【抽取了 trackEffects 和 triggerEffects 这2个方法】

   ```js
   // 用于做依赖收集，一个effect可以对应多个属性，一个属性也可以对应多个effect
   const targetMap = new WeakMap();
   
   export function track(target, type, key) {
       // 收集依赖. 对象 某个属性 -> 多个effect.
       // WeakMap = {target: Map:{key: Set}}。WeakMap的key必须是对象，Set可以去重。
       if (!activeEffect) return;
       let depsMap = targetMap.get(target);
       if (!depsMap) {
           targetMap.set(target, (depsMap = new Map()));
       }
       let dep = depsMap.get(key);
       if (!dep) {
           depsMap.set(key, (dep = new Set()));
       }
   
       trackEffects(dep);
   }
   
   export function trackEffects(dep: Set<any>) {
       if (!activeEffect) return;
       const shouldTrack = !dep.has(activeEffect);
       if (shouldTrack) {
           dep.add(activeEffect);
           // 单向记录指的是属性记录了effect，反向记录应该让effect也记录它被哪些属性收集过，这样做的好处是方便清理。
           // dep里有activeEffect,activeEffect的deps属性里也有dep，互相记录.
           // activeEffect.deps -> [(name->Set), (age->Set)]
           activeEffect.deps.push(dep);
       }
   }
   
   export function trigger(target, type, key, value, oldValue) {
       const depsMap = targetMap.get(target);
       if (!depsMap) return;
       let effects = depsMap.get(key);
       if (effects && effects.size > 0) {
           triggerEffects(effects);
       }
   }
   
   export function triggerEffects(effects) {
       // 拷贝一份，新effects和原来的effects内存地址已经不同，但是里边一个一个的effect元素的指向还是保持一致。
       effects = new Set(effects);
       effects.forEach(effect => {
           if (effect !== activeEffect) {
               // 如果用户传入了调度函数，则用执行调度函数，否则默认执行
               if (effect.scheduler) {
                   effect.scheduler();
               } else {
                   effect.run();
               }
           }
       });
   }
   ```



### 案例分析

#### 测试代码

```js
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
<!--    <script src="../../../node_modules/@vue/reactivity/dist/reactivity.global.js"></script>-->
    <!-- 引入打包好的文件 -->
        <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {effect, reactive, computed} = VueReactivity
    const state = reactive({firstName: "Jim", lastName: "Green"});

    // 标准写法
    const fullName = computed({
        get() {
            return `${state.firstName} ${state.lastName}`
        }
    })

    console.log(fullName);

    effect(() => {
        document.getElementById("app").innerHTML = fullName.value;
    })

    setTimeout(() => {
        state.firstName = "Kate";
    }, 3000)

</script>
</body>
</html>
```

![2022-06-09 09.35.09](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206090935540.gif)

#### 现象分析

本测试用例写的比较简单，为的就是把问题搞清楚。html中有一个effect（外部effect），它仅仅用到了 fullName 这个计算属性。然后在 setTimeout 中修改了其中一个依赖变量 firstName。可以看到控制台依次输出了 111...， 2222... ，111...。后面2个明显出来的慢一些，显然是 setTimeout 引发的。下面分析一下里边包含的逻辑。

1. 首先明确一点，fullName 是一个 ComputedRefImpl 实例对象。它里边有 get value()、 set value() 这两个钩子函数。外部 effect 首次执行时用到 fullName.value，然后会进入 get value() 中，故第一次输出 111111....。同时收集外部 effect 到 this.dep 中。同时 this._dirty 初始值为true, 故要执行一次 this.effect.run()，得到返回值，显示在页面上，注意此时  this._dirty 会被修改为 false。

2. 当执行 setTimeout 时，firstName 被修改，由于 firstName 在ComputedRefImpl 的构造函数中已经搜集过内部 effect，故它发生变化时，会触发内部 effect 的调度函数执行，故输出 222222...，由于 this._dirty 此时值为false，故要执行 triggerEffects(this.dep) 触发外部 effect 执行（因为 this.dep 里放的是步骤1中收集的外部依赖）。

3. 外部 effect 一执行，又会使用 fullName.value，故又会进入 get value()，故又一次输出 111111....，同时重复执行步骤1的逻辑，拿到 fullName 新的值，更新到页面上。

   ```js
   export const computed = (getterOrOptions: any) => {
       ........
       return new ComputedRefImpl(getter, setter);
   }
   
   class ComputedRefImpl {
       public getter!: Function;
       public setter!: Function | undefined;
       public effect: ReactiveEffect;
       public _value: any;
       public _dirty = true;  // 默认应该进行取值计算
       public __v_isReadonly = true;
       public __v_isRef = true;
       public dep!: Set<any>; // 计算属性用于收集外部依赖
   
       constructor(getter: Function, setter?: Function) {
           this.getter = getter;
           this.setter = setter;
           // computed内部封装了一个effect，将用户传入的getter放到内部effect中，这里边的firstName、lastName
           // 就会收集到这个内部effect。当 firstName、lastName 后面发生变化时，这个内部effect就会执行它的调度器函数。
           this.effect = new ReactiveEffect(getter, () => {
              console.log("2222222222222222222222");
               if (!this._dirty) {
                   this._dirty = true;
                   // 触发外部effect更新
                   triggerEffects(this.dep);
               }
           });
       }
   
       // get value() 、set value(newValue) 是类中的属性访问器，底层就是 Object.defineProperty.
       get value() {
          console.log("1111111111111111111111");
           // 做依赖收集，它收集到的是使用了计算属性的effect(外层effect)
           trackEffects(this.dep || (this.dep = new Set));
   
           if (this._dirty) {
               this._dirty = false;
               this._value = this.effect.run();
           }
           return this._value;
       }
   
       set value(newValue) {
           this.setter && this.setter(newValue);
       }
   }
   ```



## Watch

### 原理分析

1. watch 的本质就是 effect 。watch 内部封装了一个 effect ，会对用户传入的数据进行依赖收集。当被监控的数据发生变化时就会触发 effect 的调度器执行，在调度器中调用用户传入的回调函数，并且返回新值和旧值。

2. 需要注意的是，watch(source, cb)，前一个参数 source 可以接收响应式对象或函数。当接收的是响应式对象时，需要手动递归遍历一下该对象，完成对 effect 的依赖收集。而 source 是一个函数，则不需要手动收集依赖。

   ```js
   if (isReactive(source)) {
      // 需要对source进行递归遍历，遍历的过程中会访问对象上的每一个属性，
      // 访问属性的时候就会触发收集我们在下面构造的这个effect.
      getter = () => traversal(source);
   } else if (isFunction(source)) {
      // 如果传入的本来就是函数，如: () => person.name，由于person是响应式对象，
      // 故 person.name 本身就会触发收集依赖，所以就不需要我们手动递归遍历去收集。
      getter = source;
   } else {
      return;
   }
   
   .......
   // 监控自己构造的函数，数据变化后重新执行job.
   const effect = new ReactiveEffect(getter, job);
   ```

   

![image-20220610085858551](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206100859399.png)



### 代码实现

```js
import {ReactiveEffect} from "./effect";
import {isReactive} from "./reactive";
import {isFunction, isObject} from "@vue/shared";


/**
 * @param source 用户传入的对象
 * @param cb 用户传入的回调
 */
export function watch(source: any, cb: Function) {
    let getter;
    if (isReactive(source)) {
        // 需要对source进行递归遍历，遍历的过程中会访问对象上的每一个属性，
        // 访问属性的时候就会触发收集我们在下面构造的这个effect.
        getter = () => traversal(source);
    } else if (isFunction(source)) {
        // 如果传入的本来就是函数，如: () => person.name，由于person是响应式对象，
        // 故 person.name 本身就会触发收集依赖，所以就不需要我们手动递归遍历去收集。
        getter = source;
    } else {
        return;
    }

    let oldValue: any;
    const job = () => {
        const newValue = effect.run();
        cb(newValue, oldValue);
        oldValue = newValue;
    }
    // 监控自己构造的函数，数据变化后重新执行job.
    const effect = new ReactiveEffect(getter, job);

    oldValue = effect.run();
}

/**
 * 递归遍历，深度访问一个对象上的所有属性。
 * @param target
 * @param set
 */
function traversal(target: any, set = new Set()) {
    if (!isObject(target)) {
        return target;
    }
    // 防止循环引用
    if (set.has(target)) {
        return target;
    }
    set.add(target);
    for (let key in target) {
        traversal(target[key], set);
    }

    return target;
}
```



### 测试用例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/vue/dist/vue.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {watch, reactive} = VueReactivity;
    const state = reactive({name: "Tom", address: {num: 100}});

    watch(() => state.name, (newVal, oldVal) => {
        console.log("newVal: ", newVal);
        console.log("oldVal: ", oldVal);
    })

    setTimeout(() => {
        state.name = "Jack";
    }, 3000)

</script>
</body>
</html>
```



### 异步处理

先看下这个场景，当修改 state.age 时，watch 的回调函数中处理的是异步逻辑，并且本例中第2次修改 state.age 执行的比第1次快（类似于实际开发中，依次发送2个异步请求，结果后面发的请求结果先返回了）。按道理，document.body.innerHTML 中应该显示后一次的结果，但是如果我们的代码不做任何处理的话，最终显示的确是前一次的结果，原因是前一次执行的慢，覆盖掉了执行快那一次的结果。解决方案是引入 onCleanup 函数。

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/vue/dist/vue.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {watch, reactive} = VueReactivity;
    const state = reactive({name: "tom", age: 20});

    function getData(delay) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(delay);
            }, delay);
        });
    }

    let i = 3000;
    // watch(() => state.age, async (newValue, oldValue) => {
    //     i -= 1000;
    //     let r = await getData(i);
    //     document.body.innerHTML = r;
    // })
    watch(() => state.age, async (newValue, oldValue, onCleanup) => {
        let clear = false;
        onCleanup(() => {
            clear = true;
        });
        i -= 1000;
        let r = await getData(i);
        if (!clear) {
            document.body.innerHTML = r;
        }
    }, {flush: 'sync'})  // {flush: 'sync'} 我们没实现，这里没什么用.

    state.age = 30;
    state.age = 31;

</script>
</body>
</html>
```



### Cleanup

在 watch 内部封装一个 onCleanup 函数（类似于 Promise 内部封装 resolve、reject 函数），当数据更新触发watch内部执行用户传入的回调时，将onCleanup函数作为第3个参数传入，用户端可以接收到这个函数，调用并注入一个取消的回调（一般只用来修改标记）。这样，每次触发watch时，总是将上一次的clear标记清理掉（即置位true）。而UI更新会判断clear标记，从而保证UI总是显示最后一次异步处理的结果。

```js
 watch(() => state.age, async (newValue, oldValue, onCleanup) => {
        let clear = false;
        onCleanup(() => {
            clear = true;
        });
        i -= 1000;
        let r = await getData(i);
        if (!clear) {
            document.body.innerHTML = r;
        }
})
```

watch中具体实现：

```js
/**
 * @param source 用户传入的对象
 * @param cb 用户传入的回调
 */
export function watch(source: any, cb: FuncType) {
    let getter;
    if (isReactive(source)) {
        // 需要对source进行递归遍历，遍历的过程中会访问对象上的每一个属性，
        // 访问属性的时候就会触发收集我们在下面构造的这个effect.
        getter = () => traversal(source);
    } else if (isFunction(source)) {
        // 如果传入的本来就是函数，如: () => person.name，由于person是响应式对象，
        // 故 person.name 本身就会触发收集依赖，所以就不需要我们手动递归遍历去收集。
        getter = source;
    } else {
        return;
    }

    // 用于处理异步的清理函数
    let cleanup: FuncType;
    const onCleanup = (fn: FuncType) => {
        cleanup = fn; // 保存用户的函数
    }

    let oldValue: any;
    const job = () => {
        // 首次执行job时cleanup是undefined,下一次触发watch会执行上一次的cleanup，从而清理掉上一个cb中clear标记。
        if (cleanup) cleanup();
        const newValue = effect.run();
        cb(newValue, oldValue, onCleanup);
        oldValue = newValue;
    }
    // 监控自己构造的函数，数据变化后重新执行job.
    const effect = new ReactiveEffect(getter, job);

    oldValue = effect.run();
}
```



## Ref

### 原理分析

1. ref 的作用和reactive一样，都是将数据变成响应式。不同的是，reactive只能处理引用类型数据，而 ref 既可以处理引用类型数据，又可以处理基本类型数据。当处理基本类型数据时，它底层是通过 Object.defineProperty 来实现响应式，而处理引用类型数据时，它是调用了 reactive 函数，即底层使用 Proxy 实现响应式。
2. 调用 ref 函数返回的是一个 RefImpl 实例对象，RefImpl 是封装在 ref.ts 中的一个内部类，它支持 get value()、set value() 【底层还是 Object.defineProperty】。在RefImpl 的构造函数中，既要保存原始数据 rawValue， 又要根据数据类型来选择不同的响应式策略，如下所示。

![手写Vue3源码](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206102232757.png)

### 代码实现

```js
import {isObject} from "@vue/shared";
import {reactive} from "./reactive";
import {trackEffects, triggerEffects} from "./effect";

function toReactive(value: any) {
    return isObject(value) ? reactive(value) : value;
}

class RefImpl {
    public rawValue: any;
    public _value: any;
    public dep: Set<any> = new Set();
    public __v_isRef = true;

    constructor(rawValue: any,) {
        this.rawValue = rawValue;
        this._value = toReactive(rawValue);
    }

    get value() {
        trackEffects(this.dep);
        return this._value;
    }

    set value(newValue) {
        if (this.rawValue !== newValue) {
            this._value = toReactive(newValue);
            this.rawValue = newValue;
            triggerEffects(this.dep);
        }
    }
}


export function ref(value: any) {
    return new RefImpl(value);
}
```



### 测试用例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/vue/dist/vue.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {ref, effect} = VueReactivity;
    // const flag = ref(true);   // 基本类型数据
    const state = ref({name: "tom", age: 20, flag: true});  // 引用类型数据
    console.log(state);

    effect(() => {
        // document.body.innerHTML = flag.value ? "How are you?" : "Fine!"
        document.body.innerHTML = state.value.flag ? "How are you?" : "Fine!"
    })
		
    // 不断修改标记使页面不断更新
    setInterval(() => {
        // flag.value = !flag.value;
        state.value.flag = !state.value.flag;
    }, 2000)

</script>
</body>
</html>
```

![2022-06-10 22.34.41](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206102235207.gif)





## toRef & toRefs

- 作用：创建一个 ref 对象，其value值指向另一个对象中的某个属性。
- 语法：`const name = toRef(person,'name')`
- 应用:   要将响应式对象中的某个属性单独提供给外部使用时。


- 扩展：`toRefs` 与`toRef`功能一致，但可以批量创建多个 ref 对象，语法：`toRefs(person)`

  

### 使用示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/vue/dist/vue.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {reactive, effect, toRefs} = VueReactivity;
    const person = reactive({name: "tom", age: 20});

    // 直接解构person，name和age就丧失了响应式。而用toRefs则会将对象的所有属性都变成响应式
    // const {name, age} = person;
    const {name, age} = toRefs(person);

    effect(() => {
        document.body.innerHTML = `姓名：${name.value}, 年龄：${age.value}`;
    })

    setTimeout(() => {
        name.value = "jerry";
        age.value = "22";
    }, 2000)

</script>
</body>
</html>
```



### 代码实现

```js
class ObjectRefImpl {
    constructor(public target: any, public key: string) {
    }

    get value() {
        // target 是一个 Proxy 对象，故此处读取 this.target[this.key] 会收集依赖。
        return this.target[this.key];
    }

    set value(newValue) {
        // target 是一个 Proxy 对象，故此处修改 this.target[this.key] 会触发更新。
        this.target[this.key] = newValue;
    }
}

export function toRef(target: any, key: string) {
    return new ObjectRefImpl(target, key);
}

export function toRefs(target: any) {
    // target 是一个 Proxy 对象。
    let result = isArray(target) ? new Array(target.length) : ({} as Record<string, any>);
    for (let key in target) {
        result[key] = toRef(target, key);
    }
    return result;
}
```



## proxyRefs

### 使用示例

proxyRefs 的作用刚好与 toRefs 相反。它主要用于将零散的ref对象或普通变量组装成一个Proxy对象。如下所示：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!-- 引入官方的包 -->
    <!--    <script src="../../../node_modules/vue/dist/vue.global.js"></script>-->
    <!-- 引入打包好的文件 -->
    <script src="./reactivity.global.js"></script>
</head>

<body>
<div id="app"></div>

<script>
    const {ref, effect, proxyRefs} = VueReactivity;
    const name = ref("张三");
    const age = ref(18);

    // proxyRefs 用于将零散的ref对象或普通变量组装成新的Proxy对象。作用于toRefs相反。
    const person = proxyRefs({name, age, gender: 1});

    effect(() => {
        // person 是一个Proxy对象，故这里可以直接 person.name ，而不用使用 name.value 之类的语法。
        document.body.innerHTML = `姓名：${person.name}, 年龄：${person.age}`;
    })

    setTimeout(() => {
        person.name = "jerry";
        person.age = "22";
    }, 2000)

</script>
</body>
</html>
```



### 代码实现

```js
export function proxyRefs(object: any) {
    return new Proxy(object, {
        get(target, key, receiver) {
            const r = Reflect.get(target, key, receiver);
            // 如果是ref对象就返回.value，否则返回自己.
            return r.__v_isRef ? r.value : r;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (oldValue.__v_isRef) {
                oldValue.value = value;
                return true;  // 必须 return true
            } else {
                return Reflect.set(target, key, value, receiver);
            }
        },
    })
}
```



# Vue3渲染原理

## Runtime DOM

### 创建runtime-dom包

runtime-dom 是与浏览器平台相关的包。它里边主要包括浏览器dom相关的操作方法。runtime-dom 的目录结构如下：

![image-20220613222827657](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206132228005.png)



### nodeOps

nodeOps.ts 中主要封装常用DOM节点的操作，包括增删改查、设置元素内容等等。

```js
export const nodeOps = {
    // 增加
    createElement(tagName: string) {
        return document.createElement(tagName);
    },
    createText(text: string) {
        return document.createTextNode(text);
    },
    insert(child: Node, parent: Node, anchor = null) {
        // 当anchor为null时insertBefore等价于 appendChild
        parent.insertBefore(child, anchor);
    },
    // 删除
    remove(child: Node) {
        const parentNode = child.parentNode;
        if (parentNode) {
            parentNode.removeChild(child);
        }
    },
    // 修改
    // 设置元素中的内容
    setElementText(el: HTMLElement, text: string) {
        el.textContent = text;
    },
    // 设置文本节点
    setText(node: Node, text: string) {
        node.nodeValue = text;
    },
    // 查询
    querySelector(selector: string) {
        return document.querySelector(selector);
    },
    parentNode(node: Node) {
        return node.parentNode;
    },
    nextSibling(node: Node) {
        return node.nextSibling;
    },
}
```



### patchProps

```js
// attrs.ts
export function patchAttr(el: HTMLElement, key: string, nextValue: any) {
    if (nextValue) {
        el.setAttribute(key, nextValue);
    } else {
        el.removeAttribute(key);
    }
}


// class.ts
export function patchClass(el: HTMLElement, nextValue: any) {
    if (nextValue === null) {
        el.removeAttribute("class");
    } else {
        el.className = nextValue;
    }
}


// event.ts
import {FuncType} from "@vue/shared";

function createInvoker(callback: FuncType) {
    const invoker = (e: any) => invoker.value(e);
    invoker.value = callback;
    return invoker;
}

export function patchEvent(el: HTMLElement, eventName: string, nextValue: any) {
    // 可以先移除掉事件，再重新绑定
    let invokers = el._vei || (el.vei = {});
    let exist = invokers[eventName];

    if (exist) {
        if (nextValue) {
            invokers[eventName].value = nextValue;
        } else {
            el.removeEventListener(eventName.slice(2).toLowerCase(), exist);
            invokers[eventName] = undefined;
        }
    } else {
        let event = eventName.slice(2).toLowerCase();  // onClick => click
        if (nextValue) {
            const invoker = invokers[eventName] = createInvoker(nextValue);
            el.addEventListener(event, invoker);
        }
    }
}


// style.ts
export function patchStyle(el: HTMLElement, prevValue: any, nextValue: any) {
    // 样式需要比对差异 {color: 'red', fontSize: '16px'}  {color: 'blue'}
    for (let key in nextValue) {
        // @ts-ignore
        el.style[key] = nextValue[key];
    }
    if (prevValue) {
        for (let key in prevValue) {
            if (nextValue[key] === null) {
                // @ts-ignore
                el.style[key] = null;
            }
        }
    }
}


// patchProps
import {patchAttr} from "./modules/attr";
import {patchClass} from "./modules/class";
import {patchEvent} from "./modules/event";
import {patchStyle} from "./modules/style";


// 操作DOM属性
export function patchProp(el: HTMLElement, key: string, prevValue: any, nextValue: any) {
    if (key === "class") { // 类名 el.className
        patchClass(el, nextValue);
    } else if (key === "style") { // 样式 el.style
        patchStyle(el, prevValue, nextValue);
    } else if (/^on[^a-z]/.test(key)) { // events: onclick
        patchEvent(el, key, nextValue);
    } else { // 普通属性
        patchAttr(el, key, nextValue);
    }
}
```



### render方法

```js
import {nodeOps} from "./nodeOps";
import {patchProp} from "./patchProps";
import {createRenderer} from "@vue/runtime-core";

// 不同的平台的 renderOptions 的实现不一样，但是具体有什么行为都在 runtime-dom 里规定好了
export const renderOptions = Object.assign(nodeOps, {patchProp});

// 将虚拟DOM渲染出来
export function render(vnode: any, container: HTMLElement) {
    createRenderer(renderOptions).render(vnode, container);
}

// 将createRenderer、h 等导出
export * from "@vue/runtime-core";
```



## Runtime Core

### 创建runtime-core包

runtime-core  运行时核心，不依赖于平台（browser、test、小程序、app、canvas...）靠的是虚拟DOM。换句话说它是跨平台的，runtime-dom 依赖于它。它的目录结构如下所示：

> 注意：由于 runtime-core 不会单独拿出来用，故不需要打包 global 格式的包。pacakge.json buildOptions 中 formats 里就可以删掉 global 选项。

![image-20220613221406370](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206132214503.png)



### 虚拟节点实现

#### 形状标识

1. | 、& 运算符常用来进行权限控制、类型枚举等。关于 | 、&、^ 等基础知识参考[这里](https://note.youdao.com/s/YSav3ZWl)。此处主要用途是：通过组合可以描述虚拟节点的类型。

   > &：两者都为1才1、 | ：有一个为1则为1、两者相反才为1。

   ```js
   // Vue3提供的形状标识
   export const enum ShapeFlags {
       ELEMENT = 1,                                 // 2的0次方
       FUNCTIONAL_COMPONENT = 1 >> 1,               // 2的1次方
       STATEFULL_COMPONENT = 1 >> 2,                // 2的2次方
       TEXT_CHILDREN = 1 >> 3,                      // 2的3次方
       ARRAY_CHILDREN = 1 >> 4,
       SLOTS_CHILDREN = 1 >> 5,
       TELEPORT_CHILDREN = 1 >> 6,
       SUSPENSE = 1 >> 7,
       COMPONENT_SHOULD_KEEP_ALIVE = 1 >> 8,
       COMPONENT_KEEP_ALIVE = 1 >> 9,               // 2的9次方
       COMPONENT = ShapeFlags.STATEFULL_COMPONENT | ShapeFlags.FUNCTIONAL_COMPONENT   // 2 | 4 = 6 -> [0100 | 1000 = 1100]
   }
   ```

   

#### createVnode实现

createVnode 才是创建虚拟节点的根本方法，h 方法只不过封装了一层，让用户使用起来更加方便而已。

```js
// vnode.ts
import {isArray, isString, ShapeFlags} from "@vue/shared";

/**
 * 判断是否为虚拟DOM节点
 * @param value
 */
export function isVnode(value: any) {
    return !!(value && value.__v_isVnode)
}

/**
 * 创建VNode
 * @param type  组件的、元素的、文本的
 * @param props
 * @param children
 */
export function createVnode(type: string, props: any, children: any = null) {
    // 组合方案：shapeFlag
    let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;

    // 虚拟DOM就是一个对象，diff算法。真实DOM的属性比较多
    const vnode: Record<string, any> = {
        type,
        props,
        children,
        el: null, // 虚拟节点对应的真实节点，后续diff算法完成后渲染真实DOM要用到
        key: props?.key,
        __v_isVnode: true,
        shapeFlag
    };
    if (children) {
        let type = 0;
        if (isArray(children)) {
            type = ShapeFlags.ARRAY_CHILDREN;
        } else {
            // children = String(children);
            type = ShapeFlags.TEXT_CHILDREN;
        }
        vnode.shapeFlag |= type
    }

    return vnode;
}
```



#### h实现

h方法的使用方式非常多，它内部封装了一系列逻辑判断，目的是让用户使用起来更加方便。h 方法内部调用了 createVnode 方法创建虚拟节点。

```js
import {createVnode, isVnode} from "./vnode";
import {isArray, isObject} from "@vue/shared";

// h的用法有很多种:
// h("div")

// h("div", {style: {color: "red"}})
// h("div", h("span"))
// h("div", [h("span"), h("span")])
// h("div", "hello")

// h("div", {style:{color: "red"}}, "hello")
// h("div", null, h("span"))
// h("div", null, [h("span")])

// h("div", null, "hello", "world")
// h("div", null, h("span"), h("span"))

export function h(type: string, propsChildren: any, children: any) {
    const len = arguments.length;
    // h("div")
    if (len < 2) {
        return createVnode(type, null);
    } else if (len === 2) {
        // h("div", {style: {color: "red"}})
        // h("div", h("span"))
        // h("div", [h("span"), h("span")])
        // h("div", "hello")
        if (isArray(propsChildren)) {
            return createVnode(type, null, propsChildren);
        } else {
            if (isVnode(propsChildren)) {
                return createVnode(type, null, [propsChildren]);
            } else if (isObject(propsChildren)) {
                return createVnode(type, propsChildren);
            } else {
                return createVnode(type, null, propsChildren);
            }
        }
    } else if (len === 3) {
        // h("div", {style:{color: "red"}}, "hello")
        // h("div", null, h("span"))
        // h("div", null, [h("span")])
        if (isVnode(children)) {
            return createVnode(type, propsChildren, [children]);
        } else {
            return createVnode(type, propsChildren, children);
        }
    } else if (len > 3) {
        // h("div", null, "hello", "world")
        // h("div", null, h("span"), h("span"))
        children = Array.from(arguments).slice(2);
        return createVnode(type, propsChildren, children);
    }
}
```



### createRenderer初步实现

createRenderer 是vue3中引入的api，位于 runtime-core 包，主要用于创建自定义渲染器。也就是说，只要我们实现 renderOptions 中的平台相关方法（runtime-dom），就可以实现跨平台使用。它的初步代码实现如下所示：

```js
/**
 * @param renderOptions 不同的平台的 renderOptions 的实现不一样，
 * 但是具体有什么行为都在 runtime-dom 里规定好了
 */
import {ShapeFlags} from "@vue/shared";

export function createRenderer(renderOptions: any) {
    let {
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText,
        setText: hostSetText,
        parentNode: hostParentNode,
        nextSibling: hostNextSibling,
        createElement: hostCreateElement,
        createText: hostCreateText,
        patchProp: hostPatchProp
    } = renderOptions;

    // 渲染children到容器
    const mountChildren = (children: Array<any>, container: HTMLElement) => {
        for (let i = 0; i < children.length; i++) {
            patch(null, children[i], container);
        }
    }

    /**
     * 渲染真实DOM元素到容器
     * @param vnode
     * @param container
     */
    const mountElement = (vnode: any, container: any) => {
        let {type, props, children, shapeFlag} = vnode;
        // 将真实DOM元素挂载到虚拟节点，后续用于复用节点和更新
        let el = vnode.el = hostCreateElement(type);
        // 更新属性
        if (props) {
            for (let key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            hostSetElementText(el, children);
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            mountChildren(children, el);
        }
        // 将真实DOM添加到容器
        hostInsert(el, container);
    }

    /**
     * 更新真实DOM的方法
     * @param n1 上一次的虚拟节点
     * @param n2 本次的虚拟节点
     * @param container 容器
     */
    const patch = (n1: any, n2: any, container: any) => {
        if (n1 === n2) {
            return;
        }
        if (n1 === null) {
            // 初次渲染 后续还有组件的初次渲染，目前是元素的初始化渲染
            mountElement(n2, container);
        } else {
            // 更新流程
        }
    }

    const render = (vnode: any, container: any) => {
        if (vnode === null) {
            // 卸载逻辑

        } else {
            // patch 既包含初始化逻辑又包含更新逻辑
            patch(container._vnode || null, vnode, container);
        }
        container._vnode = vnode;
    }

    return {
        render
    }
}
```



### 测试创建真实DOM

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {createRenderer, h, render} = VueRuntimeDOM

    // h 方法用于创建虚拟DOM，render 方法用于渲染虚拟DOM。
    render(h("div", {style: {margin: "10px", padding: "10px", border: "1px solid #000000"}},
            h("h1", {style: {color: "red", cursor: "pointer"}, onClick: (e) => console.log(e.target.textContent)}, "hello world!"),
            h("h1", {style: {color: "blue"}}, "hello vue3!")),
        document.getElementById("app"));
</script>
</body>
</html>
```

![2022-06-13 23.57.52](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206140003797.gif)



### 处理文本节点

1. vnode.ts 增加类型导出

   ```js
   // 表示文本节点类型，例如：render(h(Text, "hello"));
   export const Text = Symbol("Text");
   ```

2. renderer.ts 改造，增加文本节点处理逻辑

   ```js
   import {isString, ShapeFlags} from "@vue/shared";
   import {createVnode, Text} from "./vnode";
   
   export function createRenderer(renderOptions: any) {
       let {
           insert: hostInsert,
           remove: hostRemove,
           setElementText: hostSetElementText,
           setText: hostSetText,
           parentNode: hostParentNode,
           nextSibling: hostNextSibling,
           createElement: hostCreateElement,
           createText: hostCreateText,
           patchProp: hostPatchProp
       } = renderOptions;
   
       const normalize = (child: any) => {
           if (isString(child)) {
               // 如果是字符串则手动创建文本节点（虚拟节点）
               return createVnode(Text, null, child);
           }
           return child;
       }
   
       // 渲染children到容器
       const mountChildren = (children: Array<any>, container: HTMLElement) => {
           for (let i = 0; i < children.length; i++) {
               // children[i] 有可能是个字符串，此时需要 normalize 一下，eg:
               let child = normalize(children[i]);
               patch(null, child, container);
           }
       }
   
       /**
        * 渲染真实DOM元素到容器
        * @param vnode
        * @param container
        */
       const mountElement = (vnode: any, container: any) => {
           let {type, props, children, shapeFlag} = vnode;
           // 将真实DOM元素挂载到虚拟节点，后续用于复用节点和更新
           let el = vnode.el = hostCreateElement(type);
           // 更新属性
           if (props) {
               for (let key in props) {
                   hostPatchProp(el, key, null, props[key]);
               }
           }
           if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
               hostSetElementText(el, children);
           } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
               mountChildren(children, el);
           }
           // 将真实DOM添加到容器
           hostInsert(el, container);
       }
   
       // 创建真实文本节点
       const processText = (n1: any, n2: any, container: any) => {
           if (n1 === null) {
               let el = n2.el = hostCreateText(n2.children);
               hostInsert(el, container);
           }
       }
   
       /**
        * 更新真实DOM的方法
        * @param n1 上一次的虚拟节点
        * @param n2 本次的虚拟节点
        * @param container 容器
        */
       const patch = (n1: any, n2: any, container: any) => {
           if (n1 === n2) {
               return;
           }
           const {type, shapeFlag} = n2;
           // 初次渲染
           if (n1 === null) {
               switch (type) {
                   // 文本节点单独处理
                   case Text:
                       processText(n1, n2, container);
                       break;
                   default:
                       if (shapeFlag & ShapeFlags.ELEMENT) {
                           mountElement(n2, container);
                       }
               }
           } else {
               // 更新流程
           }
       }
   
       const render = (vnode: any, container: any) => {
           if (vnode === null) {
               // 卸载逻辑
   
           } else {
               // patch 既包含初始化逻辑又包含更新逻辑
               patch(container._vnode || null, vnode, container);
           }
           container._vnode = vnode;
       }
   
       return {
           render
       }
   }
   ```

3. 示例代码

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <title>Title</title>
       <!--官方-->
       <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
       <script src="../dist/runtime-dom.global.js"></script>
   </head>
   <body>
   <div id="app"></div>
   
   <script>
       let {h, render, Text} = VueRuntimeDOM
   
       // h 方法用于创建虚拟DOM，render 方法用于渲染虚拟DOM。
       // 功能增强，增加文本节点的渲染.
       // 可以直接指明元素类型type为Text，也可以直接给字符串，代码中会解析为Text类型，并且创建一个文本节点出来。
       render(h(Text, "hello"), document.getElementById("app"));
       render(h("div", [h("h1", "hello"), "world"]), document.getElementById("app"));
   </script>
   </body>
   </html>
   ```

   

### 卸载DOM

```js
// html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render, Text} = VueRuntimeDOM

    // h 方法用于创建虚拟DOM，render 方法用于渲染虚拟DOM。
    render(h("div", {style: {margin: "10px", padding: "10px", border: "1px solid #000000"}},
            h("h1", {style: {color: "red", cursor: "pointer"}, onClick: (e) => console.log(e.target.textContent)}, "hello world!"),
            h("h2", {style: {color: "blue"}}, "hello vue3!")),
        document.getElementById("app"));

		// 卸载DOM
    setTimeout(() => {
        render(null, document.getElementById("app"));
    }, 2000)
</script>
</body>
</html>


// --------------------------------------------------------------------------------
// renderer.ts
const unmount = (vnode: any) => {
    hostRemove(vnode.el);
}

const render = (vnode: any, container: any) => {
  if (vnode === null) {
     // 卸载逻辑
     if (container._vnode) {
         unmount(container._vnode);
     }
  } else {
            // patch 既包含初始化逻辑又包含更新逻辑
      patch(container._vnode || null, vnode, container);
  }
  container._vnode = vnode;
}
```



# Vue3 Diff算法

## 前后元素不一致

新老虚拟节点不一致（前后完全没关系），直接删除老的，添加新的。

```js
//vnode.ts
/**
 * 判断两个虚拟节点是不是同一个节点，方法是：1.标签名相同；2.key是一样
 * @param n1
 * @param n2
 */
export function isSameVnode(n1: any, n2: any) {
    return n1.type === n2.type && n1.key === n2.key;
}


// ----------------------------------------------------------------------------------
// renderer.ts
const patch = (n1: any, n2: any, container: any) => {
        if (n1 === n2) {
            return;
        }
  

        // n1存在的情况下，判断2个元素是否相同，不相同则卸载老的，创建新的。
        if (n1 && !isSameVnode(n1, n2)) {
            unmount(n1);
            n1 = null;  // 置为null后会走初次渲染流程
        }
  
        const {type, shapeFlag} = n2;
        switch (type) {
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container);
                }
        }
}
```



## 前后元素一致

新老虚拟节点一致，复用老虚拟节点对应的真实DOM（节省性能）。属性和children可能不一样，先对比属性，再对比children。

```js
const processElement = (n1: any, n2: any, container: any) => {
    if (n1 == null) {
       // 初次渲染
       mountElement(n2, container);
    } else {
        // 更新流程
        patchElement(n1, n2, container);
    }
};

// 更新元素(先复用节点，再比较属性，再比较children)
const patchElement = (n1: any, n2: any, container: any) => {
 		// 复用节点
    let el = n2.el = n1.el;
    // 比较属性
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    // 比较children
    patchChildren(n1, n2);
}; 
```



## 子元素比较情况

| **新儿子** | **旧儿子** | **操作方式**             |
| ---------- | ---------- | ------------------------ |
| 文本       | 数组       | 删除老儿子，设置文本内容 |
| 文本       | 文本       | 更新文本即可             |
| 文本       | 空         | 更新文本即可(与上面类似) |
| 数组       | 数组       | diff算法                 |
| 数组       | 文本       | 清空文本，进行挂载       |
| 数组       | 空         | 进行挂载(与上面类似)     |
| 空         | 数组       | 删除所有儿子             |
| 空         | 文本       | 清空文本                 |
| 空         | 空         | 无需处理                 |

```js
// 比较2个虚拟节点的children
    const patchChildren = (n1: any, n2: any, el: any) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 新的是文本
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组，删除老的儿子
                unmountChildren(c1);
            }
            // 老的是文本或空都要更新文本
            if (c1 !== c2) {
                hostSetElementText(el, c2);
            }
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 新的是数组
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组，diff 算法

            } else {
                // 老的不管是文本还是空，都可以走下面流程
                hostSetElementText(el, "");
                mountChildren(c2, el);
            }
        } else {
            // 新的是空
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 老的是数组，删除老儿子
                unmountChildren(c1);
            } else {
                // 老的不管是文本还是空都可以走下面流程
                if (c1 !== c2) {
                    hostSetElementText(el, c2);
                }
            }
        }
    };
```



## 核心Diff算法

### sync from start

从头开始比较，长得一样的就略过，只比较那些不一样的。

![image-20220615205026363](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160018283.png)

a、b: 复用     c: 移除     d、e: 新增

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render} = VueRuntimeDOM

    render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c")
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "a"}, "a"),
            h("li", {key: "b"}, "b"),
            h("li", {key: "d"}, "d"),
            h("li", {key: "e"}, "e")
        ]), document.getElementById("app"));
    }, 2000)
</script>
</body>
</html>
```

```js
 const patchKeyedChildren = (c1: any, c2: any, el: any) => {
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = c2.length - 1;
        while (i <= e1 && i <= e2) {
            let n1 = c1[i];
            let n2 = c2[i];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, el);
            } else {
                break;
            }
            i++;
        }
   		  console.log(i, e1, e2);  // 2 3 4
 }
```



### sync from end

从头末尾开始比较，长得一样的就略过，只比较那些不一样的。

![image-20220615211835502](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160018892.png)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render} = VueRuntimeDOM

    render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c")
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "d"}, "d"),
            h("li", {key: "e"}, "e"),
            h("li", {key: "b"}, "b"),
            h("li", {key: "c"}, "c")
        ]), document.getElementById("app"));
    }, 2000)
</script>
</body>
</html>
```

```js
while (i <= e1 && i <= e2) {
    let n1 = c1[e1];
    let n2 = c2[e2];
    if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
    } else {
        break;
    }
    e1--;
    e2--;
}
console.log(i, e1, e2);  // 0 0 1
```



### common sequence + mount

同序列挂载：i 比 e1 大说明有新增的，i 和 e2 之间的部分就是需要新增的部分。

![image-20220615213341595](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160018666.png)

![image-20220615213615071](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160019156.png)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render} = VueRuntimeDOM

    render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c")
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "a"}, "a"),
            h("li", {key: "b"}, "b"),
            h("li", {key: "c"}, "c"),
            h("li", {key: "d"}, "d")
        ]), document.getElementById("app"));
    }, 2000)
  
  // ----------------------------------------------------------------
  render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c")
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "d"}, "d"),
            h("li", {key: "a"}, "a"),
            h("li", {key: "b"}, "b"),
            h("li", {key: "c"}, "c")
        ]), document.getElementById("app"));
    }, 2000)
</script>
</body>
</html>
```

```js
if (i > e1) {
    if (i <= e2) {
        while (i <= e2) {
            let nextPos = e2 + 1;  // e2后面有元素表示往前插(insertBefore),没有元素则表示往后插(appendChild)
            let anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor); // 创建新节点扔到容器中
            i++;
        }
    }
}
```



### common sequence + unmount

同序列卸载：i 比 e2 大说明有卸载的，i 和 e1 之间的部分就是需要卸载的部分。

![image-20220615222044275](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160019674.png)

![image-20220615221623413](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160019226.png)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render} = VueRuntimeDOM

    render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c")
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "a"}, "a"),
            h("li", {key: "b"}, "b")
        ]), document.getElementById("app"));
    }, 2000)
  
  //-----------------------------------------------------------------------
   render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c")
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "b"}, "b"),
            h("li", {key: "c"}, "c")
        ]), document.getElementById("app"));
    }, 2000)
</script>
</body>
</html>
```

```js
if (i > e1) {
    // common sequence + mount i 比 e1 大说明有新增的，i 和 e2 之间的部门就是需要新增的部分。
    if (i <= e2) {
        while (i <= e2) {
            let nextPos = e2 + 1;  // e2后面有元素表示往前插(insertBefore),没有元素则表示往后插(appendChild)
            let anchor = nextPos < c2.length ? c2[nextPos].el : null;
            patch(null, c2[i], el, anchor); // 创建新节点扔到容器中
            i++;
        }
    }
} else if (i > e2) {
    // common sequence + unmount: 同序列卸载：i 比 e2 大说明有卸载的，i 和 e1 之间的部门就是需要卸载的部分。
    if (i <= e1) {
        while (i <= e1) {
            unmount(c1[i]);  // 卸载元素
            i++;
        }
    }
}
```



### unknown sequence

乱序排列：如下图所示，蓝色虚线框部分就是乱序。

经过前面几轮diff优化算法处理后，i=2, e1=4, e2=5，剩下的部分仍然有可以复用的，我们要实现的是 c、d、e 仍然复用原来的，h 是新增加的，创建并插入即可。那么可以将新的节点做一个映射表，去老的里边查找，找到了就复用，找不到就新建。

![image-20220616001339269](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160019265.png)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render} = VueRuntimeDOM

    render(h("ul", {style: {color: "red"}}, [
        h("li", {key: "a"}, "a"),
        h("li", {key: "b"}, "b"),
        h("li", {key: "c"}, "c"),
        h("li", {key: "d"}, "d"),
        h("li", {key: "e"}, "e"),
        h("li", {key: "gg"}, "gg"),
        h("li", {key: "f"}, "f"),
        h("li", {key: "g"}, "g"),
    ]), document.getElementById("app"));

    setTimeout(() => {
        render(h("ul", {style: {color: "red"}}, [
            h("li", {key: "a"}, "a"),
            h("li", {key: "b"}, "b"),
            h("li", {key: "e"}, "e"),
            h("li", {key: "c"}, "c"),
            h("li", {key: "d"}, "d"),
            h("li", {key: "h"}, "h"),
            h("li", {key: "f"}, "f"),
            h("li", {key: "g"}, "g"),
        ]), document.getElementById("app"));
    }, 2000)
</script>
</body>
</html>
```

```js
// -----------------------------------diff算法实现乱序比对------------------------------------
// unknown sequence
const s1 = i;
const s2 = i;
// map里存储的是新children的key和索引的映射关系: {key1: index1, key2: index2}
const keyToNewIndexMap = new Map();
const toBePatched = e2 - s2 + 1;  // 即将进行比对的新节点的个数
const newIndexToOldIndexMap = new Array(toBePatched).fill(0);  // 一个记录是否已经比对过的映射表
for (let i = s2; i <= e2; i++) {
    keyToNewIndexMap.set(c2[i].key, i);
}
console.log(keyToNewIndexMap);
// 循环老children，看一下新的里边有没有？
// 如果有则复用并对比差异，如果老的有新的没有则删除，如果老的没有新的有则添加。
for (let i = s1; i <= e1; i++) {
    const oldChild = c1[i];
    const newIndex = keyToNewIndexMap.get(oldChild.key);
    if (newIndex === undefined) {
        unmount(oldChild);
    } else {
        // 由于数组中的元素默认是0，而i也可能是0，为了以示区分，故这里故意+1。
        // 其实数组元素的具体值不重要，后面也不会使用，仅仅用于区分0或非0,
        // 0表示没有比对过，非0表示对比过。
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        patch(oldChild, c2[newIndex], el);
    }
}
console.log("newIndexToOldIndexMap: ", newIndexToOldIndexMap);  // [5, 3, 4, 0]
// 需要移动位置（倒序遍历，因为可能需要使用insertBefore）
for (let i = toBePatched - 1; i >= 0; i--) {
    let index = i + s2;  // c2的索引
    let current = c2[index]; // c2中最后一个需要比对的节点
    let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
    if (newIndexToOldIndexMap[i] === 0) {
        // 当前节点没有比对过，需要创建
        patch(null, current, el, anchor);
    } else {
        // 当前节点比对过，插入到下一个节点之前
        hostInsert(current.el, el, anchor);
    }
}
```



## 最长递增子序列

### 最优情况

按照之前的diff算法实现乱序比对的方案是有缺陷的。因为它的逻辑是从后往前挨个去插入，但就本例而言，最优情况实际上是 h 需要新建的、c和d直接拿下来、e插入到c之前。因为如果新旧节点本来就有很多相同的节点(顺序也相同)，其实没有必要挨个遍历，这样性能不够好。

![image-20220616072032264](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160725029.png)



### 二分查找最长递增个数

最长递增子序列的概念及实现代码如下：

```js
// 求最长递增子序列的个数

// 3 2 8 9 5 6 7 11 15

// 递增子序列1：2 8 9 11 15
// 递增子序列2：2 5 6 7 11 15
// 所以最长递增子序列是序列2

// 查找过程：
// 3
// 2
// 2 8
// 2 8 9
// 2 5 9
// 2 5 6
// 2 5 6 7
// 2 5 6 7 11
// 2 5 6 7 11 15

// 总结思路：依次遍历原来的乱序队列
// 1.如果当前正在遍历的元素比已有递增子序列中的最后一个元素大，则直接追加到已有递增序列末尾；
// 2.如果当前正在遍历的元素比已有递增子序列中的最后一个元素小，则通过二分查找找到递增子序列中比当前元素大的那个元素，用当前元素替换掉它。
// 3.最优的情况就是默认全部递增.

function getSequence(arr: Array<number>) {
    const len = arr.length;
    // 注意：result 中存储的是索引而不是具体的值。递增子序列默认从原序列arr的第0项开始。
    const result = [0];
    // 递增子序列中最后一个元素在原序列中的索引值，默认也是0.
    let resultLastIndex = 0;
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
        let current = arr[i];
        // 忽略0，因为diff算法中0表示没有对比过，是新加入的元素，要创建。
        if (current !== 0) {
            resultLastIndex = result[result.length - 1]; // result中的值对应的是arr中的索引
            if (arr[resultLastIndex] < current) {
                // 如果递增子序列的最后一个元素(其实对应的是arr中某个元素的索引)对应arr中的值，
                // 比当前正在遍历的元素小，则直接追加当前正在遍历元素的索引进递增子序列.
                result.push(i);
            } else {
                // 如果递增子序列的最后一个元素(其实对应的是arr中某个元素的索引)对应arr中的值，
                // 比当前正在遍历的元素大，则二分查找递增子序列，找到比它大的索引。
                start = 0;
                end = result.length - 1;
                while (start < end) {
                    middle = ((start + end) / 2) | 0;
                    if (arr[result[middle]] < current) {
                        start = middle + 1;
                    } else {
                        end = middle;
                    }
                }
                // 用当前正在遍历的元素的索引，替换掉找到的索引。
                if (arr[result[end]] > current) {
                    result[end] = i;
                }
            }
        }
    }

    return result;
}

let arr = [3,2,8,9,5,6,7,11,15];
let result = getSequence(arr);
console.log(result);   // result里存储的是arr里的索引.  [ 1, 4, 5, 6, 7, 8 ]

let str = "";
for(let i=0; i<result.length; i++){
    str += arr[result[i]] + " "
}
console.log(str);  // 2 5 6 7 11 15
```



**注意：上面的逻辑只能求最长递增子序列的个数，并不能保证顺序一定正常。下面进行说明。**

如下所示，按照我们前面的思路，最终得出的最长递增子序列是：1 3 4 6 7 9，虽然它看起来是递增的，但是却脱离了实际，因为原数组 1 在 3 的后面， 4 也在6 7 9 的后面。解决办法是遍历每个元素时都记录一下它之前一个元素的索引，最后再追溯回去。

![image-20220616092630279](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160926477.png)



### 前驱节点追溯

**记录过程：从第一个元素开始。**

1. 2的前面没有元素，故不记录索引；
2. 3的前面是2，2的索引是0，故记录索引0；
3. 1替换掉2(变成1 3)，故1的前面也没有元素，故不记录索引；
4. 5的前面是3，3的索引是1，故记录索引1；
5. 6的前面是5，5的索引是3，故记录索引3；
6. 8的前面是6，6的索引是4，故记录索引4；
7. 7要替换掉8，替换后7的前面是6，6的索引是4，故记录索引4；
8. 9的前面是7，7的索引是6，故记录索引6；
9. 4的前面是3，3的索引是1，故记录索引1；

![image-20220616093918624](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160939353.png)



**追溯过程：从最后一个元素9开始。**

1. 9对应的索引是7，9记录的索引是6，故它之前的元素的索引是6
   索引：7  6
2. 索引6对应的元素是7，7记录的索引是4，故它之前的元素的索引是4
   索引：7  6  4
3. 索引4对应的元素是6，6记录的索引是3，故它之前的元素的索引是3
   索引：7  6  4  3
4. 索引3对应的元素是5，5记录的索引是1，故它之前的元素的索引是1
   索引：7  6  4  3  1
5. 索引1对应的元素是3，3记录的索引是0，故它之前的元素的索引是0
   索引：7  6  4  3  1  0
6. 最终追溯出的索引升序排列为：0  1  3  4  6  7
   对应的数值为：   2  3  5  6  7  9。
7. 最长递增子序列就是  2  3  5  6  7  9。

![image-20220616093945224](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206160939610.png)



**前驱节点追溯最终代码实现：**

```js
// 求最长递增子序列的个数

// 3 2 8 9 5 6 7 11 15

// 递增子序列1：2 8 9 11 15
// 递增子序列2：2 5 6 7 11 15
// 所以最长的是序列2

// 查找过程：
// 3
// 2
// 2 8
// 2 8 9
// 2 5 9
// 2 5 6
// 2 5 6 7
// 2 5 6 7 11
// 2 5 6 7 11 15

// 总结思路：依次遍历原来的乱序队列
// 1.如果当前正在遍历的元素比已有递增子序列中的最后一个元素大，则直接追加到已有递增序列末尾；
// 2.如果当前正在遍历的元素比已有递增子序列中的最后一个元素小，则通过二分查找找到递增子序列中比当前元素大的那个元素，用当前元素替换掉它。
// 3.最优的情况就是默认全部递增.

function getSequence(arr: Array<number>) {
    const len = arr.length;
    // 注意：result 中存储的是arr的索引而不是具体的值。递增子序列默认从arr的第0项开始。
    const result = [0];
    // 递增子序列中最后一个元素在原序列中的索引值，默认也是0.
    let resultLastIndex = 0;
    // p用于在遍历原数组时，记录原数组中元素的索引，所以要和原数组长度保持一致.
    let p = new Array(arr.length).fill(undefined);
    let start;
    let end;
    let middle;
    for (let i = 0; i < len; i++) {
        let current = arr[i];
        // 忽略0，因为diff算法中0表示没有对比过，是新加入的元素，要创建。
        if (current !== 0) {
            resultLastIndex = result[result.length - 1]; // result中的值对应的是arr中的索引
            if (arr[resultLastIndex] < current) {
                // 如果递增子序列的最后一个元素(其实对应的是arr中某个元素的索引)，它对应在arr中的值，
                // 比当前正在遍历的元素小，则直接追加当前正在遍历元素的索引进递增子序列.
                result.push(i);
                p[i] = resultLastIndex;  // 元素i放进去后要记得记录递增子序列中它之前的元素的索引
            } else {
                // 如果递增子序列的最后一个元素(其实对应的是arr中某个元素的索引)，它对应在arr中的值，
                // 比当前正在遍历的元素大，则二分查找递增子序列，找到比它大的最小的索引。
                start = 0;
                end = result.length - 1;
                while (start < end) {
                    middle = ((start + end) / 2) | 0;
                    if (arr[result[middle]] < current) {
                        start = middle + 1;
                    } else {
                        end = middle;
                    }
                }
                // 用当前正在遍历的arr元素的索引，替换掉找到的result中的元素。
                if (arr[result[end]] > current) {
                    result[end] = i;
                    // p中存的是arr的索引，对应与result数组里元素的值，end-1表示被替换位置的上一个位置.
                    p[i] = result[end - 1];
                }
            }
        }
    }

    // 倒叙追溯
    console.log("result: ", result);
    console.log("p: ", p);
    let i = result.length - 1;
    let last = result[i];  // last在result中是值，但在arr、p中代表的是索引
    while (i >= 0) {
        result[i] = last;
        last = p[last];  // p[last] 表示的是arr中第last号位元素记录的前一个元素的索引
        i--;
    }

    return result;
}


// 测试用例
// let arr = [3, 2, 8, 9, 5, 6, 7, 11, 15];
let arr = [2, 3, 1, 5, 6, 8, 7, 9, 4];
let result = getSequence(arr);
console.log(result);

let str = "[";
for (let i = 0; i < result.length; i++) {
    str += arr[result[i]] + " "
}
console.log(str + "]");
```



**测试用例输出结果（ let arr = [2, 3, 1, 5, 6, 8, 7, 9, 4] ）：**

![image-20220616113252108](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206161132583.png)



### 优化Diff算法

将最长递增子序列的思路应用到diff算法中：

```js
console.log("newIndexToOldIndexMap: ", newIndexToOldIndexMap);  // [5, 3, 4, 0]  e,c,d,h
let increment = getSequence(newIndexToOldIndexMap); // increment:[1, 2] -> [3,4] -> c,d 不用动
let j = increment.length - 1;

// 需要移动位置（倒序遍历，因为可能需要使用insertBefore）
for (let i = toBePatched - 1; i >= 0; i--) {
    let index = i + s2;  // c2的索引
    let current = c2[index]; // c2中最后一个需要比对的节点
    let anchor = index + 1 < c2.length ? c2[index + 1].el : null;
    if (newIndexToOldIndexMap[i] === 0) {
        // 当前节点没有比对过，需要创建
        patch(null, current, el, anchor);
    } else {
        if (i !== increment[j]) {
            // 当前节点在递增子序列中不存在，并且节点比对过，执行插入操作即可
            hostInsert(current.el, el, anchor);
        } else {
            // 当前节点在递增子序列中存在，并且也比对过，直接跳过.
            j--;
        }
    }
}
```



对比一下使用最长递增子序列优化和不使用的区别（前者使用后者不使用）：肉眼可见前者只有2个 li 标签变动(图中表现为闪了一下)，而后者有4个 li 标签变动。

> 前者如果算上 gg 这个卸载的元素，应该有3个变动，而后者如果算上 gg ，则有5个变动。不过 gg 一是变化太快，二是前后都有的相同动作，是等价的，不再我们讨论之列。	

![2022-06-16 13.13.17](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206161317380.gif)



![2022-06-16 13.14.06](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206161316797.gif)



## Fragment的实现

Vue3中Fragment的作用和React类似，都是用于包裹多个子元素，渲染真实DOM时不会渲染Fragment。

为什么Vue中不能直接渲染多个子元素，类似下面这种呢？

```js
render([
  h("h1", "hello"), 
  h("h1", "world")
], document.getElementById("app")
)
```

因为render方法的参数有限制，它只接收单个虚拟节点：

```js
const render = (vnode: any, container: any) => {
    if (vnode == null) {
        // 卸载逻辑
        if (container._vnode) {
            unmount(container._vnode);
        }
    } else {
        // patch 既包含初始化逻辑又包含更新逻辑
        patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
}
```



所以Vue3中为了解决这个问题，才模仿React内置了一个Fragment。具体用法如下：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <!--官方-->
    <!--    <script src="../../../node_modules/@vue/runtime-dom/dist/runtime-dom.global.js"></script>-->
    <script src="../dist/runtime-dom.global.js"></script>
</head>
<body>
<div id="app"></div>

<script>
    let {h, render, Fragment} = VueRuntimeDOM

    render(h(Fragment, [h("h1", "hello"), h("h1", "world")]),
        document.getElementById("app")
    )

    setTimeout(() => {
        render(h(Fragment, [h("h1", "good"), h("h1", "morning")]),
            document.getElementById("app")
        )
    }, 2000)
</script>
</body>
</html>
```



render.ts 中实现如下：

```js
const processFragment = (n1: any, n2: any, container: any) => {
    if (n1 == null) {
        mountChildren(n2.children, container);
    } else {
        patchChildren(n1, n2, container);
    }
}
```



效果如下：

![2022-06-17 07.46.23](https://yuanchaowhut.oss-cn-hangzhou.aliyuncs.com/images/202206170747646.gif)



# 组件渲染原理

