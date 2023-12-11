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

		const b: G64Basic = new G64Basic()
		b.InitBasicV2();
		const aLines: string[] = Helper.CodeSplitter(code, "\n");

		for (let i: number = 0; i < aLines.length; i++) {
			const regLn: RegExp = /^(\d*)\s*(.*)/;
			const Line: BasicLine = { Ln: -1, Literals: [], Parts: [], Code: aLines[i] };

			let match: RegExpMatchArray = aLines[i].match(regLn);
			if (match != null) {
				if (match[1] != "")
					Line.Ln = parseInt(match[1]);

				Line.Code = match[2];
				if (Line.Code == "" && Line.Ln >= 0) {
					console.log("delete line:", Line.Ln);
				} else {
					const split: SplitItem = Helper.EncodeLiterals(Line.Code.replace("\r", ""));
					Line.Literals = split.List;
					Line.Parts = Helper.CodeSplitter(split.Source, ":");
					Line.Code = split.Source;

					for (let j = 0; j < Line.Parts.length; j++) {
						Line.Parts[j] = Helper.RestoreLiterals(b.EncodeArray(Line.Parts[j]), Line.Literals);
					}

					console.log(i, Line.Parts.join(":"));
				}
			}
		}
	}

}