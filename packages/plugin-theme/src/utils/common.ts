import * as path from 'path';
import { lstatSync, pathExists, readdir } from 'fs-extra';
import { curry } from 'lodash';

/**
 * 匹配后缀为 `.css` 的文件名
 * 
 * @param {string} prefix 文件所在文件夹路径
 * @param {string} name 文件名
 * 
 * @return {boolean} 是否是 css 文件
 */
export const detectCssFile = curry((prefix: string, name: string): boolean => {
  const filePath = path.resolve(prefix, name);
  const stat = lstatSync(filePath);
  return !stat.isDirectory() && name.split('.').pop() === 'css';
});

/**
 * 通过文件路径名称获取主题名
 */
export const getThemeName = (filePath: string) => {
  return filePath.replace(/(.*\/)*([^.]+).*/ig, '$2');
};

/**
 * 获取初始化主题，如果没有找到 default，则获取第一个主题文件为初始化主题
 * 
 * @param {string} names 文件名（无后缀）列表
 */
export const getDefaultTheme = (names: string[]) => {
  const isExist = names.some(name => name === 'default');
  return {
    isExist,
    defaultName: isExist ? 'default' : names[0]
  };
};

/**
 * themes 文件夹不存在 or 不存在样式文件，则视为不启动主题配置
 * 
 * @param {string} themesPath 主题目录路径
 */
export const checkThemesEnabled = async (themesPath: string): Promise<boolean> => {
  const dirExists = await pathExists(themesPath);
  if (!dirExists) return false;

  const files = await readdir(themesPath);
  if (files.length === 0) return false;

  const stylesExists = files.some(detectCssFile(themesPath));
  if (!stylesExists) return false;

  return true;
};

/**
 * TODO: 目前只能做到取一个函数的名字和参数，对于嵌套情况无效...
 */
export const getFunction = (str: string) => {
  const list = str.replace(/\s+/g, '').match(/[^(|,|)]+/g);

  return {
    name: list[0],
    params: list.slice(1)
  };
};

/**
 * 判断该字符串是否为函数调用时的形态
 * 
 * eg: rgb(0,0,0,1) -> true
 */
export const isFunction = (str: string) => {
  // eslint-disable-next-line no-useless-escape
  const reg = /^[A-Za-z_]+[A-Za-z0-9_-]*[\(][\s\S]*[\)]$/g;
  return reg.test(str);
};
