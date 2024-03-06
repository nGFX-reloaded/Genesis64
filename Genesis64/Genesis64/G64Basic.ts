/**
 * G64Basic.ts
 * deals with the BASIC V2 language
 */

interface BasicCmd {
	Name: string;			// name of the command, ie. the command
	Abbrv: string;			// abbreviation, if any
	TknId: number[];		// token id when saving, or -1, then use pet value
	Type: Tokentype;		// type of token
	Param?: CmdParam;		// parameter for this command

	Regex?: RegExp;			// regex to match this command
}

interface CmdParam {
	Len: number;			// number of parameters, 0 for none or all optional, > 0 for fixed, < 0 for variable with fixed length (ie: -1: one fixed param, rest optional)
	Type: Tokentype[];		// type of parameters
	Fn?: Function;			// function to call when parsing
}

enum BasicVersion {
	v2, hires, simnons
}


class G64Basic {

	//#region " ----- Privates ----- "

	private m_Memory: G64Memory = null;


	private m_BasicCmds: BasicCmd[] = [];

	private m_regexCmd: RegExp = null;
	private m_regexFnNum: RegExp = null;
	private m_regexAbbrv: RegExp = null;
	private m_regexDeAbbrv: RegExp = null;

	private m_mapCmd: Map<string, number> = new Map<string, number>();
	private m_mapAbbrv: Map<string, number> = new Map<string, number>();

	//#endregion

	//#region " ----- Publics ----- "

	//#endregion

	public Init(memory: G64Memory, version: BasicVersion) {

		this.m_Memory = memory;

		switch (version) {
			case BasicVersion.v2:
				this.InitBasicV2();
				break;
		}

	}

	public ParseLine(lineTkn: G64Token): G64Token {

		const tknParts: G64Token = Tools.CreateToken(Tokentype.line);
		const parts: string[] = Tools.CodeSplitter(lineTkn.Str, ":");
		
		console.log(">", lineTkn);

		for (let i: number = 0; i < parts.length; i++) {
			const split: SplitItem = Tools.EncodeLiterals(parts[i]);
			const code: string = split.Source;
			const tkn: G64Token = this.Tokenizer(Tools.CreateToken(Tokentype.line, code));

			console.log(">>", tkn);

			tknParts.Values.push(tkn);
		}


		return lineTkn;
	}

	private Tokenizer(tkn: G64Token): G64Token {

		const code: string = tkn.Str;

		this.m_regexCmd.lastIndex = -1;
		this.m_regexFnNum.lastIndex = -1;

		let match: string[] = tkn.Str.match(this.m_regexCmd);
		console.log("-->", match);



		return tkn;
	}

	//#region " ----- BASIC V2 ----- "

	/**
	 * initializes the BASIC V2 language
	 */
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
		this.AddCommand(Tokentype.cmd, "let", "lE", 136, null, /^(?:let\s*)?(\w+\d?[%$]?(?:\(.+\))?\s*=\s*.*)/);
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

		this.AddCommand(Tokentype.ops, "=", "", 61);
		this.AddCommand(Tokentype.ops, "<>", "", [60, 62]);
		this.AddCommand(Tokentype.ops, "<=", "", [60, 61]);
		this.AddCommand(Tokentype.ops, ">=", "", [62, 61]);
		this.AddCommand(Tokentype.ops, "<", "", 60);
		this.AddCommand(Tokentype.ops, ">", "", 62);

		this.AddCommand(Tokentype.ops, "+", "", 43); // this works for strings and numbers
		this.AddCommand(Tokentype.ops, "-", "", 45);
		this.AddCommand(Tokentype.ops, "*", "", 42);
		this.AddCommand(Tokentype.ops, "/", "", 47);
		this.AddCommand(Tokentype.ops, "^", "", 94);

		this.AddCommand(Tokentype.not, "not", "nO", 168);

		//
		// sysvar / const
		//
		this.AddCommand(Tokentype.sysvar, "{pi}", "", 255);
		this.AddCommand(Tokentype.sysvar, "st", "", -1);
		this.AddCommand(Tokentype.sysvar, "ti", "", -1);
		this.AddCommand(Tokentype.sysvar, "ti$", "", -1);

		this.BuiltRegex();

	}

	/**
	 * adds a command to the BASIC language
	 * @param		type		the type of command
	 * @param		name		the name of the command
	 * @param		short		the abbreviation of the command
	 * @param		code		the token id of the command
	 * @param		param		the parameter of the command
	 * @param		regex		the regex to match the command
	 * @returns		the id of the command
	 */
	private AddCommand(type: Tokentype, name: string, short: string, code: number | number[], param?: CmdParam | Function, regex?: RegExp): number {

		const id: number = this.m_BasicCmds.length;

		let cmd: BasicCmd = {
			Type: type,
			Name: name,
			Abbrv: short,
			TknId: (typeof code === "number") ? [code] : code,
			Param: null
		}

		//
		// if there is a parameter, we store it
		if (typeof param !== "undefined" || param !== null) {
			cmd.Param = (typeof param === "function") ? { Len: -1, Type: null, Fn: param } : param;
		}

		//
		// if there is a regex, we store it
		cmd.Regex = (typeof regex !== "undefined") ? regex : new RegExp("^\\s*" + Tools.EscapeRegex(cmd.Name) + "\\s*(.*)");

		this.m_BasicCmds.push(cmd);
		this.m_mapCmd.set(name, id);
		this.m_mapAbbrv.set(short, id);

		return id;
	}

	/**
	 * built regexes for all commands
	 */
	private BuiltRegex(): void {

		//
		// built regex of all commands commands
		let cmd: string[] = [];
		for (let i: number = 0; i < this.m_BasicCmds.length; i++) {
			if (this.m_BasicCmds[i].Type === Tokentype.cmd) {
				cmd.push(Tools.EscapeRegex(this.m_BasicCmds[i].Name));
			}
		}
		this.m_regexCmd = new RegExp("^(" + cmd.join("|") + ")", "g");

		//
		// built regex of all numerical functions
		let fnnum: string[] = [];
		for (let i: number = 0; i < this.m_BasicCmds.length; i++) {
			if (this.m_BasicCmds[i].Type === Tokentype.fnnum) {
				fnnum.push(Tools.EscapeRegex(this.m_BasicCmds[i].Name));
			}
		}
		this.m_regexFnNum = new RegExp("(" + fnnum.join("|") + ")", "g");

		//
		// built regex of all abbreviations
		let abbrv: string[] = [];
		for (let i: number = 0; i < this.m_BasicCmds.length; i++) {
			if (this.m_BasicCmds[i].Abbrv !== "") {
				abbrv.push(Tools.EscapeRegex(this.m_BasicCmds[i].Abbrv));
			}
		}
		this.m_regexAbbrv = new RegExp("(" + abbrv.join("|") + ")", "g");

		//
		// built regex of all de-abbreviations
		let deabbrv: string[] = [];
		for (let i: number = 0; i < this.m_BasicCmds.length; i++) {
			if (this.m_BasicCmds[i].Abbrv !== "") {
				deabbrv.push(Tools.EscapeRegex(this.m_BasicCmds[i].Name));
			}
		}
		this.m_regexDeAbbrv = new RegExp("(" + deabbrv.join("|") + ")", "g");

	}


	//#endregion

	//#region " ----- Helper ----- "

	/**
	 * de-abbreviates the BASIC code, ie. turns ? into print
	 * @param		code		the code to de-abbrevite
	 * @returns		the de-abbreviated code
	 */
	public DeAbbreviate(code: string): string {

		// if there are literals, we encode them first
		const literals: SplitItem = Tools.EncodeLiterals(code);

		this.m_regexAbbrv.lastIndex = -1;
		const match: string[] = literals.Source.match(this.m_regexAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_BasicCmds[this.m_mapAbbrv.get(match[i])].Name);
			}
		}

		// if there were literals, we restore them
		if (literals.List.length > 0) {
			code = Tools.RestoreLiterals(code, literals.List);
		}

		return code;
	}

	/**
	 * abbreviates the BASIC code, ie. turns print into ?
	 * @param		code		the code to abbreviate
	 * @returns		the abbreviated code
	 */
	public Abbreviate(code: string): string {

		const literals: SplitItem = Tools.EncodeLiterals(code);

		this.m_regexDeAbbrv.lastIndex = -1;
		const match: string[] = literals.Source.match(this.m_regexDeAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_BasicCmds[this.m_mapCmd.get(match[i])].Abbrv);
			}
		}

		// if there were literals, we restore them
		if (literals.List.length > 0) {
			code = Tools.RestoreLiterals(code, literals.List);
		}

		return code;
	}

	//#endregion

}