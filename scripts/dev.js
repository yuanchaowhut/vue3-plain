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
