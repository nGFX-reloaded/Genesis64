/**
 * Main Genesis64 class, singleton.
 */

class Genesis64 {

	public readonly Version: string = "0.0.1";

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

	private Init(): void {

	}

	//#endregion

	//#region " ----- Privates ----- "

	private m_Basic: G64Basic = new G64Basic();
	private m_Memory: G64Memory = new G64Memory();

	//#endregion

	//#region " ----- Publics ----- "

	get Basic(): G64Basic { return this.m_Basic; };
	get Memory(): G64Memory { return this.m_Memory; };

	//#endregion

	public Test() {
		const code = (document.getElementById("code") as HTMLPreElement).innerText;

		this.m_Basic.Init(this.m_Memory);
		this.m_Basic.InitBasicV2();

		this.m_Basic.Parse(code);
		
	}
	
}