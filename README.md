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



