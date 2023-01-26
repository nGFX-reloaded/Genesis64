/// <reference path="Tools/*">

//#region " ----- Types / Enums ----- "

enum KeyboardMode {
	default, german
}

type Genesis64Options = {
	keyboardMode: KeyboardMode;
	basicVersion: BasicVersion;
};

//#endregion

class Genesis64 {

	//#region " ----- singleton setup ----- "

	private static m_instance: Genesis64;

	private constructor() { }

	public static get Instance(): Genesis64 {
		if (typeof this.m_instance === "undefined") {
			this.m_instance = new this();
			this.m_instance.Init();
		}

		return this.m_instance;
	}

	//#endregion

	//#region " ----- Privates ----- "

	private m_Options: Genesis64Options;

	private m_divContainer: HTMLDivElement;		// anchor element to which everything Genesis64 is added to
	private m_fsm: MiniFSM;

	private m_Mem: G64Memory;
	private m_Basic: G64Basic;
	private m_colors: G64Colors;

	private m_LogBuffer: string = "";

	//#endregion

	//#region " ----- Publics ----- "

	public get Memory(): G64Memory { return this.m_Mem; }

	public get Options(): Genesis64Options { return this.m_Options; }

	public readonly Version: string = "0.0.1";

	//#endregion

	//#region " ----- Private Methods ----- "

	private Init() {

		this.m_Options = {
			basicVersion: BasicVersion.v2,
			keyboardMode: KeyboardMode.default
		}

		this.m_fsm = new MiniFSM("init", false);
		this.m_Mem = new G64Memory();
		this.m_colors = new G64Colors();
		this.m_Basic = new G64Basic();

		this.m_fsm.AddSingle("Startup",
			() => {
				this.Log("Starting Genesis64\n");
				this.m_fsm.SetState("CreateHTML");
			}
			, FsmActionType.onEnter);

		this.m_fsm.AddSingle("CreateHTML",
			() => {
				this.m_divContainer = document.getElementById("Genesis64") as HTMLDivElement;
				//...
				this.m_fsm.SetState("InitRam");
			},
			FsmActionType.onEnter);

		this.m_fsm.Add("InitRam", "",
			() => {
				if (this.m_Mem.Init() === -666)
					this.m_fsm.SetState("SetColors");
			},
			null,
			() => { if (this.m_Mem.IsDone) { this.m_fsm.SetState("InitRam"); } }
		);

		this.m_fsm.AddSingle("SetColors",
			() => {
				this.m_colors.SetColorView();
				this.m_fsm.SetState("InitBasic");
			},
			FsmActionType.onEnter);

		this.m_fsm.AddSingle("InitBasic",
			() => {
				this.m_Basic.Init({ basicVersion: BasicVersion.v2 });
				this.m_fsm.SetState("Done");
			},
			FsmActionType.onEnter);


		this.m_fsm.AddSingle("Done",
			() => {
				console.log("Genesis64 instance initialized.");
				this.m_fsm.StopTimer();
				this.m_fsm.SetState("Test");
			},
			FsmActionType.onEnter);

		this.m_fsm.AddSingle("Test",
			() => {
				this.m_Basic.Temp(
					(document.getElementById("code") as HTMLTextAreaElement).textContent.trim()
				);
			},
			FsmActionType.onEnter);

		this.m_fsm.StartTimer(100);
		this.m_fsm.Unpause();
		this.m_fsm.SetState("Startup");
	}

	//#endregion

	public SetOptions(options: Genesis64Options): void {
		this.m_Options = {
			...options
		}
	}

	public Log(message: string): void {

		this.m_LogBuffer += message;

		if (this.m_LogBuffer.endsWith("\n")) {
			console.log(this.m_LogBuffer.substring(0, this.m_LogBuffer.length - 1));
			this.m_LogBuffer = "";
		}

	}

}