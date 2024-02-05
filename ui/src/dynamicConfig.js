export const getDynamicConfigValue = (envKey) => {
  var value = null;
  if (window._dynamicEnv_) {
    value = window._dynamicEnv_[envKey];
  }
  if (!value) {
    value = process.env[envKey];
  }
  // if no value was provided assign a default
  if (!value) {
    value = "none";
  }
  return value;
};
