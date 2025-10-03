import path from 'path'
import type { StorybookConfig } from '@storybook/react-webpack5'

const projectRoot = path.resolve(__dirname, '..')

const config: StorybookConfig = {
  stories: ['../components/**/*.mdx', '../components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    {
      name: '@storybook/addon-postcss',
      options: {
        postcssLoaderOptions: {
          implementation: require('postcss')
        }
      }
    }
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {
      builder: { useSWC: true }
    }
  },
  docs: {
    autodocs: 'tag'
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript'
  },
  webpackFinal: async (baseConfig) => {
    baseConfig.resolve = baseConfig.resolve ?? {}
    baseConfig.resolve.alias = {
      ...(baseConfig.resolve.alias ?? {}),
      '@': projectRoot,
      'react-leaflet': path.resolve(__dirname, 'mocks/react-leaflet.tsx'),
      leaflet: path.resolve(__dirname, 'mocks/leaflet.ts'),
      'leaflet/dist/leaflet.css': require.resolve('leaflet/dist/leaflet.css')
    }

    baseConfig.module = baseConfig.module ?? {}
    baseConfig.module.rules = baseConfig.module.rules ?? []
    baseConfig.module.rules.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true,
            compilerOptions: {
              jsx: 'react-jsx'
            }
          }
        }
      ]
    })

    baseConfig.resolve.extensions = Array.from(
      new Set([...(baseConfig.resolve.extensions ?? []), '.ts', '.tsx'])
    )

    return baseConfig
  }
}

export default config
