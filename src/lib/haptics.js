import { isCapacitorNative } from "./platformDetect";

/** Light tap feedback on native Android/iOS where supported. */
export async function hapticTap() {
  if (!isCapacitorNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* plugin optional */
  }
}
