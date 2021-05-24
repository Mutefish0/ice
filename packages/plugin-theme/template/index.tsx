import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ContextType, Props, Themes } from './types';

const initialTheme = 'default';
const Context = createContext<ContextType>(null);

const ThemeProvider: React.FC<Props> = ({ children, defaultThemes = initialTheme }) => {
  const share = useState<Themes>(defaultThemes);
  const theme = share[0];

  useEffect(() => {
    // 监听 theme 变化，并触发入口文件注册的 handleTheme 函数
    const handleTheme = (window as any).__handleTheme__;
    if (handleTheme) handleTheme(theme);
  }, [theme]);

  return (
    <Context.Provider value={share}>{children}</Context.Provider>
  );
};

const useTheme = () => {
  const value = useContext(Context);
  if (value === null) throw new Error('Please add ThemeProvider');

  return value;
};

export {
  useTheme,
  ThemeProvider,
  Themes
};