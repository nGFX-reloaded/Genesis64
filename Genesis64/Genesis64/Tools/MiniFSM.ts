
/** a single state for the Mini FSM */
class MiniFSMState {

	public Name: string;
	public Parameter: string;
	public IsLateUpdate: boolean;
	public IsRunning: boolean;
	public OnEnterID: number;
	public OnUpdateID: number;
	public OnExitID: number;

	constructor(_Name: string, _Parameter: string, _OnEnterID: number, _OnUpdateID: number, _OnExitID: number) {
		this.Name = _Name;
		this.Parameter = _Parameter;
		this.OnEnterID = _OnEnterID;
		this.OnUpdateID = _OnUpdateID;
		this.OnExitID = _OnExitID;
		this.IsLateUpdate = false;
		this.IsRunning = true;
	}

	public toString = (): string => {
		return "FSMState: " + this.Name + " -> p: " + this.Parameter + ", s: " + this.OnEnterID + ", u: " + this.OnUpdateID + ", e: " + this.OnExitID;
	}
}

/** a single worker */
class MiniFSMWorker {
	public Name: string;
	public IsRunning: boolean;
	public WorkerID: number;

	constructor(_Name: string, _WorkerID: number, _IsRunning: boolean) {
		this.Name = _Name;
		this.WorkerID = _WorkerID;
		this.IsRunning = _IsRunning;
	}

	public toString = (): string => {
		return "FsmWorker: " + this.Name + " -> id: " + this.WorkerID;
	}

}

enum ActionType {
	onEnter, onUpdate, onExit
}

class MiniFSM {

	//#region " ----- privates ----- "

	private m_Name: string = "";

	private m_isRunning: boolean = true; // global running switch
	private m_isRunningState: boolean = false; // current state's Update running
	private m_debug: boolean = false;

	private m_iCurrentState: number = -1;
	private m_iCurrentStateUpdate: number = -1;
	private m_iLastState: number = -1;
	private m_iWorker: number = -1;

	private m_strCallbackState: string = ""; // just as a convenience

	private m_dictNames: Map<string, number> = new Map<string, number>();
	private m_lstStates: Array<MiniFSMState> = [];
	private m_lstWorker: Array<MiniFSMWorker> = [];
	private m_lstAction: Array<Function> = [];

	//#endregion

	//#region " ----- publics ----- "

	get Name(): string { return this.m_Name; }
	set Name(value: string) { this.m_Name = value; }

	get State(): string { return ((this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) ? this.m_lstStates[this.m_iCurrentState].Name : ""); }

	get Parameter(): string { return ((this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) ? this.m_lstStates[this.m_iCurrentState].Parameter : ""); }
	set Parameter(value: string) {
		if (this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) {
			let state: MiniFSMState = this.m_lstStates[this.m_iCurrentState];
			state.Parameter = value;
			this.m_lstStates[this.m_iCurrentState] = state;
		}
	}

	get StateID(): number { return this.m_iCurrentState; }

	get CallbackState(): string { return this.m_strCallbackState; }
	set CallbackState(value: string) { this.m_strCallbackState = value; }

	get LastState(): string { return ((this.m_iLastState != -1) ? this.m_lstStates[this.m_iLastState].Name : ""); }


	get IsRunning(): boolean { return this.m_isRunning; }
	set IsRunning(value: boolean) { this.m_isRunning = value; }

	get Debug(): boolean { return this.m_debug; }
	set Debug(value: boolean) { this.m_debug = value; }

	public static SKIP_ONEXIT: string = "@@@SKIPEXIT@@@";

	//#endregion

	//
	// ----- base -----
	//
	constructor(name?: string, isRunning?: boolean) {

		if (typeof name !== "undefined") {
			this.m_Name = name;
		}

		if (typeof isRunning !== "undefined") {
			this.m_isRunning = isRunning;
		} else {
			this.m_isRunning = false;
		}

	}

	/**
	 * Update should be called from a request animation frame 
	 */
	public Update(): void {

		if (this.m_isRunning) {

			for (this.m_iWorker = 0; this.m_iWorker < this.m_lstWorker.length; this.m_iWorker++) {
				if (this.m_lstWorker[this.m_iWorker].IsRunning)
					this.m_lstAction[this.m_lstWorker[this.m_iWorker].WorkerID]();
			}
			if (this.m_iCurrentStateUpdate != -1)
				if (this.m_lstStates[this.m_iCurrentState].IsRunning)
					this.m_lstAction[this.m_iCurrentStateUpdate]();
		}
	}

	//#region " ----- public commands ----- "
	
	/**
	 * Resets this FSM and pauses it. Removes all states and workers
	 */
	public Reset(): void {

		this.m_isRunning = false;
		this.m_isRunningState = false;

		this.m_iCurrentState = -1;
		this.m_iCurrentStateUpdate = -1;
		this.m_iLastState = -1;
		this.m_iWorker = -1;

		this.m_strCallbackState = ""; // just as a convenience

		this.m_dictNames.clear();
		this.m_lstStates = [];
		this.m_lstWorker = [];
		this.m_lstAction = [];

	}

	/**
	 * Sets a new state (and the parameter) for that state, runs OnExit on the previous state if possible
	 * @param name			Name of the new state
	 * @param parameter		Parameter set on the new state
	 */
	public SetState(name: string, parameter?: string): void {

		let id: number = -1;

		// stup current update
		this.m_iCurrentStateUpdate = -1;
		this.m_isRunningState = false;

		if (typeof parameter === "undefined")
			parameter = "";

		if (this.m_dictNames.has(name)) {
			this.m_lstStates[this.m_dictNames.get(name)].Parameter = parameter;

		} else {
			return;
		}

		if (this.m_debug) console.log("fsm:", name, parameter);

		if (this.m_iCurrentState != -1 && parameter != MiniFSM.SKIP_ONEXIT) {

			// run on exit
			id = this.m_lstStates[this.m_iCurrentState].OnExitID;
			if (id != -1) this.m_lstAction[id]();

			this.m_iLastState = this.m_iCurrentState;
			this.m_iCurrentState = -1;
		}

		// if we had an OnExit, run the new state one frame later
		if (this.m_dictNames.has(name)) {
			id = this.m_dictNames.get(name);

			this.m_iCurrentState = id;

			// run on enter
			// Debug.Log(m_strName + " -> " + Name + " -> " + m_lstStates[id].OnEnterID.ToString() + ", " + m_lstAction.Count.ToString());
			if (this.m_lstStates[id].OnEnterID != -1) this.m_lstAction[this.m_lstStates[id].OnEnterID]();

			// start update
			if (this.m_lstStates[id].OnUpdateID != -1) {
				this.m_iCurrentStateUpdate = this.m_lstStates[id].OnUpdateID;
				this.m_isRunningState = true;
			}

		} else {
			console.error("MiniFSM: missing state -> " + name + ".");

		}

	}

	/**
	 * Pauses this FSM, stops current state's update and all background workers
	 * OR given a name, pauses a single state only
	 * @param name			optional name of the state to pause
	 */
	public Pause(name?: string): void {

		if (typeof name === "undefined") { // global pause
			this.m_isRunning = false;

		} else { // state pause
			if (this.m_dictNames.has(name)) {
				this.m_lstStates[this.m_dictNames.get(name)].IsRunning = false;
			}
		}

	}

	/**
	 * Pauses a single worker
	 * @param name			Name of the worker to pause
	 */
	public PauseWorker(name: string): void {

		if (this.m_dictNames.has(name)) {
			this.m_lstWorker[this.m_dictNames.get(name)].IsRunning = false;
		}

	}

	/**
	 * Unpauses this FSM, starts current state's update and all background workers
	 * OR given a name, unpauses a single state only
	 * @param name			optional name of the state to pause
	 */
	public Unpause(name?: string): void {

		if (typeof name === "undefined") { // global unpause
			this.m_isRunning = true;

		} else { // state unpause
			if (this.m_dictNames.has(name)) {
				this.m_lstStates[this.m_dictNames.get(name)].IsRunning = true;
			}
		}

	}

	/**
	 * Unpauses a single worker
	 * @param name			Name of the worker to pause
	 */
	public UnpauseWorker(name: string): void {

		if (this.m_dictNames.has(name)) {
			if (typeof this.m_lstWorker[this.m_dictNames.get(name)] !== "undefined")
				this.m_lstWorker[this.m_dictNames.get(name)].IsRunning = true;
		}

	}

	/** Exits the current state and tries to run its OnExit event */
	public Exit(): void {

		this.m_iCurrentStateUpdate = -1;
		this.m_isRunningState = false;
		this.m_iLastState = this.m_iCurrentState;

		if (this.m_lstStates[this.m_iCurrentState].OnExitID != -1) this.m_lstAction[this.m_lstStates[this.m_iCurrentState].OnExitID]();

		this.m_iCurrentState = -1;

	}

	/** returns the name for a given callback state and clears it */
	public UseCallbackState(): string {
		const tmp: string = this.m_strCallbackState;

		this.m_strCallbackState = "";

		return tmp;
	}

	/**
	 * check if current state is named Name
	 * @param name			Name of the state to check
	 */
	public IsState(name: string): boolean {
		return (this.State == name);
	}

	/**
	 *  ckeck if current parameter is Parameter
	 * @param parameter		Parameter to check
	 */
	public IsParameter(parameter: string): boolean {
		return (this.Parameter == parameter);
	}

	//#endregion

	//#region " ----- FSM Add Methods ----- "
	//
	/**
	 * Adds a new state with name and assigns given functions
	 * @param name			name of the state
	 * @param parameter		optional parameter, ""
	 * @param onEnter		optional onEnter function
	 * @param onExit		optional onExit function
	 * @param onUpdate		optional onUpdate function
	 */
	public Add(name: string, parameter?: string,
		onEnter?: Function | null,
		onExit?: Function | null,
		onUpdate?: Function): number {

		let id: number = -1;

		if (typeof parameter === "undefined")
			parameter = "";

		if (typeof onEnter === "undefined")
			onEnter = null;

		if (typeof onExit === "undefined")
			onExit = null;

		if (typeof onUpdate === "undefined")
			onUpdate = null;

		if (this.m_dictNames.has(name)) {
			id = this.m_lstStates.length;

			this.m_lstStates.push(
				new MiniFSMState(
					name,
					(parameter != null) ? parameter : "",
					(onEnter != null) ? this.AddAction(onEnter) : -1,
					(onUpdate != null) ? this.AddAction(onUpdate) : -1,
					(onExit != null) ? this.AddAction(onExit) : -1
				)
			);

			this.m_dictNames.set(name, id);

		} else {
			console.error("MiniFSM: Cannot add state '" + name + "', name already exists.")

		}

		return id;
	}

	/**
	 * Adds a state with a single action
	 * @param name			name of the state
	 * @param action		function for that event
	 * @param type			event type
	 */
	public AddSingle(name: string, action: Function, type: ActionType) {

		let id: number = -1;

		switch (type) {
			case ActionType.onEnter:
				id = this.Add(name, "", action);
				break;

			case ActionType.onExit:
				id = this.Add(name, "", null, action);
				break;

			case ActionType.onUpdate:
				id = this.Add(name, "", null, null, action);
				break;
		}

		return id;
	}

	/**
	 * Adds a new worker to run in update
	 * @param name			Name of the worker
	 * @param action		method to run
	 * @param autostart		run immediately
	 */
	public AddWorker(name: string, action: Function, autostart: boolean): number {

		let id: number = -1;

		if (this.m_dictNames.has(name)) {
			id = this.m_lstWorker.length;

			this.m_lstWorker.push(
				new MiniFSMWorker(name, this.AddAction(action), autostart)
			);

			this.m_dictNames.set(name, id);

		} else {
			console.error("MiniFSM: Cannot add worker '" + name + "', name already exists.")
		}

		return id;
	}

	//#endregion

	//#region " ----- Private Methods ----- "

	/**
	 * Adds an action function to the list
	 * @param action		function
	 */
	private AddAction(action: Function): number {

		let id:number = this.m_lstAction.length;

		this.m_lstAction.push(action);

		return id;
	}

	//#endregion

}