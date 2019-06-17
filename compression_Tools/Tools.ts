///<reference path="libs/typings/node.d.ts"/>
///<reference path="libs/typings/uglifyjs.d.ts"/>
///<reference path="libs/typings/pngjs.d.ts"/>
///<reference path="libs/typings/jszip.d.ts"/>
import * as path from "path";
// 文件操作库
const fs = require("fs");
// zip库
const jszip = require("./libs/jszip/jszip");
// 代码压缩库
const uglify = require("./libs/uglifyjs/uglifyjs");

class Tools {
    // 资源路径
    private static assetsPath = "../assets/";
    // 发布的路径
    private static releasePath: string;
    // 发布的资源路径
    private static releaseAssetsPath: string;
    // 发布的lib路径
    private static releaseLibPath: string;
    // 模板路径
    private static templatePath: string = "../../../template/client/";

    // 编译
    public static async build() {
        await this.init();
        // 路径
        let path = "../libs/";
        // UglifyJS参数参考这个页面：https://github.com/mishoo/UglifyJS2
        let result = uglify.minify([path + "tiny.js", "libs/debug/debug.js", "libs/jszip/jszip.min.js"]);
        if (result.code) {
            await this.saveFile(path + "tiny.min.js", result.code);
            console.error("编译成功，用时->", this.getUseTime());
        } else {
            console.error("编译失败...");
        }
    }

    //---------------------------------------公用类
    // 实例化路径
    private static async init() {
        let projectName = await this.getProjectName();
        this.releasePath = "../release/" + projectName;
        this.releaseAssetsPath = this.releasePath + "/assets/";
        this.releaseLibPath = this.releasePath + "/libs/";
        this.now = Date.now();
    }


    private static now: number;

    // 获取使用时间
    private static getUseTime() {
        return ((Date.now() - this.now) / 1000).toFixed(2) + "s";
    }

    /**
     * 获取资源
     * @param {string} path
     * @param {Array<string>} files
     * @returns {Promise<Array<string>>}
     */
    private static async getFiles(path: string, files: Array<{ path: string, name: string, type: string }> = []) {
        if (await fs.statSync(path).isFile()) {
            // 图集只存在一个sheet即可
            let res = this.getFileType(path);
            files.push({
                path: path.replace(/\/\//g, "/"),
                name: res[0],
                type: res[1]
            });
        } else {
            await fs.readdirSync(path).forEach(async (file) => {
                await this.getFiles(path + "/" + file, files);
            });
        }
        return files;
    }


    /**
     * 解析一个资源连接
     * @param {string} url 连接
     * @returns {{}}
     */
    private static getFileType(url: string) {
        let arr = url.split("/");
        let arr1 = arr[arr.length - 1].split(".");
        if (arr1.length > 1) {
            return [arr1[0], (arr1[arr1.length - 1]).toLowerCase()];
        } else {
            console.error("找不到该文件类型->", url)
        }
    }

    /**
     * 创建文件夹，不存在自动创建
     * @param {string | Buffer} dirPath
     * @returns {Promise<boolean>}
     */
    private static async checkDir(dirPath: string | Buffer): Promise<boolean> {
        dirPath = path.resolve(dirPath);
        let exist = await fs.existsSync(dirPath);
        if (exist) {
            return true;
        } else {
            let arr = dirPath.split(/[\/\\]/), url = "";
            for (let i in arr) {
                url += arr[i + ""] + "/";
                 !fs.existsSync(url) && await fs.mkdirSync(url);
            }
            return true;
        }
    }

    /**
     * 获取key
     * @returns {[]}
     */
    private static getKey() {
        let keys: Buffer = new Buffer(10);
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
    private static async saveFile(path: string, data: Buffer) {
        // 写入文件
        await fs.writeFileSync(path, data);
    }

    /**
     * 复制文件
     * @param {string} path
     * @param {string} toPath
     * @returns {Promise<void>}
     */
    private static async copyFile(path: string, toPath: string) {
        let buffer = await fs.readFileSync(path);
        // 写入文件
        await fs.writeFileSync(toPath, buffer);
    }

    /**
     * 获取项目名
     * @returns {Promise<string>}
     */
    private static async getProjectName() {
        let str: any = path.resolve("../../").toString();
        str = str.split("\\");
        return str[str.length - 1];
    }
}

// 参数
let param = decodeURIComponent(process.argv[2]);
if (typeof Tools[param] == "function") {
    Tools[param]();
}