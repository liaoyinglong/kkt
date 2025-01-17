process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import { ParsedArgs } from 'minimist';
import { KKTRC } from '../utils/loaderConf';
import { reactScripts, isWebpackFactory, proxySetup } from '../utils/path';
import { overridePaths } from '../overrides/paths';
import openBrowser from '../overrides/openBrowser';
import { miniCssExtractPlugin } from '../utils/miniCssExtractPlugin';
import { cacheData } from '../utils/cacheData';

export default async function build(argvs: ParsedArgs) {
  try {
    await openBrowser(argvs);
    const paths = await overridePaths(argvs);
    const webpackConfigPath = `${reactScripts}/config/webpack.config${!isWebpackFactory ? '.dev' : ''}`;
    const devServerConfigPath = `${reactScripts}/config/webpackDevServer.config.js`;
    const webpackConfig = require(webpackConfigPath);
    const devServerConfig = require(devServerConfigPath);
    const overrides = require('../overrides/config');
    const kktrc: KKTRC = await overrides();

    if (kktrc && kktrc.devServer) {
      require.cache[require.resolve(devServerConfigPath)].exports =
        kktrc.devServer(devServerConfig, process.env.NODE_ENV);
    }
    // Source maps are resource heavy and can cause out of memory issue for large source files.
    const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
    const overridesHandle = kktrc.default || kktrc;
    if (overridesHandle && typeof overridesHandle === 'function') {
      const webpackConf = miniCssExtractPlugin(webpackConfig('development'));
      // override config in memory
      require.cache[require.resolve(webpackConfigPath)].exports = (env: string) => {
        overridePaths(undefined, { proxySetup });
        if (kktrc && kktrc.proxySetup && typeof kktrc.proxySetup === 'function') {
          cacheData({ proxySetup: kktrc.proxySetup });
        }
        return overridesHandle(webpackConf, env, { ...argvs, shouldUseSourceMap, paths });
      }
    }

    // run original script
    require(`${reactScripts}/scripts/start`);
  } catch (error) {
    console.log('KKT:START:ERROR:', error);
  }
}