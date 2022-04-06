"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFiles = void 0;
const node_fs_1 = require("node:fs");
async function getFiles(directory, subdirectories) {
    if (subdirectories) {
        const dirents = await new Promise((resolve, reject) => {
            (0, node_fs_1.readdir)(directory, { withFileTypes: true }, (error, files) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(files);
                }
            });
        });
        const names = [];
        for (let folder of dirents.filter((dirent) => dirent.isDirectory())) {
            const files = await getFiles(`${directory}/${folder.name}`, subdirectories);
            for (let name of files) {
                names.push(`${folder.name}/${name}`);
            }
        }
        for (let file of dirents.filter((dirent) => dirent.isFile())) {
            names.push(file.name);
        }
        return names;
    }
    else {
        const names = await new Promise((resolve, reject) => {
            (0, node_fs_1.readdir)(directory, (error, files) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(files);
                }
            });
        });
        return names;
    }
}
exports.getFiles = getFiles;
