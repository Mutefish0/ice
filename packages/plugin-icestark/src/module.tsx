import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppConfig, AppRouter, AppRoute } from '@ice/stark';
import {
  isInIcestark,
  getMountNode,
  registerAppEnter,
  registerAppLeave,
  getBasename,
} from '@ice/stark-app';
import { Router } from '$ice/Router';
import DefaultLayout from '$ice/Layout';
import removeRootLayout from './runtime/removeLayout';

interface IAppRouter {
  ErrorComponent?: React.ComponentType;
  LoadingComponent?: React.ComponentType;
  NotFoundComponent?: React.ComponentType;
  shouldAssetsRemove?: (
    assetUrl?: string,
    element?: HTMLElement | HTMLLinkElement | HTMLStyleElement | HTMLScriptElement,
  ) => boolean;
}

interface IGetApps {
  (): AppConfig[]|Promise<AppConfig[]>;
}

interface IConfig {
  type: 'framework' | 'child';
  getApps?: IGetApps;
  appRouter?: IAppRouter;
  removeRoutesLayout: boolean;
  AppRoute?: React.ComponentType;
  Layout?: React.ComponentType;
}

const { useEffect, useState } = React;

const module = ({ appConfig, addDOMRender, setRenderRouter, modifyRoutes }) => {
  const { icestark, router } = appConfig;
  const { type: appType } = (icestark || {}) as IConfig;
  const { type, basename, modifyRoutes: runtimeModifyRoutes } = router;
  if (runtimeModifyRoutes) {
    modifyRoutes(runtimeModifyRoutes);
  }
  if (appType === 'child') {
    addDOMRender(({ App, appMountNode }) => {
      return new Promise(resolve => {
        if (isInIcestark()) {
          const mountNode = getMountNode();
          registerAppEnter(() => {
            ReactDOM.render(<App />, mountNode, resolve);
          });
          // make sure the unmount event is triggered
          registerAppLeave(() => {
            ReactDOM.unmountComponentAtNode(mountNode);
          });
        } else {
          ReactDOM.render(<App />, appMountNode, resolve);
        }
      })
    });
    setRenderRouter((routes) => () => {
      const routerProps = {
        type,
        basename: getBasename(),
        routes,
      };
      return <Router {...routerProps} />;
    });
  } else if (appType === 'framework') {
    const { getApps, appRouter, Layout, AppRoute: CustomAppRoute, removeRoutesLayout } = (icestark || {}) as IConfig;
    if (removeRoutesLayout) {
      modifyRoutes(removeRootLayout);
    }
    const frameworkRouter = (routes) => () => {
      const [appInfo, setAppInfo] = useState({
        pathname: '',
        appEnter: {},
        appLeave: {}
      });
      const [apps, setApps] = useState(null);
      const routerProps = {
        type,
        basename,
        routes,
      };
      const BasicLayout = Layout || DefaultLayout;
      const RenderAppRoute = CustomAppRoute || AppRoute;

      useEffect(() => {
        (async () => {
          // 异步 apps 获取
          const appList = await getApps();
          setApps(appList);
        })();
      }, []);

      function handleRouteChange(pathname) {
        setAppInfo({
          ...appInfo,
          pathname,
        });
      }
    
      function handleAppLeave(config) {
        setAppInfo({
          ...appInfo,
          appLeave: config,
        });
      }
    
      function handleAppEnter(config) {
        setAppInfo({
          ...appInfo,
          appEnter: config,
        });
      }
  
      return (
        <BasicLayout {...appInfo}>
          {apps && (
            <AppRouter
              {...(appRouter || {})}
              onRouteChange={handleRouteChange}
              onAppEnter={handleAppEnter}
              onAppLeave={handleAppLeave}
            >
              {apps.map((item: AppConfig, idx: number) => {
                return (
                  <RenderAppRoute
                    key={idx}
                    {...item}
                  />
                );
              })}
              {routes && routes.length && (
                <RenderAppRoute
                  path="/"
                  component={<Router {...routerProps} />}
                />
              )}
            </AppRouter>
          )}
        </BasicLayout>
      );
    }
    setRenderRouter(frameworkRouter);
  }
}

export default module;