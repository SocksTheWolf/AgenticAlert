export default {
  ignoreFiles: [
    "*",
    "!src",
    "!icon*.png",
    "!LICENSE",
    "!manifest.json"
  ],
  artifactsDir: "ext",
  build: {
    overwriteDest: true,
    filename: "extension.zip",
  }
};