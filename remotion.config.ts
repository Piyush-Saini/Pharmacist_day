import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
// H.264 High profile is not universally safe on older budget Androids; the
// renderer in lib/render.ts pins Baseline for the delivered files.
Config.setOverwriteOutput(true);
Config.setChromiumOpenGlRenderer("swangle");
