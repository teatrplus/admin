import postcssPresetEnv from 'postcss-preset-env'
import postcssBeamFluid from './postcss/postcss-beam-fluid.mjs'
import { beamFluidOptions } from './postcss/beam-fluid-options.mjs'

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: [
    postcssBeamFluid(beamFluidOptions),
    postcssPresetEnv({
      stage: 2,
      autoprefixer: {
        flexbox: 'no-2009',
      },
    }),
  ],
}
