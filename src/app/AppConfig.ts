import { Config } from "effect";

export const AppConfig = Config.all({
  port: Config.Port("PORT").pipe(Config.withDefault(3000)),
});
