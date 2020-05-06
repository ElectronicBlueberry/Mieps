import * as fs from 'fs';
import {criticalError} from "./errorHandling.js";

import * as Path from 'path';
import {state_folder, state_suffix} from "../config/server.json";

interface IDictionary<TValue> {
    [id: string]: TValue;
}

export interface ReadOnlyState {
	/** Read a Value from this state */
	read: (primaryKey: string, key: string) => any
}

/**
 * Manages a State which is presistent between restarts
 */
export class State {
	private data: IDictionary<IDictionary<any>> = {};
	private path: fs.PathLike;

	constructor(unique_identifier: string) {
		this.path = Path.resolve(`${state_folder}/${unique_identifier}${state_suffix}`);
	
		// attempt to open state path
		let files: Array<string>;
		let file: String | undefined;

		let folderPath = Path.resolve(state_folder);

		if (!fs.existsSync(folderPath)) {
			fs.mkdirSync(folderPath);
		}

		try {
			files = fs.readdirSync(folderPath);
		} catch(e) {
			criticalError("Could not read State Directory", e);
			return;
		}

		// check if file exists
		file = files.find(f => f === `${unique_identifier}${state_suffix}`);

		// if it does, import its contents
		if (file !== undefined) {
			try {
				let content = fs.readFileSync(this.path, 'utf8');
				this.data = JSON.parse(content);
			} catch(e) {
				console.log("Failed to read State");
				criticalError(e);
				return;
			}
		}
		// otherwise create it
		else {
			try {
				fs.writeFileSync(this.path, JSON.stringify(this.data), 'utf8');
			} catch(e) {
				console.log("Failed to create State File");
				criticalError(e);
				return;
			}
		}
	}

	private saveQueued = false;

	private queueSave(): void {
		this.saveQueued = true;
		
		setTimeout(() => {
			if (this.saveQueued) {
				this.saveQueued = false;
				fs.writeFile(this.path, JSON.stringify(this.data), () => {});
			}
		}, 0)
	}

	public read(primaryKey: string, key: string): any {
		if (!this.data[primaryKey]) {
			this.data[primaryKey] = {};
		}

		return this.data[primaryKey][key];
	}

	public write(primaryKey: string, key: string, value: any): void {
		if (!this.data[primaryKey]) {
			this.data[primaryKey] = {};
		}

		this.data[primaryKey][key] = value;
		this.queueSave();
	}
}
