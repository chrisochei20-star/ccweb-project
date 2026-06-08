/**
 * Client feature flags for unfinished builder / beta surfaces.
 * Set VITE_CCWEB_SHOW_BUILDER_BETA=1 to reveal workflow operator marketing panels.
 */

export function showBuilderBetaPanels() {
  return import.meta.env.VITE_CCWEB_SHOW_BUILDER_BETA === "1";
}

export function showAiStreamingDemo() {
  return import.meta.env.VITE_CCWEB_SHOW_AI_STREAMING_DEMO === "1";
}
