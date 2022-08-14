import * as fs from 'fs'
import * as Path from 'path'

import { criticalError } from "./errorHandling.js"
import config from "../config/server.json" assert { type: 'json' };

const state_folder = config.state_folder;
const state_suffix = config.state_suffix;

// object template, with string key and generic value
interface IDictionary<TValue>
{
    [ id: string ]: TValue
}

export interface ReadOnlyState
{
	/** Read a Value from this state */
	read: (primaryKey: string, key: string) => any
}

/**
 * Manages a State which is presistent between restarts
 */
export class State
{
	private data: IDictionary<IDictionary<any>> = { };
	private path: fs.PathLike;

	/**
	 * creates a new state, and loads itself from disk into memory, if the unique_identifier exists
	 */
	constructor(unique_identifier: string)
	{
		this.path = Path.resolve( `${state_folder}/${unique_identifier}${state_suffix}` );
	
		// attempt to open state path
		let files: Array<string>;
		let file: String | undefined;

		let folderPath = Path.resolve(state_folder);

		if (!fs.existsSync(folderPath))
		{
			fs.mkdirSync(folderPath);
		}

		try
		{
			files = fs.readdirSync(folderPath);
		}
		catch (e)
		{
			criticalError("Could not read State Directory", e);

			return;
		}

		// check if file exists
		file = files.find(f => f === `${unique_identifier}${state_suffix}`);

		// if it does, import its contents
		if (file !== undefined)
		{

			try
			{
				let content = fs.readFileSync( this.path, 'utf8');
				this.data = JSON.parse(content);
			}
			catch (e)
			{
				console.log("Failed to read State");
				criticalError(e);

				return;
			}

		}
		else // otherwise create it
		{

			try
			{
				fs.writeFileSync( this.path, JSON.stringify( this.data ), 'utf8');
			}
			catch (e)
			{
				console.log("Failed to create State File");
				criticalError(e);

				return;
			}
		}
	}

	/**
	 * reads a value from the state
	 */
	public read(primaryKey: string, key: string): any {
		if (!this.data[primaryKey])
		{
			this.data[primaryKey] = { };
		}

		return this.data[primaryKey][key];
	}

	/**
	 * writes a value to the state
	 */
	public write(primaryKey: string, key: string, value: any): void
	{
		if (!this.data[primaryKey])
		{
			this.data[primaryKey] = { };
		}

		this.data[primaryKey][key] = value;
		this._queueSave();
	}

	private saveQueued = false;

	/** queues a disk write action to the back of the event loop, so multiple writes don't overlap */
	private _queueSave(): void
	{
		this.saveQueued = true;
		
		// send to back of event loop, in case any other saves are queued
		setTimeout(() => {

			// only the last queued save need to run
			if (this.saveQueued)
			{
				this.saveQueued = false;
				fs.writeFile( this.path, JSON.stringify( this.data ), () => {} );
			}

		}, 0);

	}

}
