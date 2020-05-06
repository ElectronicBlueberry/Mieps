import { State } from "./state";
var configState = new State("global_config");
export function get(plugin, setting) {
    return configState.read(plugin.name, setting);
}
export class ConfigPlugin {
    constructor() {
        this.name = "config";
    }
}
//# sourceMappingURL=configurator.js.map