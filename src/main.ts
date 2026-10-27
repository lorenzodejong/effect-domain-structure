import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { AppLive } from "./app/AppLive.ts";

// The only place an Effect is executed. Everything else is a description.
NodeRuntime.runMain(Layer.launch(AppLive));
