module.exports = {
  apps: [
    {
      name: 'bosoryn-backend',
      script: 'dist/main.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3000,
        TRUST_PROXY: 'true',
      },
    },
  ],
};
