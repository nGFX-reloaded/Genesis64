/// <reference path="Tools/*">

class Genesis64 {

	//#region " ----- singleton setup ----- "

	private static m_instance: Genesis64;

	private constructor() {
		this.Init();
	}

	public static get Instance(): Genesis64 {
		return this.m_instance || (this.m_instance = new this());
	}

	//#endregion

	//#region " ----- Privates ----- "

	private m_divContainer: HTMLDivElement;		// anchor element to which everything Genesis64 is added to
	private m_fsm: MiniFSM;

	//#endregion

	private Init() {

		console.log("Genesis64 Init."); 

		this.m_divContainer = document.getElementById("Genesis64") as HTMLDivElement;

	}

}