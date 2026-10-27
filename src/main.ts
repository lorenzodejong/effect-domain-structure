import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { HttpLive } from "./app/HttpLive.ts";

// The only place an Effect is executed. Everything else is a description.
NodeRuntime.runMain(Layer.launch(HttpLive));
