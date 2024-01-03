
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
	Level: number;			// current level

	Errors: string[];		// error messages
}

class G64Basic {

	//#region " ----- Privates ----- "

	private m_BasicCmds: BasicCmd[] = [];

	private m_mapCmd: Map<string, number> = new Map<string, number>();
	private m_mapFn: Map<string, number> = new Map<string, number>();
	private m_mapAbbrv: Map<string, number> = new Map<string, number>();

	private m_regexCmd: RegExp = null;
	private m_regexFn: RegExp = null;
	private m_regexAbbrv: RegExp = null;
	private m_regexDeAbbrv: RegExp = null;

	private m_TokenizerData: TokenizerData = null;

	//#endregion

	public TokenizeLine(line: BasicLine): BasicLine {

		const split: SplitItem = Helper.EncodeLiterals(line.Code);
		const code: string = this.DeAbbreviate(split.Source);

		this.m_TokenizerData = {
			Code: code,
			Parts: Helper.CodeSplitter(code, ":"),
			Literals: split.List,
			Tokens: [],
			Level: 0,
			Errors: []
		};

		// console.log("TokenizeLine: ", this.m_TokenizerData);

		for (let i: number = 0; i < this.m_TokenizerData.Parts.length; i++) {
			this.TokenizePart(i);
		}

		line.Code = Helper.RestoreLiterals(this.m_TokenizerData.Code, this.m_TokenizerData.Literals);

		return line;
	}

	private TokenizePart(id: number): void {

		let part: string = this.FixLet(this.m_TokenizerData.Parts[id]);

		this.Tokenizer(part);

	}

	private Tokenizer(code: string): G64Token {

		const token: G64Token = this.CreateError(ErrorCodes.SYNTAX, "no valid code found.");
		let match: string[] = [];


		this.m_regexCmd.lastIndex = -1;

		// commands
		match = code.match(this.m_regexCmd);
		if (match !== null) {
			console.log(code, "tokenizer:", match);
		}




		return token;
	}



	//#region " ----- BASIC V2 ----- "

	public InitBasicV2(): void {

		let id: number = -1;

		//
		// commands
		//
		const paramNum: CmdParam = this.AddParam(1, [Tokentype.num]);

		this.AddCommand(Tokentype.cmd, "close", "clO", 160, paramNum);
		this.AddCommand(Tokentype.cmd, "clr", "cL", 156);
		this.AddCommand(Tokentype.cmd, "cont", "cO", 154);
		this.AddCommand(Tokentype.cmd, "cmd", "cM", 157, this.AddParam(-1, [Tokentype.num, Tokentype.any])); // cmd splitter
		this.AddCommand(Tokentype.cmd, "data", "dA", 131, this.AddParam(-1, [Tokentype.any])); // data splitter
		this.AddCommand(Tokentype.cmd, "def", "dE", 150); // def splitter
		this.AddCommand(Tokentype.cmd, "dim", "dI", 134); // dim splitter
		this.AddCommand(Tokentype.cmd, "end", "eN", 128);
		this.AddCommand(Tokentype.cmd, "for", "fO", 129); // for splitter
		this.AddCommand(Tokentype.cmd, "get", "gE", 161, this.AddParam(-1, [Tokentype.var, Tokentype.var]));
		this.AddCommand(Tokentype.cmd, "get#", "", [161, 35], this.AddParam(-2, [Tokentype.num, Tokentype.var, Tokentype.var]));
		this.AddCommand(Tokentype.cmd, "gosub", "goS", 141, paramNum);
		this.AddCommand(Tokentype.cmd, "goto", "gO", 137, paramNum);
		this.AddCommand(Tokentype.cmd, "if", "", 139); // if splitter
		this.AddCommand(Tokentype.cmd, "input", "", 133); // input splitter
		this.AddCommand(Tokentype.cmd, "input#", "iN", 132); // input# splitter
		this.AddCommand(Tokentype.cmd, "let", "lE", 136); // let splitter
		this.AddCommand(Tokentype.cmd, "list", "lI", 155); // list splitter
		this.AddCommand(Tokentype.cmd, "load", "lA", 147, this.AddParam( 0,  [Tokentype.str, Tokentype.num, Tokentype.num] ));
		this.AddCommand(Tokentype.cmd, "new", "", 162);
		this.AddCommand(Tokentype.cmd, "next", "nE", 130, this.AddParam( 0, [Tokentype.var]));
		this.AddCommand(Tokentype.cmd, "on", "", 145); // on splitter
		this.AddCommand(Tokentype.cmd, "open", "oP", 159, this.AddParam(1,[Tokentype.num, Tokentype.num, Tokentype.num, Tokentype.str]));
		this.AddCommand(Tokentype.cmd, "poke", "pO", 151, this.AddParam(2, [Tokentype.adr, Tokentype.byte]));
		this.AddCommand(Tokentype.cmd, "print", "?", 153); // print splitter
		this.AddCommand(Tokentype.cmd, "print#", "pR", 152); // print# splitter
		this.AddCommand(Tokentype.cmd, "read", "rE", 135, this.AddParam(-1, [Tokentype.var]));
		this.AddCommand(Tokentype.cmd, "rem", "", 143);
		this.AddCommand(Tokentype.cmd, "restore", "reS", 140);
		this.AddCommand(Tokentype.cmd, "return", "reT", 142);
		this.AddCommand(Tokentype.cmd, "run", "rU", 138, this.AddParam(0, [Tokentype.num]));
		this.AddCommand(Tokentype.cmd, "save", "sA", 148, this.AddParam(0, [Tokentype.str, Tokentype.num, Tokentype.num]));
		this.AddCommand(Tokentype.cmd, "stop", "sT", 144);
		this.AddCommand(Tokentype.cmd, "step", "stE", 169);
		this.AddCommand(Tokentype.cmd, "sys", "sY", 158, this.AddParam(1, [Tokentype.adr]));
		this.AddCommand(Tokentype.cmd, "then", "tH", 167);
		this.AddCommand(Tokentype.cmd, "to", "", 164);
		this.AddCommand(Tokentype.cmd, "verify", "vE", 149, this.AddParam(0, [Tokentype.str, Tokentype.num, Tokentype.num]));
		this.AddCommand(Tokentype.cmd, "wait", "wA", 146, this.AddParam(2, [Tokentype.adr, Tokentype.byte, Tokentype.byte]));

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
		this.AddCommand(Tokentype.fnnum, "val", "vA", 197, { Len: 2, Type: [Tokentype.str], Fn: this.SplitFn.bind(this) });

		//
		// fn str
		//
		this.AddCommand(Tokentype.fnstr, "chr$", "cH", 199);
		this.AddCommand(Tokentype.fnstr, "left$", "leF", 200, { Len: 2, Type: [Tokentype.str, Tokentype.num], Fn: this.SplitFn.bind(this) });
		this.AddCommand(Tokentype.fnstr, "mid$", "mI", 202, { Len: 2, Type: [Tokentype.str, Tokentype.num, Tokentype.num], Fn: this.SplitFn.bind(this) });
		this.AddCommand(Tokentype.fnstr, "right$", "rI", 201, { Len: 2, Type: [Tokentype.str, Tokentype.num], Fn: this.SplitFn.bind(this) });
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

	private AddCommand(type: Tokentype, name: string, short: string, code: number | number[], param?: CmdParam | Function): number {

		const id: number = this.m_BasicCmds.length;
		const cmd: BasicCmd = {
			Name: name,
			Abbrv: short,
			TknId: (typeof code === "number") ? [code] : code,
			Type: type
		}

		// aply default CmdParam
		switch (type) {
			case Tokentype.cmd:
				cmd.Param = { Len: 0, Type: [], Fn: this.SplitParam.bind(this) };
				break;

			case Tokentype.fnnum:
			case Tokentype.fnout:
				cmd.Param = { Len: 1, Type: [Tokentype.num], Fn: this.SplitFn.bind(this) };
				break;

			case Tokentype.fnstr:
				cmd.Param = { Len: 1, Type: [Tokentype.num], Fn: this.SplitFn.bind(this) };
				break;
		}

		if (typeof param !== "undefined") {
			if (typeof param === "function") {
				cmd.Param.Fn = param;
			} else {
				cmd.Param = param;
			}
		}

		this.m_BasicCmds.push(cmd);

		return id;
	}

	private AddParam(len: number, type: Tokentype[], fn?: Function): CmdParam {
		const param: CmdParam = {
			Len: len,
			Type: type
		}

		if (typeof fn !== "undefined") {
			param.Fn = fn;
		} else {
			param.Fn = this.SplitParam.bind(this);
		}

		return param;
	}

	private GetCommand(name: string): number {
		return this.m_mapCmd.get(name);
	}

	private InitLists(): void {

		const aCmd: string[] = [];
		const aFn: string[] = [];
		const aAbbrv: string[] = [];
		const aDeAbbrv: string[] = [];


		for (let i: number = 0; i < this.m_BasicCmds.length; i++) {
			if (this.m_BasicCmds[i].Type == Tokentype.cmd) {
				aCmd.push(Helper.EscapeRegex(this.m_BasicCmds[i].Name));
				this.m_mapCmd.set(this.m_BasicCmds[i].Name, i);
			}

			if (this.m_BasicCmds[i].Type == Tokentype.fnnum || this.m_BasicCmds[i].Type == Tokentype.fnstr || this.m_BasicCmds[i].Type == Tokentype.fnout) {
				aFn.push(this.m_BasicCmds[i].Name);
				this.m_mapFn.set(this.m_BasicCmds[i].Name, i);
			}

			if (this.m_BasicCmds[i].Abbrv.length > 0) {
				aAbbrv.push(this.m_BasicCmds[i].Abbrv);
				aDeAbbrv.push(this.m_BasicCmds[i].Name);
				this.m_mapAbbrv.set(this.m_BasicCmds[i].Abbrv, i);
			}

		}

		this.m_regexCmd = new RegExp("^" + "(" + aCmd.join("|") + ")\\s*(.*)");
		this.m_regexFn = new RegExp(Helper.EscapeRegex(aFn.join("|")));

		this.m_regexAbbrv = new RegExp(Helper.EscapeRegex(aAbbrv.join("|")), "g");
		this.m_regexDeAbbrv = new RegExp(Helper.EscapeRegex(aDeAbbrv.join("|")), "g");

	}

	// -----splitter -----

	private SplitParam(code: string): string[] {
		return [code];
	}

	private SplitFn(code: string): string[] {
		return [code];
	}

	//#endregion

	//#region " ----- Helper ----- "

	/**
	 * fixes the let keyword if it is missing, as it isn't required in BASIC V2
	 * @param		code		the code to fix
	 * @returns		the fixed code
	 */
	private FixLet(code: string): string {

		const match: string[] = code.match(/^(let\s*)?(\w+\d?[%$]?(?:\(.+\))?\s*=\s*)/);

		if (match !== null) {
			if (typeof match[1] === "undefined")
				code = "let " + code;
		}

		return code;
	}

	/**
	 * creates an error token
	 * @param		id			the error id
	 * @param		hint		the error hint
	 * @returns		the error token
	 */
	private CreateError(id: number, hint: string): G64Token {
		return {
			Id: id,
			Type: Tokentype.err,
			Name: Helper.ErrorName(id),
			Hint: hint
		};
	}

	/**
	 * de-abbreviates the BASIC code, ie. turns ? into print
	 * @param		code		the code to de-abbrevite
	 * @returns		the de-abbreviated code
	 */
	public DeAbbreviate(code: string): string {

		// if there are literals, we encode them first
		const literals: SplitItem = Helper.EncodeLiterals(code);

		this.m_regexAbbrv.lastIndex = -1;
		const match: string[] = literals.Source.match(this.m_regexAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_BasicCmds[this.m_mapAbbrv.get(match[i])].Name);
			}
		}

		// if there were literals, we restore them
		if (literals.List.length > 0) {
			code = Helper.RestoreLiterals(code, literals.List);
		}

		return code;
	}

	/**
	 * abbreviates the BASIC code, ie. turns print into ?
	 * @param		code		the code to abbreviate
	 * @returns		the abbreviated code
	 */
	public Abbreviate(code: string): string {

		const literals: SplitItem = Helper.EncodeLiterals(code);

		this.m_regexDeAbbrv.lastIndex = -1;
		const match: string[] = literals.Source.match(this.m_regexDeAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_BasicCmds[this.m_mapCmd.get(match[i])].Abbrv);
			}
		}

		// if there were literals, we restore them
		if (literals.List.length > 0) {
			code = Helper.RestoreLiterals(code, literals.List);
		}

		return code;
	}

	//#endregion

	//#region " ----- Type Testing ----- "



	//#endregion
}