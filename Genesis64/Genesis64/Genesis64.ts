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

	//#region " ----- Statics ----- "

	private static RegLineNr: RegExp = /^\s*(\d+)(.*)/;

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

		this.m_Basic.Init(this.m_Memory, BasicVersion.v2);

		this.CommitCode(code);

	}

	public CommitCode(code: string): void {

		let lines: string[] = Tools.CodeSplitter(code, "\n");

		for (let i = 0; i < lines.length; i++) {
			const match: string[] = lines[i].match(Genesis64.RegLineNr);
			let lineNr: number = -1;
			let line: string = lines[i].trim();

			console.log(match);

			if (match !== null) {
				lineNr = parseInt(match[1]);
				line = match[2].trim();
			}

			console.log(lineNr, line);

			if (line === "") {
				if (lineNr >= 0) console.log("remove line:", lineNr);
			} else {
				// add line to prg
				// parse in basic and store line token in memory
				this.m_Basic.ParseLine(line);
			}


		}


	}

}