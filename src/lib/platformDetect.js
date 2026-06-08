/**
 * Minimal native platform detection — no releaseLog or shell side effects.
 * Use this in session/auth hot paths to avoid init-order cycles with capacitorPlatform.js.
 */
import { Capacitor } from "@capacitor/core";

export function isCapacitorNative() {
  return Capacitor.isNativePlatform();
}

export function isCapacitorAndroid() {
  return Capacitor.getPlatform() === "android";
}

export function capacitorPlatformName() {
  return Capacitor.getPlatform();
}
