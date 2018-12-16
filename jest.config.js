module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src/"],
  globals: {
    "ts-jest": {
      diagnostics: {
        ignoreCodes: [151001]
      }
    }
  }
};
