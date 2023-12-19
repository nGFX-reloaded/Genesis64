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
		const basic: G64Basic = new G64Basic()
		const code = document.getElementById("code").textContent;

		basic.InitBasicV2();

		const aLines: string[] = Helper.CodeSplitter(code, "\n");

		console.log(code);

		// note to self: g64 only parses one line at a time.

		for (let i: number = 0; i < aLines.length; i++) {
			const line: RegExpMatchArray = aLines[i].match(/^(\d*)\s*(.*)/);

			if (line == null)
				continue;

			if (line[1].length == 0 && line[2].length == 0)
				continue;


			if (line[2].length > 0) {
				const g64Line: BasicLine = {
					Ln: -1,
					Code: line[2],
					Token: []
				};

				basic.TokenizeLine(g64Line);				
			aLines[i] = g64Line.Code;

				if (line[1].length == 0) {
					console.log("direct:", g64Line.Code);
				} else {
					console.log("line:", line[1], g64Line.Code);
				}
			} else {
				console.log("delete line:", line[1]);
			}
					}

		document.getElementById("convert").textContent = aLines.join("\n");
		
	}

}