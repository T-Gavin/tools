"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="libs/typings/node.d.ts"/>
///<reference path="libs/typings/uglifyjs.d.ts"/>
///<reference path="libs/typings/pngjs.d.ts"/>
///<reference path="libs/typings/jszip.d.ts"/>
const path = require("path");
// 文件操作库
const fs = require("fs");
// zip库
const jszip = require("./libs/jszip/jszip");
// 代码压缩库
const uglify = require("./libs/uglifyjs/uglifyjs");
/**
 * 文 件 名：Tools1
 * 内    容：
 * 功    能：
 * 作    者：WangLiMing
 * 小    组：h5项目组-技术部
 * 生成日期：18/6/7 12:20
 * 版 本 号：v1.0.0
 * 修改日期：18/6/7 12:20
 * 修改日志：
 * 版权说明：Copyright (c) 2018,WangLiMing All rights reserved.
 */
class Tools {
    // 编译
    static build() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            // 路径
            let path = "../libs/";
            // UglifyJS参数参考这个页面：https://github.com/mishoo/UglifyJS2
            let result = uglify.minify([path + "tiny.js", "libs/debug/debug.js", "libs/jszip/jszip.min.js"]);
            if (result.code) {
                yield this.saveFile(path + "tiny.min.js", result.code);
                console.error("编译成功，用时->", this.getUseTime());
            }
            else {
                console.error("编译失败...");
            }
        });
    }
    // 发布
    static publish() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            let zip = new jszip();
            // 所有资源
            let files = yield this.getFiles(this.assetsPath);
            let resData = [];
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                resData.push({
                    path: file.path.replace(this.assetsPath, ""),
                    buffer: yield fs.readFileSync(file.path)
                });
            }
            // 添加进去
            for (let i = 0; i < resData.length; i++) {
                zip.file(resData[i].path, resData[i].buffer);
            }
            let data = zip.generate({
                base64: false,
                compression: "DEFLATE",
                type: "uint8array",
                compressionOptions: { level: 9 }
            });
            // 检测文件夹
            yield this.checkDir(this.releaseAssetsPath);
            // 需要写入的数据
            let buffer = Buffer.concat([this.getKey(), data]);
            // 写入
            yield fs.writeFileSync(this.releaseAssetsPath + "/resource.dat", buffer);
            // 游戏js
            let mainResult = uglify.minify("../src/main.js");
            if (mainResult.code) {
                yield this.saveFile(this.releasePath + "/main.min.js", mainResult.code);
                // 库文件
                yield this.checkDir(this.releaseLibPath);
                let tinyResult = yield fs.readFileSync("../libs/tiny.min.js");
                yield this.saveFile(this.releaseLibPath + "/tiny.min.js", tinyResult);
                // index
                let indexResult = yield fs.readFileSync("../index.html");
                let indexStr = indexResult.toString();
                indexStr = indexStr.replace("libs/tiny.js", "libs/tiny.min.js");
                indexStr = indexStr.replace("src/main.js", "main.min.js");
                let index1 = indexStr.indexOf("'[\"");
                let index2 = indexStr.indexOf("\"]'");
                let rstr = indexStr.substring(index1, index2 + 3);
                indexStr = indexStr.replace(rstr, "'[\"resource.dat\"]'");
                yield this.saveFile(this.releasePath + "/index.html", indexStr);
                console.log("发布完成，用时->", this.getUseTime());
            }
            else {
                console.error("编译失败...");
            }
        });
    }
    // 发布默认项目
    static template() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.build();
            yield this.checkDir(this.templatePath + "/libs/");
            yield this.copyFile("../libs/tiny.d.ts", this.templatePath + "libs/tiny.d.ts");
            yield this.copyFile("../libs/tiny.js", this.templatePath + "libs/tiny.js");
            yield this.copyFile("../libs/tiny.min.js", this.templatePath + "libs/tiny.min.js");
            console.log("库发布成功，用时->", this.getUseTime());
        });
    }
    //---------------------------------------公用类
    // 实例化路径
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            let projectName = yield this.getProjectName();
            this.releasePath = "../release/" + projectName;
            this.releaseAssetsPath = this.releasePath + "/assets/";
            this.releaseLibPath = this.releasePath + "/libs/";
            this.now = Date.now();
        });
    }
    // 获取使用时间
    static getUseTime() {
        return ((Date.now() - this.now) / 1000).toFixed(2) + "s";
    }
    /**
     * 获取资源
     * @param {string} path
     * @param {Array<string>} files
     * @returns {Promise<Array<string>>}
     */
    static getFiles(path, files = []) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield fs.statSync(path).isFile()) {
                // 图集只存在一个sheet即可
                let res = this.getFileType(path);
                files.push({
                    path: path.replace(/\/\//g, "/"),
                    name: res[0],
                    type: res[1]
                });
            }
            else {
                yield fs.readdirSync(path).forEach((file) => __awaiter(this, void 0, void 0, function* () {
                    yield this.getFiles(path + "/" + file, files);
                }));
            }
            return files;
        });
    }
    /**
     * 解析一个资源连接
     * @param {string} url 连接
     * @returns {{}}
     */
    static getFileType(url) {
        let arr = url.split("/");
        let arr1 = arr[arr.length - 1].split(".");
        if (arr1.length > 1) {
            return [arr1[0], (arr1[arr1.length - 1]).toLowerCase()];
        }
        else {
            console.error("找不到该文件类型->", url);
        }
    }
    /**
     * 创建文件夹，不存在自动创建
     * @param {string | Buffer} dirPath
     * @returns {Promise<boolean>}
     */
    static checkDir(dirPath) {
        return __awaiter(this, void 0, void 0, function* () {
            dirPath = path.resolve(dirPath);
            let exist = yield fs.existsSync(dirPath);
            if (exist) {
                return true;
            }
            else {
                let arr = dirPath.split(/[\/\\]/), url = "";
                for (let i in arr) {
                    url += arr[i + ""] + "/";
                    !fs.existsSync(url) && (yield fs.mkdirSync(url));
                }
                return true;
            }
        });
    }
    /**
     * 获取key
     * @returns {[]}
     */
    static getKey() {
        let keys = new Buffer(10);
        for (let i = 0; i < 10; i++) {
            keys[i] = (Math.floor(Math.random() * 100));
        }
        return keys;
    }
    /**
     * 保存文件
     * @param {string} path
     * @param {Buffer} data
     * @returns {Promise<void>}
     */
    static saveFile(path, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // 写入文件
            yield fs.writeFileSync(path, data);
        });
    }
    /**
     * 复制文件
     * @param {string} path
     * @param {string} toPath
     * @returns {Promise<void>}
     */
    static copyFile(path, toPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let buffer = yield fs.readFileSync(path);
            // 写入文件
            yield fs.writeFileSync(toPath, buffer);
        });
    }
    /**
     * 获取项目名
     * @returns {Promise<string>}
     */
    static getProjectName() {
        return __awaiter(this, void 0, void 0, function* () {
            let str = path.resolve("../../").toString();
            str = str.split("\\");
            return str[str.length - 1];
        });
    }
}
// 资源路径
Tools.assetsPath = "../assets/";
// 模板路径
Tools.templatePath = "../../../template/client/";
// 参数
let param = decodeURIComponent(process.argv[2]);
if (typeof Tools[param] == "function") {
    Tools[param]();
}
