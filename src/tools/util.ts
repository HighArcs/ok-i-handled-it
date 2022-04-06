import { Dirent, readdir } from "node:fs";

export async function getFiles(
  directory: string,
  subdirectories?: boolean
): Promise<Array<string>> {
  if (subdirectories) {
    const dirents: Array<Dirent> = await new Promise((resolve, reject) => {
      readdir(
        directory,
        { withFileTypes: true },
        (error: Error | null, files: Array<Dirent>) => {
          if (error) {
            reject(error);
          } else {
            resolve(files);
          }
        }
      );
    });

    const names: Array<string> = [];
    for (let folder of dirents.filter((dirent) => dirent.isDirectory())) {
      const files = await getFiles(
        `${directory}/${folder.name}`,
        subdirectories
      );
      for (let name of files) {
        names.push(`${folder.name}/${name}`);
      }
    }
    for (let file of dirents.filter((dirent) => dirent.isFile())) {
      names.push(file.name);
    }
    return names;
  } else {
    const names: Array<string> = await new Promise((resolve, reject) => {
      readdir(directory, (error: Error | null, files: Array<string>) => {
        if (error) {
          reject(error);
        } else {
          resolve(files);
        }
      });
    });
    return names;
  }
}
