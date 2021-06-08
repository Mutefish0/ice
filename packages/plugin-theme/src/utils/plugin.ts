import { plugin, TransformCallback } from 'postcss';

interface Option {
  varsMap: Record<string, string>
  type?: 'sass' | 'less'
}

/**
 * PossCss 插件
 * 
 * 将 Less/Sass 声明的变量的 value 转为 css var
 * 
 * TODO: 函数预编译
 */
export const declVarPlugin = plugin('less-sass-to-var', (option: Option): TransformCallback => {
  const { varsMap, type = 'less' } = option;

  return root => {
    if (type === 'sass') {
      root.walkDecls(decl => {
        if (decl.prop) {
          const str = decl.prop;
          const name = str.slice(1);

          if (varsMap[name] && str[0] === '$') {
            decl.value = `var(--${name}, ${varsMap[name]})`;
          }
        }
      });
      return;
    }

    if (type === 'less') {
      root.walkAtRules(atRule => {
        if (atRule.name) {
          const str = atRule.name;
          const name = str.slice(0, str.length - 1);

          if (varsMap[name]) {
            atRule.params = `var(--${name}, ${varsMap[name]})`;
          }
        }
      });
    }
  };
});