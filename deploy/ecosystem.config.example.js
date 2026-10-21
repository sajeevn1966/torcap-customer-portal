// Copy to /etc/torcap/ecosystem.config.js on the server and fill in real values.
// NEVER commit the real file (it holds passwords). One block per client.
const cwd = "/var/www/torcap";
module.exports = {
  apps: [
    {
      name: "torcap-sona",
      cwd,
      script: "npm",
      args: "start -- -p 3000",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://USER:PASSWORD@localhost:5432/DBNAME?schema=public",
        SESSION_SECRET: "64-char-random-value (openssl rand -hex 32)",
        WHATSAPP_OTP_TEMPLATE_NAME: "otp",
      },
    },
  ],
};
