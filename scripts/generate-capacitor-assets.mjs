#!/usr/bin/env node
/**
 * Generate CCWEB Foundation Android adaptive icons, splash, and notification assets.
 * Source mark: assets/brand/ccweb-foundation-logo.svg
 *
 * Outputs:
 *  - mipmap densities: ic_launcher_foreground.png (adaptive foreground, 108dp base)
 *  - mipmap densities: ic_launcher.png + ic_launcher_round.png (legacy)
 *  - drawable folders: splash.png (portrait + landscape per density)
 *  - drawable/ic_launcher_monochrome.xml (Android 13+ themed icon)
 *  - drawable/ic_stat_ccweb.xml (notification silhouette)
 *  - docs/assets/android-icons/ preview PNGs for PR
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  pngFromPixels,
  writePng,
  renderForegroundPixel,
  renderLegacyPixel,
  renderRoundPixel,
  renderMonochromePixel,
  renderSplashPixel,
  renderNotificationPixel,
  BRAND,
} from "./lib/brandIconRaster.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RES = path.join(ROOT, "android", "app", "src", "main", "res");
const PREVIEW = path.join(ROOT, "docs", "assets", "android-icons");

/** Adaptive foreground — 108dp at mdpi */
const ADAPTIVE_MIPMAP = {
  "mipmap-mdpi": 108,
  "mipmap-hdpi": 162,
  "mipmap-xhdpi": 216,
  "mipmap-xxhdpi": 324,
  "mipmap-xxxhdpi": 432,
};

/** Legacy launcher — 48dp at mdpi */
const LEGACY_MIPMAP = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const SPLASH_PORT = {
  "drawable-port-mdpi": [320, 480],
  "drawable-port-hdpi": [480, 800],
  "drawable-port-xhdpi": [720, 1280],
  "drawable-port-xxhdpi": [1080, 1920],
  "drawable-port-xxxhdpi": [1440, 2560],
};

const SPLASH_LAND = {
  "drawable-land-mdpi": [480, 320],
  "drawable-land-hdpi": [800, 480],
  "drawable-land-xhdpi": [1280, 720],
  "drawable-land-xxhdpi": [1920, 1080],
  "drawable-land-xxxhdpi": [2560, 1440],
};

function ensureAndroid() {
  if (!fs.existsSync(path.join(ROOT, "android"))) {
    console.warn("[capacitor-assets] android/ not found — run `npx cap add android` first.");
    process.exit(0);
  }
}

function writeAdaptiveIcons() {
  for (const [folder, size] of Object.entries(ADAPTIVE_MIPMAP)) {
    const fg = pngFromPixels(size, size, (x, y) => renderForegroundPixel(x, y, size));
    writePng(path.join(RES, folder, "ic_launcher_foreground.png"), fg);
  }
}

function writeLegacyIcons() {
  for (const [folder, size] of Object.entries(LEGACY_MIPMAP)) {
    const square = pngFromPixels(size, size, (x, y) => renderLegacyPixel(x, y, size));
    const round = pngFromPixels(size, size, (x, y) => renderRoundPixel(x, y, size));
    writePng(path.join(RES, folder, "ic_launcher.png"), square);
    writePng(path.join(RES, folder, "ic_launcher_round.png"), round);
  }
}

function writeSplashScreens() {
  const all = { ...SPLASH_PORT, ...SPLASH_LAND };
  for (const [folder, [w, h]] of Object.entries(all)) {
    const buf = pngFromPixels(w, h, (x, y) => renderSplashPixel(x, y, w, h));
    writePng(path.join(RES, folder, "splash.png"), buf);
  }
  const defaultSplash = pngFromPixels(1080, 1920, (x, y) => renderSplashPixel(x, y, 1080, 1920));
  writePng(path.join(RES, "drawable", "splash.png"), defaultSplash);
}

function writeMonochromeVector() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M58.5,22 L38,58 H52 L49.5,86 L70,50 H56 L58.5,22 Z" />
</vector>
`;
  fs.mkdirSync(path.join(RES, "drawable"), { recursive: true });
  fs.writeFileSync(path.join(RES, "drawable", "ic_launcher_monochrome.xml"), xml);
}

function writeNotificationVector() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24"
    android:tint="@color/ccweb_notification">
    <path
        android:fillColor="#FFFFFFFF"
        android:pathData="M13,2 L4,14 H11 L10,22 L22,10 H15 L13,2 Z" />
</vector>
`;
  fs.writeFileSync(path.join(RES, "drawable", "ic_stat_ccweb.xml"), xml);
}

function writeBackgroundVector() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path android:pathData="M0,0h108v108H0z">
        <aapt:attr xmlns:aapt="http://schemas.android.com/aapt" name="android:fillColor">
            <gradient
                android:type="radial"
                android:centerX="54"
                android:centerY="48"
                android:gradientRadius="72"
                android:startColor="#0F2240"
                android:endColor="#030712" />
        </aapt:attr>
    </path>
</vector>
`;
  fs.writeFileSync(path.join(RES, "drawable", "ic_launcher_background.xml"), xml);
}

function writeAdaptiveXml() {
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
`;
  const dir = path.join(RES, "mipmap-anydpi-v26");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "ic_launcher.xml"), adaptive);
  fs.writeFileSync(path.join(dir, "ic_launcher_round.xml"), adaptive);
}

function writeColorResources() {
  const colors = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ccweb_notification">#22D3EE</color>
</resources>
`;
  fs.writeFileSync(path.join(RES, "values", "colors.xml"), colors);
}

function writePreviewScreenshots() {
  fs.mkdirSync(PREVIEW, { recursive: true });

  const previews = [
    {
      name: "adaptive-foreground-432.png",
      w: 432,
      h: 432,
      fn: (x, y, s) => renderForegroundPixel(x, y, s),
    },
    {
      name: "adaptive-legacy-192.png",
      w: 192,
      h: 192,
      fn: (x, y, s) => renderLegacyPixel(x, y, s),
    },
    {
      name: "adaptive-round-192.png",
      w: 192,
      h: 192,
      fn: (x, y, s) => renderRoundPixel(x, y, s),
    },
    {
      name: "monochrome-108.png",
      w: 108,
      h: 108,
      fn: (x, y, s) => renderMonochromePixel(x, y, s),
    },
    {
      name: "notification-96.png",
      w: 96,
      h: 96,
      fn: (x, y, s) => renderNotificationPixel(x, y, s),
    },
    {
      name: "splash-1080x1920.png",
      w: 1080,
      h: 1920,
      fn: (x, y, w, h) => renderSplashPixel(x, y, w, h),
      sized: true,
    },
    {
      name: "preview-dark-bg.png",
      w: 512,
      h: 512,
      fn: (x, y, s) => {
        const bg = { r: BRAND.bgDark.r, g: BRAND.bgDark.g, b: BRAND.bgDark.b, a: 255 };
        const fg = renderForegroundPixel(x, y, s);
        if (fg.a === 0) return bg;
        const a = fg.a / 255;
        return {
          r: Math.round(bg.r * (1 - a) + fg.r * a),
          g: Math.round(bg.g * (1 - a) + fg.g * a),
          b: Math.round(bg.b * (1 - a) + fg.b * a),
          a: 255,
        };
      },
    },
    {
      name: "preview-light-bg.png",
      w: 512,
      h: 512,
      fn: (x, y, s) => {
        const t = (x + y) / (s * 2);
        const bg = {
          r: Math.round(248 - t * 12),
          g: Math.round(250 - t * 8),
          b: 255,
          a: 255,
        };
        const polyFn = renderForegroundPixel(x, y, s);
        if (polyFn.a === 0) return bg;
        const a = polyFn.a / 255;
        return {
          r: Math.round(bg.r * (1 - a) + polyFn.r * a),
          g: Math.round(bg.g * (1 - a) + polyFn.g * a),
          b: Math.round(bg.b * (1 - a) + polyFn.b * a),
          a: 255,
        };
      },
    },
  ];

  for (const p of previews) {
    const buf = p.sized
      ? pngFromPixels(p.w, p.h, (x, y) => p.fn(x, y, p.w, p.h))
      : pngFromPixels(p.w, p.h, (x, y) => p.fn(x, y, p.w));
    writePng(path.join(PREVIEW, p.name), buf);
  }
}

ensureAndroid();
writeColorResources();
writeBackgroundVector();
writeMonochromeVector();
writeNotificationVector();
writeAdaptiveXml();
writeAdaptiveIcons();
writeLegacyIcons();
writeSplashScreens();
writePreviewScreenshots();

console.log("[capacitor-assets] CCWEB Foundation icons generated:");
console.log("  • Adaptive foreground (108dp) + legacy launcher + round");
console.log("  • Monochrome themed icon (Android 13+)");
console.log("  • Splash screens (portrait + landscape)");
console.log("  • Notification icon (ic_stat_ccweb)");
console.log(`  • Preview PNGs → ${path.relative(ROOT, PREVIEW)}/`);
