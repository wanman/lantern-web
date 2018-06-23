/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.3.0/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "add/add.css",
    "revision": "4b8fe5f4570e8f06b8e8cc6f7f0a4acb"
  },
  {
    "url": "add/add.html",
    "revision": "df705ab1472306f6b7eeedd01d01afa0"
  },
  {
    "url": "add/add.js",
    "revision": "47a1208badf4f2cca852621f8998ae7e"
  },
  {
    "url": "admin/admin.css",
    "revision": "48839f2060a762b216485e3683d205fa"
  },
  {
    "url": "admin/admin.html",
    "revision": "597b52c3ba210c6c01b597edd51e08a6"
  },
  {
    "url": "admin/admin.js",
    "revision": "1ecca46628c0acf3e62274ef4ae29fdd"
  },
  {
    "url": "browse/browse.css",
    "revision": "94234672744f3bf9e1ef118139205d32"
  },
  {
    "url": "browse/browse.html",
    "revision": "b5230a8b891160afbef3493e27563d94"
  },
  {
    "url": "browse/browse.js",
    "revision": "527943a6887daf025b2280496991d267"
  },
  {
    "url": "checkin/checkin.css",
    "revision": "88792272f899743128b8b803f23e854b"
  },
  {
    "url": "checkin/checkin.html",
    "revision": "bfb4907a57f41f99fed859b0a9128a6d"
  },
  {
    "url": "checkin/checkin.js",
    "revision": "88e0784cb52c1d98c54391cc96b494dc"
  },
  {
    "url": "detail/detail.css",
    "revision": "b5fe4b4ebc5488bd9ba6ca80dadea6dc"
  },
  {
    "url": "detail/detail.html",
    "revision": "37408daf7ec6742842ccac3dda7ab47d"
  },
  {
    "url": "detail/detail.js",
    "revision": "439ac6601c1df73b1310ceb46bcd5391"
  },
  {
    "url": "hotspot-2.html",
    "revision": "0d0a2ee8a7d627fb40ab9ffc4c160f75"
  },
  {
    "url": "hotspot-3.html",
    "revision": "4de3f8cebc3be54eec0bcfce603ea6ca"
  },
  {
    "url": "hotspot-4.html",
    "revision": "8bc142288b4cba31ea567f93a589bca6"
  },
  {
    "url": "hotspot.html",
    "revision": "358725a40425328a57e96988b9987897"
  },
  {
    "url": "index.css",
    "revision": "57b095184ecc2b0e7faa1742e3985d4b"
  },
  {
    "url": "index.html",
    "revision": "c42ad6f2f254336324af5cbd8d29eb8b"
  },
  {
    "url": "index.js",
    "revision": "7f2b63a1dbbb977550bc826a4271dd95"
  },
  {
    "url": "lib/lantern.css",
    "revision": "01d49cb613880fe615fb782b3a4e07f4"
  },
  {
    "url": "manifest.json",
    "revision": "8f392d3eaa1e00cac800a6b5ffe3efb7"
  },
  {
    "url": "media/favicon/safari-pinned-tab.svg",
    "revision": "1143884328fb4dc69fae54eac9eccfdb"
  },
  {
    "url": "media/icons/css/fa-brands.css",
    "revision": "ef4b96231c1c8e5bc6d2018ff59ee62e"
  },
  {
    "url": "media/icons/css/fa-brands.min.css",
    "revision": "e7771f7bdea7a420973e20cd173a1b19"
  },
  {
    "url": "media/icons/css/fa-regular.css",
    "revision": "4dc9fb8af478dad580da0763c3bb2c4d"
  },
  {
    "url": "media/icons/css/fa-regular.min.css",
    "revision": "b7a248c091ece954a64f4fde5dae801d"
  },
  {
    "url": "media/icons/css/fa-solid.css",
    "revision": "f59b676f5ab1dca6ba71e7eba50cd004"
  },
  {
    "url": "media/icons/css/fa-solid.min.css",
    "revision": "286b42d8d5ab6254c10c8cfbc00ce955"
  },
  {
    "url": "media/icons/css/fontawesome-all.css",
    "revision": "0a2ed388e9c6ab831acb42c006aa91a3"
  },
  {
    "url": "media/icons/css/fontawesome-all.min.css",
    "revision": "d61bfe9b56c13ecff5313ee3abb45e8b"
  },
  {
    "url": "media/icons/css/fontawesome.css",
    "revision": "695883f214d9afb980d1fdc2fca6ee1a"
  },
  {
    "url": "media/icons/css/fontawesome.min.css",
    "revision": "497c6efa3acaba85fb0a1b4f76b61bde"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.eot",
    "revision": "748ab466bee11e0b2132916def799916"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.svg",
    "revision": "b032e14eac87e3001396ff597e4ec15f"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.ttf",
    "revision": "7febe26eeb4dd8e3a3c614a144d399fb"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.woff",
    "revision": "2248542e1bbbd548a157e3e6ced054fc"
  },
  {
    "url": "media/icons/webfonts/fa-brands-400.woff2",
    "revision": "3654744dc6d6c37c9b3582b57622df5e"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.eot",
    "revision": "b58f468f84168d61e0ebc1e1f423587c"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.svg",
    "revision": "3929b3ef871fa90bbb4e77e005851e74"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.ttf",
    "revision": "54f142e03adc6da499c2af4f54ab76fd"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.woff",
    "revision": "f3dd4f397fbc5aaf831b6b0ba112d75c"
  },
  {
    "url": "media/icons/webfonts/fa-regular-400.woff2",
    "revision": "33f727ccde4b05c0ed143c5cd78cda0c"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.eot",
    "revision": "035a137af03db6f1af76a589da5bb865"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.svg",
    "revision": "9bbbee00f65769a64927764ef51af6d0"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.ttf",
    "revision": "b6a14bb88dbc580e45034af297c8f605"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.woff",
    "revision": "6661d6b3521b4c480ba759e4b9e480c1"
  },
  {
    "url": "media/icons/webfonts/fa-solid-900.woff2",
    "revision": "8a8c0474283e0d9ef41743e5e486bf05"
  },
  {
    "url": "welcome.html",
    "revision": "402222a444edbea5e4258334fa6a4a9a"
  },
  {
    "url": "lib/lantern.js",
    "revision": "37f67ef158153f0fb9688ecfee79fd51"
  },
  {
    "url": "lib/map.css",
    "revision": "9b465e5f4c4d62749c489bcc8b88da62"
  },
  {
    "url": "lib/map.js",
    "revision": "0afe16eae86df3dc2ea95d5d309a7871"
  },
  {
    "url": "lib/vendor.js",
    "revision": "2424177957c131efab437d13ba8f28b2"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerRoute(/\.(?:png|jpg|jpeg)$/, workbox.strategies.cacheFirst({ cacheName: "images", plugins: [new workbox.expiration.Plugin({"maxEntries":10,"purgeOnQuotaError":false})] }), 'GET');
