const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const checkEnvVars = (...envVars) => {
  return envVars.every(envVar => {
    if (!process.env[envVar]) {
      console.warn(`${envVar} not set.`);
      return false;
    }
    return true;
  });
};

module.exports = { sleep, checkEnvVars };