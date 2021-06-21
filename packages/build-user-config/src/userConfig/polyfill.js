const path = require('path');
const { injectTransformRuntime } = require('@builder/app-helpers');
const processPresetEnv  = require('../utils/processPresetEnv');
const addBablePlugins = require('../utils/addBabelPlugins');

const getEntryRegExp = (entryPath) => {
  const entryExtname = path.extname(entryPath);
  return entryExtname ? entryPath : new RegExp(`${entryPath}(.jsx?|.tsx?)$`);
};

module.exports = (config, polyfill) => {
  const envOptions = {
    useBuiltIns: polyfill
  };
  if (typeof polyfill === 'string') {
    // babel options is corejs
    envOptions.corejs = 3;
    // swc option is coreJs
    envOptions.coreJs = 3;
    if (polyfill === 'entry') {
      const entries = config.toConfig().entry;
      const rule = config.module.rule('polyfill').test(/\.jsx?|\.tsx?$/);
      const fileList = [];
      if (!entries) return;
      Object.keys(entries).forEach((key) => {
        let addPolyfill = false;
        // only include entry path
        for (let i = 0; i < entries[key].length; i += 1) {
          // filter node_modules file add by plugin
          if (!/node_modules/.test(entries[key][i])) {
            rule.include.add(getEntryRegExp(entries[key][i]));
            fileList.push(entries[key][i]);
            addPolyfill = true;
            break;
          }
        }
        if (!addPolyfill) {
          rule.include.add(getEntryRegExp(entries[key][0]));
          fileList.push(entries[key][0]);
        }
      });
      rule.use('polyfill-loader').loader(require.resolve('../utils/polyfillLoader')).options({});
      addBablePlugins(config, [[require.resolve('../utils/babelPluginCorejsLock.js'), { fileList }]]);
    } else {
      addTransformRuntime(config);
    }
  } else if (polyfill === false) {
    // inject async/await polyfill
    addTransformRuntime(config);
  }
  modifyEnv(config, envOptions);
};

function addTransformRuntime(config) {
  injectTransformRuntime(config);
}

function modifyEnv(config, envOptions) {
  processPresetEnv(config, envOptions);
}
