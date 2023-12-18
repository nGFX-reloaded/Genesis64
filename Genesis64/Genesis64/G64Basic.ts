
interface BasicLine {
	Ln: number;
	Code: string;
	Token: G64Token[];
}

interface TokenizerData {
	Code: string;			// encoded current line
	Parts: string[];		// parts of the code separated by :
	Literals: string[];		// literals, ie. everything inside ""
	Tokens: G64Token[];		// tokens for the current part

	Errors: string[];		// error messages
}

class G64Basic {

	//#region " ----- Privates ----- "

	private m_Commands: BasicCmd[] = [];

	private m_mapCommands: Map<string, number> = new Map<string, number>();
	private m_mapFn: Map<string, number> = new Map<string, number>();
	private m_mapAbbrv: Map<string, number> = new Map<string, number>();

	private m_regexCmd: RegExp = null;
	private m_regexFn: RegExp = null;
	private m_regexAbbrv: RegExp = null;

	private m_TokenizerData: TokenizerData = { Code: "", Parts: null, Literals: null, Tokens: null, Errors: [] };

	//#endregion

	public TokenizeLine(line: BasicLine): BasicLine {

		const split: SplitItem = Helper.EncodeLiterals(line.Code);
		const code: string = this.DeAbbreviate(split.Source);

		this.m_TokenizerData = {
			Code: code,
			Parts: Helper.CodeSplitter(code, ":"),
			Literals: split.List,
			Tokens: [],
			Errors: []
		};

		console.log("TokenizeLine: ", this.m_TokenizerData);



		return line;
	}




	//#region " ----- BASIC V2 ----- "

	public InitBasicV2(): void {

		//
		// commands
		//
		this.AddCommand(Tokentype.cmd, "close", "clO", 160);
		this.AddCommand(Tokentype.cmd, "clr", "cL", 156);
		this.AddCommand(Tokentype.cmd, "cont", "cO", 154);
		this.AddCommand(Tokentype.cmd, "cmd", "cM", 157);
		this.AddCommand(Tokentype.cmd, "data", "dA", 131);
		this.AddCommand(Tokentype.cmd, "def", "dE", 150);
		this.AddCommand(Tokentype.cmd, "dim", "dI", 134);
		this.AddCommand(Tokentype.cmd, "end", "eN", 128);
		this.AddCommand(Tokentype.cmd, "for", "fO", 129);
		this.AddCommand(Tokentype.cmd, "get", "gE", 161);
		this.AddCommand(Tokentype.cmd, "get#", "", [161, 35]);
		this.AddCommand(Tokentype.cmd, "gosub", "goS", 141);
		this.AddCommand(Tokentype.cmd, "goto", "gO", 137);
		this.AddCommand(Tokentype.cmd, "if", "", 139);
		this.AddCommand(Tokentype.cmd, "input", "", 133);
		this.AddCommand(Tokentype.cmd, "input#", "iN", 132);
		this.AddCommand(Tokentype.cmd, "let", "lE", 136);
		this.AddCommand(Tokentype.cmd, "list", "lI", 155);
		this.AddCommand(Tokentype.cmd, "load", "lA", 147);
		this.AddCommand(Tokentype.cmd, "new", "", 162);
		this.AddCommand(Tokentype.cmd, "next", "nE", 130);
		this.AddCommand(Tokentype.cmd, "on", "", 145);
		this.AddCommand(Tokentype.cmd, "open", "oP", 159);
		this.AddCommand(Tokentype.cmd, "poke", "pO", 151);
		this.AddCommand(Tokentype.cmd, "print", "?", 153);
		this.AddCommand(Tokentype.cmd, "print#", "pR", 152);
		this.AddCommand(Tokentype.cmd, "read", "rE", 135);
		this.AddCommand(Tokentype.cmd, "rem", "", 143);
		this.AddCommand(Tokentype.cmd, "restore", "reS", 140);
		this.AddCommand(Tokentype.cmd, "return", "reT", 142);
		this.AddCommand(Tokentype.cmd, "run", "rU", 138);
		this.AddCommand(Tokentype.cmd, "save", "sA", 148);
		this.AddCommand(Tokentype.cmd, "stop", "sT", 144);
		this.AddCommand(Tokentype.cmd, "step", "stE", 169);
		this.AddCommand(Tokentype.cmd, "sys", "sY", 158);
		this.AddCommand(Tokentype.cmd, "then", "tH", 167);
		this.AddCommand(Tokentype.cmd, "to", "", 164);
		this.AddCommand(Tokentype.cmd, "verify", "vE", 149);
		this.AddCommand(Tokentype.cmd, "wait", "wA", 146);

		//
		// fn num
		//
		this.AddCommand(Tokentype.fnnum, "abs", "aB", 182);
		this.AddCommand(Tokentype.fnnum, "asc", "aS", 198);
		this.AddCommand(Tokentype.fnnum, "atn", "aT", 193);
		this.AddCommand(Tokentype.fnnum, "cos", "", 190);
		this.AddCommand(Tokentype.fnnum, "exp", "eX", 189);
		this.AddCommand(Tokentype.fnnum, "fn", "", 165);
		this.AddCommand(Tokentype.fnnum, "fre", "fR", 184);
		this.AddCommand(Tokentype.fnnum, "int", "", 181);
		this.AddCommand(Tokentype.fnnum, "len", "", 195);
		this.AddCommand(Tokentype.fnnum, "log", "", 188);
		this.AddCommand(Tokentype.fnnum, "peek", "pE", 194);
		this.AddCommand(Tokentype.fnnum, "pos", "", 185);
		this.AddCommand(Tokentype.fnnum, "rnd", "rN", 187);
		this.AddCommand(Tokentype.fnnum, "sgn", "sG", 180);
		this.AddCommand(Tokentype.fnnum, "sin", "sI", 191);
		this.AddCommand(Tokentype.fnnum, "sqr", "sQ", 186);
		this.AddCommand(Tokentype.fnnum, "tan", "", 192);
		this.AddCommand(Tokentype.fnnum, "usr", "uS", 183);
		this.AddCommand(Tokentype.fnnum, "val", "vA", 197);

		//
		// fn str
		//
		this.AddCommand(Tokentype.fnstr, "chr$", "cH", 199);
		this.AddCommand(Tokentype.fnstr, "left$", "leF", 200);
		this.AddCommand(Tokentype.fnstr, "mid$", "mI", 202);
		this.AddCommand(Tokentype.fnstr, "right$", "rI", 201);
		this.AddCommand(Tokentype.fnstr, "str$", "stR", 196);

		//
		// fn out
		//
		this.AddCommand(Tokentype.fnout, "spc(", "sP", 166);
		this.AddCommand(Tokentype.fnout, "tab(", "tA", 163);

		//
		// ops
		//
		this.AddCommand(Tokentype.ops, "and", "aN", 175);
		this.AddCommand(Tokentype.ops, "or", "", 176);

		this.AddCommand(Tokentype.ops, "+", "", 43); // this works for strings and numbers
		this.AddCommand(Tokentype.ops, "-", "", 45);
		this.AddCommand(Tokentype.ops, "*", "", 42);
		this.AddCommand(Tokentype.ops, "/", "", 47);
		this.AddCommand(Tokentype.ops, "^", "", 94);

		this.AddCommand(Tokentype.ops, "=", "", 61);
		this.AddCommand(Tokentype.ops, "<>", "", [60, 62]);
		this.AddCommand(Tokentype.ops, "<=", "", [60, 61]);
		this.AddCommand(Tokentype.ops, ">=", "", [62, 61]);
		this.AddCommand(Tokentype.ops, "<", "", 60);
		this.AddCommand(Tokentype.ops, ">", "", 62);

		this.AddCommand(Tokentype.not, "not", "nO", 168);

		//
		// sysvar / const
		//
		// "st"
		// "ti"
		// "ti$"
		// "{pi}"

		this.InitLists();

	}

	private AddCommand(type: Tokentype, name: string, short: string, code: number | number[]): void {
		this.m_Commands.push({
			Name: name,
			Abbrv: short,
			TknId: (typeof code === "number") ? [code] : code,
			Type: type
		});
	}

	private InitLists(): void {

		const aCmd: string[] = [];
		const aFn: string[] = [];
		const aAbbrv: string[] = [];


		for (let i: number = 0; i < this.m_Commands.length; i++) {
			if (this.m_Commands[i].Type == Tokentype.cmd) {
				aCmd.push(this.m_Commands[i].Name);
				this.m_mapCommands.set(this.m_Commands[i].Name, i);
			}

			if (this.m_Commands[i].Type == Tokentype.fnnum || this.m_Commands[i].Type == Tokentype.fnstr || this.m_Commands[i].Type == Tokentype.fnout) {
				aFn.push(this.m_Commands[i].Name);
				this.m_mapFn.set(this.m_Commands[i].Name, i);
			}

			if (this.m_Commands[i].Abbrv.length > 0) {
				aAbbrv.push(this.m_Commands[i].Abbrv);
				this.m_mapAbbrv.set(this.m_Commands[i].Abbrv, i);
			}

		}

		this.m_regexCmd = new RegExp(Helper.EscapeRegex(aCmd.join("|")));
		this.m_regexFn = new RegExp(Helper.EscapeRegex(aFn.join("|")));
		this.m_regexAbbrv = new RegExp(Helper.EscapeRegex(aAbbrv.join("|")));

	}

	//#endregion

	//#region " ----- Helper ----- "

	private DeAbbreviate(code: string): string {

		this.m_regexAbbrv.lastIndex = -1;
		const match: string[] = code.match(this.m_regexAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_Commands[this.m_mapAbbrv.get(match[i])].Name);
			}
		}

		return code;
	}

	public IsReservedWord(word: string): boolean {
		let result: boolean = false;

		for (let i: number = 0; i < this.m_Commands.length; i++) {
			if (word.trim().startsWith(this.m_Commands[i].Name)) {
				result = true;
				break;
			}
		}

		return result;
	}

	//#endregion

	//#region " ----- Type Testing ----- "



	//#endregion
}