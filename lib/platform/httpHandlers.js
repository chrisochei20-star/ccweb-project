const { PLATFORM_MANIFEST } = require("./manifest");
const { sendJson } = require("../ccweb/http");

function handlePlatformManifest(res) {
  sendJson(res, 200, PLATFORM_MANIFEST);
}

module.exports = { handlePlatformManifest };
