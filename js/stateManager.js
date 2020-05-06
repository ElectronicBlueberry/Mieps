import * as fs from 'fs';
import { state_folder, state_suffix } from "./config/server.json";
import { criticalError } from "./errorHandling";
/**
 * Manages a State which is presistent between restarts
 */
export class State {
    constructor(unique_identifier) {
        this.data = {};
        this.saveQueued = false;
        this.path = `${state_folder}/${unique_identifier}.${state_suffix}`;
        // attempt to open state path
        let files;
        let file;
        try {
            files = fs.readdirSync(state_folder);
        }
        catch (e) {
            console.log("Could not read State Directory");
            criticalError(e);
            return;
        }
        // check if file exists
        file = files.find(f => f === `${unique_identifier}.${state_suffix}`);
        // if it does, import its contents
        if (file !== undefined) {
            try {
                let content = fs.readFileSync(this.path, 'utf8');
                this.data = JSON.parse(content);
            }
            catch (e) {
                console.log("Failed to read State");
                criticalError(e);
                return;
            }
        }
        // otherwise create it
        else {
            try {
                fs.writeFileSync(this.path, JSON.stringify(this.data), 'utf8');
            }
            catch (e) {
                console.log("Failed to create State File");
                criticalError(e);
                return;
            }
        }
    }
    queueSave() {
        this.saveQueued = true;
        setTimeout(() => {
            if (this.saveQueued) {
                this.saveQueued = false;
                fs.writeFile(this.path, JSON.stringify(this.data), () => { });
            }
        }, 0);
    }
    read(primaryKey, key) {
        if (!this.data[primaryKey]) {
            this.data[primaryKey] = {};
        }
        return this.data[primaryKey][key];
    }
    write(primaryKey, key, value) {
        if (!this.data[primaryKey]) {
            this.data[primaryKey] = {};
        }
        this.data[primaryKey][key] = value;
        this.queueSave();
    }
}
//# sourceMappingURL=stateManager.js.map