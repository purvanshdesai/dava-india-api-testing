module.exports = {
  apps: [
    {
      name: 'DavaIndiaServer',
      exec_mode: 'cluster',
      instances: 1, // Or a number of instances
      script: 'lib/',
      node_args: '--max-old-space-size=3072',
      args: 'start',
      // pre_start: "rm -rf lib && tsc",
      env_production: {
        NODE_ENV: 'production'
      },
      env_staging: {
        NODE_ENV: 'staging'
      }
    }
  ]
}
