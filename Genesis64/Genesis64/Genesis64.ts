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

	//#endregion

	//#region " ----- Publics ----- "

	//#endregion

	public Setup(divContainer: HTMLDivElement): void {

	}

	public Temp(): void {
		const code = document.getElementById("code").textContent;

		console.log(code);
		


		// split into lines
		// transpile = to ==, array () into array[], literals 123 or "abc" into {id} and store as token
		// first transpile literals
		// -> 10 print 123, "abc" -> 10 print {0}, {1}
		// -> 10 print 123 + 456 -> 10 print {0} + {1}
	
	}

}