
//#region " ----- Interfaces / Enums / Types ----- "

enum BasicVersion {
	v2, g64
}

type G64BasicOptions = {
	basicVersion: BasicVersion;
}

//#endregion

class G64Basic {

	//#region " ----- Privates ----- "

	private m_Mem: G64Memory;				// ref to memory

	private m_Commands: BasicCmd[] = [];

	private m_lstCmd: number[] = [];		// list of cmds
	private m_lstFnNum: number[] = [];		// list of fn nums
	private m_lstFnStr: number[] = [];		// list of fn strs
	private m_lstFnOut: number[] = [];		// list of fn outs
	private m_lstOps: number[] = [];		// list of ops
	private m_lstComp: number[] = [];		// list of comparers

	private m_mapDeAbbrev: Map<string, string> = new Map<string, string>();
	private m_mapCmdId: Map<string, number> = new Map<string, number>();

	private m_Options: G64BasicOptions;

	//#endregion

	//#region " ----- Publics ----- "

	public get Commands(): BasicCmd[] { return this.m_Commands; }
	public get Version(): BasicVersion { return this.m_Options.basicVersion; }

	//#endregion

	//#region " ----- Regex ----- "

	private regLineNr: RegExp;
	private regCmd: RegExp;
	private regFn: RegExp;
	private regAbbrv: RegExp;

	private regLet: RegExp;
	private regVar: RegExp;
	private regNum: RegExp;
	private regBracket: RegExp;
	private regLiteral: RegExp;

	private regEncodeCompCmd: RegExp[];
	private regEncodeCompArray: RegExp;
	private regEncodeArray: RegExp;

	//#endregion

	constructor() {

		Genesis64.Instance.Log(" - Basic created\n");

		this.m_Options = {
			basicVersion: BasicVersion.v2
		}

		this.m_Mem = Genesis64.Instance.Memory;

	}

	//#region " ----- Init ----- "

	public Init(options: G64BasicOptions) {

		// global regexp
		this.regLineNr = /^\s*(\d*)\s*(.*)\s*/;	// finds a line number, groups into lnr and rest

		this.regLet = /^(?:let\s*)?([a-zA-Z]+\d*[$%]?\s*(\[.+\])?)\s*=([^=]*)$/; // assignment (optional let)
		this.regVar = /^[a-zA-Z]+\d*[$%]?(?:\s*\[.*\])?$/;	// a single variable (or array, with g64 delimiters [])
		this.regNum = /^[\+-]?(?:\d*\.)?\d+(?:e[\+-]?\d+)?$/;
		this.regBracket = /^[\(\[](.*)[\)\]]$/;
		this.regLiteral = /^{(\d+)}$/;

		// exclude = to == conversion for these
		this.regEncodeCompCmd = [
			/^for(.*)to/,
			/^.+then(.*)/,
			/^let\s*(.*)/,
			/^def\s*fn\s*(.*)/
		];
		// ToDo: check if these are needed?
		this.regEncodeCompArray = /^\s*([a-zA-Z]+\d*[$%]?\s*(\[?))(.+)/; // finds the start of an array
		this.regEncodeArray = /((?:fn\s*)?([a-zA-Z]+\d*[$%]?))\s*\(/g;	// find array for the () to [] converter

		switch (options.basicVersion) {
			case BasicVersion.v2:
				Genesis64.Instance.Log("   ... setting up BASIC V2 ... ");
				this.InitBasicV2();
				this.InitLists();
				break;

			case BasicVersion.g64:
				Genesis64.Instance.Log("   ... setting up G64 BASIC ... ");
				this.InitBasicG64();
				this.InitLists();
				break;
		}

		Genesis64.Instance.Log("OK\n");
		this.m_Options = {
			...options
		}

	}

	/**
	 * sets up the c64 basic v2 commands / fns 
	 **/
	private InitBasicV2(): void {



		const defIO_File: CmdParameter = { fn: this.Splitter, chr: ",", len: 0, type: [DefType.str, DefType.num, DefType.num] };

		const defPoke: CmdParameter = { fn: this.Splitter, chr: ",", len: 2, type: [DefType.adr, DefType.byte] };

		const defPrint: CmdParameter = {
			fn: (code: string): string[] => { return [code] },
			chr: "",
			len: -1,
			type: [DefType.any]
		}

		const def_Num: CmdParameter = { fn: this.Splitter, chr: ",", len: 1, type: [DefType.num] };
		const def_Str: CmdParameter = { fn: this.Splitter, chr: ",", len: 1, type: [DefType.str] };
		const def_Any: CmdParameter = { fn: this.Splitter, chr: ",", len: 1, type: [DefType.any] };
		const defFnStr_LR: CmdParameter = { fn: this.Splitter, chr: ",", len: 2, type: [DefType.str, DefType.num] };
		const defFnStr_Mid: CmdParameter = { fn: this.Splitter, chr: ",", len: 2, type: [DefType.str, DefType.num, DefType.num] };

		this.m_Commands = [

			//
			// ----- comands -----
			{ name: "close", abbrv: "clO", tkn: 160, type: CmdType.cmd },
			{ name: "clr", abbrv: "cR", tkn: 156, type: CmdType.cmd },
			{ name: "cont", abbrv: "cO", tkn: 154, type: CmdType.cmd },
			{ name: "cmd", abbrv: "cM", tkn: 157, type: CmdType.cmd },
			{ name: "data", abbrv: "dA", tkn: 131, type: CmdType.cmd },
			{ name: "def", abbrv: "dE", tkn: 150, type: CmdType.cmd },
			{ name: "dim", abbrv: "dI", tkn: 134, type: CmdType.cmd },
			{ name: "end", abbrv: "eN", tkn: 128, type: CmdType.cmd },
			{ name: "for", abbrv: "fO", tkn: 129, type: CmdType.cmd },
			{ name: "get", abbrv: "gE", tkn: 161, type: CmdType.cmd },
			{ name: "get#", abbrv: "", tkn: 161 /*161 35*/, type: CmdType.cmd },
			{ name: "gosub", abbrv: "goS", tkn: 141, type: CmdType.cmd },
			{ name: "goto", abbrv: "gO", tkn: 137 /*203 164*/, type: CmdType.cmd },
			{ name: "if", abbrv: "", tkn: 139, type: CmdType.cmd },
			{ name: "input", abbrv: "", tkn: 133, type: CmdType.cmd },
			{ name: "input#", abbrv: "iN", tkn: 132, type: CmdType.cmd },
			{ name: "let", abbrv: "lE", tkn: 136, type: CmdType.cmd },
			{ name: "list", abbrv: "lI", tkn: 155, type: CmdType.cmd },
			{ name: "load", abbrv: "lO", tkn: 147, type: CmdType.cmd, param: defIO_File },
			{ name: "new", abbrv: "", tkn: 162, type: CmdType.cmd },
			{ name: "next", abbrv: "nE", tkn: 130, type: CmdType.cmd },
			{ name: "on", abbrv: "", tkn: 145, type: CmdType.cmd },
			{ name: "open", abbrv: "oP", tkn: 159, type: CmdType.cmd },
			{ name: "poke", abbrv: "pO", tkn: 151, type: CmdType.cmd, param: defPoke },
			{ name: "print", abbrv: "?", tkn: 153, type: CmdType.cmd, param: defPrint },
			{ name: "print#", abbrv: "pR", tkn: 152, type: CmdType.cmd },
			{ name: "read", abbrv: "rE", tkn: 135, type: CmdType.cmd },
			{ name: "rem", abbrv: "", tkn: 143, type: CmdType.cmd },
			{ name: "restore", abbrv: "reS", tkn: 140, type: CmdType.cmd },
			{ name: "return", abbrv: "reT", tkn: 142, type: CmdType.cmd },
			{ name: "run", abbrv: "rU", tkn: 138, type: CmdType.cmd },
			{ name: "save", abbrv: "sA", tkn: 148, type: CmdType.cmd, param: defIO_File },
			{ name: "stop", abbrv: "sT", tkn: 144, type: CmdType.cmd },
			{ name: "step", abbrv: "stE", tkn: 169, type: CmdType.cmd },
			{ name: "sys", abbrv: "sY", tkn: 158, type: CmdType.cmd },
			{ name: "then", abbrv: "tH", tkn: 167, type: CmdType.cmd },
			{ name: "to", abbrv: "", tkn: 164, type: CmdType.cmd },
			{ name: "verify", abbrv: "vE", tkn: 149, type: CmdType.cmd },
			{ name: "wait", abbrv: "wA", tkn: 146, type: CmdType.cmd },

			//
			// ----- fn num -----
			{ name: "abs", abbrv: "aB", tkn: 182, type: CmdType.fnum, param: def_Num },
			{ name: "asc", abbrv: "aS", tkn: 198, type: CmdType.fnum, param: def_Num },
			{ name: "atn", abbrv: "aT", tkn: 193, type: CmdType.fnum, param: def_Num },
			{ name: "cos", abbrv: "", tkn: 190, type: CmdType.fnum, param: def_Num },
			{ name: "exp", abbrv: "eX", tkn: 189, type: CmdType.fnum, param: def_Num },
			{ name: "fn", abbrv: "", tkn: 165, type: CmdType.fnum },
			{ name: "fre", abbrv: "fR", tkn: 184, type: CmdType.fnum, param: def_Num },
			{ name: "int", abbrv: "", tkn: 181, type: CmdType.fnum, param: def_Num },
			{ name: "len", abbrv: "", tkn: 195, type: CmdType.fnum, param: def_Str },
			{ name: "log", abbrv: "", tkn: 188, type: CmdType.fnum, param: def_Num },
			{ name: "peek", abbrv: "pE", tkn: 194, type: CmdType.fnum, param: def_Num },
			{ name: "pos", abbrv: "", tkn: 185, type: CmdType.fnum, param: def_Num },
			{ name: "rnd", abbrv: "rN", tkn: 187, type: CmdType.fnum, param: def_Num },
			{ name: "sgn", abbrv: "sG", tkn: 180, type: CmdType.fnum, param: def_Num },
			{ name: "sin", abbrv: "sI", tkn: 191, type: CmdType.fnum, param: def_Num },
			{ name: "sqr", abbrv: "sQ", tkn: 186, type: CmdType.fnum, param: def_Num },
			{ name: "tan", abbrv: "", tkn: 192, type: CmdType.fnum, param: def_Num },
			{ name: "usr", abbrv: "uS", tkn: 183, type: CmdType.fnum, param: def_Any }, /* fix: returns a num OR a string */
			{ name: "val", abbrv: "vA", tkn: 197, type: CmdType.fnum, param: def_Str },

			//
			// ----- fn str -----
			{ name: "chr$", abbrv: "cH", tkn: 199, type: CmdType.fstr, param: def_Num },
			{ name: "left$", abbrv: "leF", tkn: 200, type: CmdType.fstr, param: defFnStr_LR },
			{ name: "mid$", abbrv: "mI", tkn: 202, type: CmdType.fstr, param: defFnStr_Mid },
			{ name: "right$", abbrv: "rI", tkn: 201, type: CmdType.fstr, param: defFnStr_LR },
			{ name: "str$", abbrv: "stR", tkn: 196, type: CmdType.fstr, param: def_Num },

			//
			// ----- fn out -----
			{ name: "spc(", abbrv: "sP", tkn: 166, type: CmdType.fout },
			{ name: "tab(", abbrv: "tA", tkn: 163, type: CmdType.fout },

			//
			// ----- ops -----
			{ name: "and", abbrv: "aN", tkn: 175, type: CmdType.ops },
			{ name: "or", abbrv: "", tkn: 176, type: CmdType.ops },
			{ name: "not", abbrv: "nO", tkn: 168, type: CmdType.ops },
			// +,-,*,/,^

			//
			// ----- compare -----
			// =,<,>,<=,=>,==

			// ----- system vars -----
			// ST, STATUS, TI, TIME, TI$, TIME$

		];

	}

	/**
	 * sets up the g64 basic commands / fns
	 **/
	private InitBasicG64(): void {
		this.InitBasicV2();
	}

	/**
	 * sets up the shortcut lists
	 **/
	private InitLists(): void {

		const aCmd: string[] = [];
		const aFn: string[] = [];
		const aAbbrv: string[] = [];
		this.m_lstOps = [];
		this.m_lstComp = [];

		this.m_lstCmd = [];
		this.m_lstFnNum = [];
		this.m_lstFnStr = [];
		this.m_lstFnOut = [];
		this.m_lstOps = [];
		this.m_lstComp = [];

		const defEmpty: CmdParameter = {
			fn: (code: string): string[] => { return [code] },
			chr: "",
			len: 0,
			type: [DefType.any]
		};

		for (let i: number = 0; i < this.m_Commands.length; i++) {

			// create deabbrv map
			if (this.m_Commands[i].abbrv !== "") {
				this.m_mapDeAbbrev.set(this.m_Commands[i].abbrv, this.m_Commands[i].name);
				aAbbrv.push(this.m_Commands[i].abbrv);
			}

			// create name / id map
			this.m_mapCmdId.set(this.m_Commands[i].name, i);

			// set parser definition
			if (typeof this.m_Commands[i].param === "undefined")
				this.m_Commands[i].param = defEmpty;

			// set regex
			switch (this.m_Commands[i].type) {
				case CmdType.cmd:
					this.m_Commands[i].ret = Tokentype.cmd;
					aCmd.push(this.m_Commands[i].name);
					this.m_lstCmd.push(i);
					break;

				case CmdType.fnum:
					this.m_Commands[i].ret = Tokentype.fnnum;
					aFn.push(this.m_Commands[i].name);
					this.m_lstFnNum.push(i);
					break;

				case CmdType.fstr:
					this.m_Commands[i].ret = Tokentype.fnstr;
					this.m_lstFnStr.push(i);
					aFn.push(this.m_Commands[i].name);
					break;

				case CmdType.fout:
					this.m_Commands[i].ret = Tokentype.fnout;
					this.m_lstFnOut.push(i);
					aFn.push(this.m_Commands[i].name);
					break;

				case CmdType.ops:
					this.m_Commands[i].ret = Tokentype.ops
					this.m_lstOps.push(i);
					break;

				case CmdType.comp:
					this.m_Commands[i].ret = Tokentype.comp;
					this.m_lstComp.push(i);
					break;
			}
		}

		this.regCmd = new RegExp("^(" + aCmd.join("|").replace(/([\#\$\(])/g, "\\$1") + ")\\s*(.*)\\s*");
		this.regFn = new RegExp("^(" + aFn.join("|").replace(/([\#\$\(])/g, "\\$1") + ")\\s*(.*)\\s*");
		this.regAbbrv = new RegExp("(" + aAbbrv.join("|").replace(/(\?)/, "\\$1") + ")", "g");

	}

	//#endregion

	//#region " ----- Encoders ----- "

	/**
	 * Encodes the c64 style array notation to c style () -> [] 
	 * @param		code		code piece to encode
	 * @returns					string
	 **/
	private EncodeArray(code: string): string {

		if (code.startsWith("dim"))
			return code;

		this.regEncodeArray.lastIndex = -1;

		const match: string[] = code.match(this.regEncodeArray);
		if (match !== null) {
			for (let m: number = 0; m < match.length; m++) {

				// remove cmds
				const subMatch: string[] = match[m].match(this.regCmd);
				if (subMatch !== null)
					match[m] = match[m].replace(subMatch[1], "");

				this.regFn.lastIndex = -1;
				if (!this.regFn.test(match[m])) {
					const tuple: number[] = CodeHelper.FindMatching(code, code.indexOf(match[m]));
					if (CodeHelper.IsMatching(tuple)) {
						let target: string = match[m];

						code = code.substring(0, tuple[0]) + "["
							+ code.substring(tuple[0] + 1, tuple[1]) + "]"
							+ code.substring(tuple[1] + 1);
					}
				}
			}
		}

		return code;
	}

	/**
	 * Encodes the c64 style compare = into c style ==
	 * @param		code		code to encode
	 * @returns					string
	 **/
	private EncodeCompare(code: string, isCommand: boolean = false): string {

		let match: RegExpMatchArray;

		for (let i: number = 0; i < this.regEncodeCompCmd.length; i++) {
			this.regEncodeCompCmd[i].lastIndex = -1;
			match = this.regEncodeCompCmd[i].exec(code);

			if (match !== null)
				code = code.replace(match[1], this.EncodeCompare(match[1], true));
		}

		// only consider non-command code
		this.regCmd.lastIndex = -1;

		if (!this.regCmd.test(code)) {
			this.regEncodeCompArray.lastIndex = -1;

			match = this.regEncodeCompArray.exec(code);
			if (match !== null) {

				// skip inside of arrays
				if (match[2] !== "") {
					const tuple: number[] = CodeHelper.FindMatching(code, 0, "[", "]");
					if (CodeHelper.IsMatching(tuple)) {
						code = code.substring(0, tuple[1]) + code.substring(tuple[1]).replace(/=+/, "~");
					}
				} else {
					code = code.replace(/=/, "~");
				}
			}
		}

		if (!isCommand)
			code = code.replace(/=/g, "==").replace(/~/, "=");

		return code;
	}

	/**
	 * Deabbreviates basic commands, turns pO into poke or ? into print
	 * @param		code		code to deabbreviate
	 * @returns					string
	 */
	private DeAbbreviate(code: string): string {

		this.regAbbrv.lastIndex = -1;
		const match: string[] = code.match(this.regAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_mapDeAbbrev.get(match[i]));
			}
		}

		return code;
	}

	//#endregion

	private m_PrgLine: PrgLine;
	private m_Literals: string[];
	public Temp(code: string): void {

		// get timeing
		console.time("temp");

		const lines: string[] = CodeHelper.CodeSplitter(code, "\n");

		//console.log(lines);

		for (let l: number = 0; l < lines.length; l++) {
			if (lines[l].trim() !== "") {
				let match: string[] = lines[l].match(this.regLineNr);
				this.m_PrgLine = { Ln: -1, Code: match[2], Tokens: [] };

				if (match[1] !== "") {
					this.m_PrgLine.Ln = parseInt(match[1]);
				}

				if (this.m_PrgLine.Code !== "") {
					// encode literals to make parsing easier
					const literals: SplitItem = CodeHelper.EncodeLiterals(this.DeAbbreviate(this.m_PrgLine.Code));

					// de-abbrv and store back in line
					this.m_PrgLine.Code = CodeHelper.RestoreLiterals(literals.Source, literals.List);
					this.m_Literals = literals.List;

					console.log("-----");
					console.log(this.m_PrgLine.Code);

					// split line into parts and parse
					const parts: string[] = CodeHelper.CodeSplitter(literals.Source, ":");
					for (let p: number = 0; p < parts.length; p++) {
						// convert array () to []
						parts[p] = this.EncodeArray(parts[p]);

						// convert = to ==
						parts[p] = this.EncodeCompare(parts[p]);

						// tokenize
						this.m_PrgLine.Tokens = [];
						const token = this.Tokenizer(parts[p])
						console.log("-- tkn:", token, this.m_PrgLine);
					}
				}
			}
		}

		console.timeEnd("temp");
	}

	public Tokenizer(code: string): Token {

		let token: Token = this.CreateError(ErrorCodes.SYNTAX, "syntax error");
		let match: string[];
		let id: number = 0;

		code = code.trim();

		//
		// if code starts and ends with () or [] and they are matching -> remove
		this.regBracket.lastIndex = -1;
		match = this.regBracket.exec(code);
		if (match !== null) {
			const tuple: [number, number] = CodeHelper.FindMatching(code, 0, code.charAt(0), code.charAt(code.length - 1));
			if (tuple[0] == 0 && tuple[1] == (code.length - 1))
				code = match[1];
		}



		// start with assign which is LET without let, if there's a let, remove it
		//match = this.regLet.exec(code);
		//if (match !== null) {
		//	id = this.m_mapTokenId.get("let");

		//	if (typeof match[2] === "undefined") {

		//	} else {

		//	}

		//	console.log("let ", match[1], "=", match[3]);
		//}

		//
		// commands every line needs one
		this.regCmd.lastIndex = -1;
		match = this.regCmd.exec(code);
		if (match !== null) {
			console.log("- cmd:", match);
			token = this.TokenizeItem(token, match[1], match[2]);

			return token;
		}

		// functions
		this.regFn.lastIndex = -1;
		match = this.regFn.exec(code);
		if (match !== null) {
			console.log("- fn:", match);
			token = this.TokenizeItem(token, match[1], match[2]);
			return token;
		}


		//
		// ----- number -----
		this.regNum.lastIndex = -1;
		match = this.regNum.exec(code);
		if (match !== null) {
			token = this.CreateToken(-1, Tokentype.num, 10, parseFloat(match[0]));
			return token;
		}

		//
		// ----- literal -----
		this.regLiteral.lastIndex = -1;
		match = this.regLiteral.exec(code);
		if (match !== null) {
			token = this.CreateToken(-1, Tokentype.str, 10, this.m_Literals[parseInt(match[1])]);
			return token;
		}

		return token;

	}

	private TokenizeItem(token: Token, item: string, code: string): Token {

		// TODO: set tokentype based on type: cmd, fn ...

		if (this.m_mapCmdId.has(item)) {
			token.Id = this.m_mapCmdId.get(item);
			token.Type = this.m_Commands[token.Id].ret;
			token.Str = "";
			token.Num = 0;
			token.Values = [];
			token.Order = 0; // ToDo: get base order;

			const def: CmdParameter = this.m_Commands[token.Id].param;
			const split: string[] = def.fn(code, def.chr);

			// if there are no params remove the empty split
			if (code.trim() == "")
				split.pop();

			// check if we have enough or too many params
			if (def.len != -1) {
				if (split.length < def.len) {
					token = this.CreateError(ErrorCodes.SYNTAX, "not enough parameters");
					return token;
				}

				if (((split.length > def.len) && (def.len == def.type.length)) || ((def.len < def.type.length) && (split.length > def.type.length))) {
					token = this.CreateError(ErrorCodes.SYNTAX, "to many parameters");
					return token;
				}
			}

			// tokenize params and check type
			for (let i = 0; i < split.length; i++) {
				let tkn: Token = this.Tokenizer(split[i]);

				switch (this.SimpleType(def.type[i])) {
					case DefType.num:
						if (!this.IsNum(tkn))
							token = this.CreateError(ErrorCodes.TYPE_MISMATCH, "parameter is not a number");
						break;

					case DefType.str:
						if (!this.IsStr(tkn))
							token = this.CreateError(ErrorCodes.TYPE_MISMATCH, "parameter is not a string");
						break;

				}

				// do not add param tokens on error
				if (token.Type == Tokentype.err)
					break;

				// add to value list and to part's token list
				token.Values.push(tkn);
				if (tkn.Order < 0) {
					this.m_PrgLine.Tokens.unshift(tkn);
				} else {
					this.m_PrgLine.Tokens.push(tkn);
				}
			}

		}

		return token;
	}



	private SplitterPass(code: string): string[] {
		return [code];
	}

	private Splitter(code: string, split: string): string[] {
		return CodeHelper.CodeSplitter(code, split);
	}

	private SplitterPrint(code: string): string[] {
		return [code];
	}

	//
	//
	// ----- Helper ----
	private CreateToken(id: number, type: Tokentype, order: number, value?: number | string): Token {
		const tkn: Token = { Name: "", Id: id, Type: type, Order: order, Num: 0, Str: "", Values: [] };

		if (typeof value !== "undefined") {
			if (typeof value === "number")
				tkn.Num = value;

			if (typeof value === "string")
				tkn.Str = value;
		}

		return tkn;
	}

	private CreateError(id: number, message: string): Token {
		return {
			Type: Tokentype.err,
			Id: id,
			Str: message,
			Order: -99999
		};
	}


	private SimpleType(value: DefType): DefType {
		let type: DefType = value;

		switch (value) {
			case DefType.num:
			case DefType.adr:
			case DefType.byte:
				type = DefType.num;
				break;
		}

		return type;
	}

	private IsNum(tkn: Token): boolean {
		return (tkn.Type == Tokentype.num
			|| tkn.Type == Tokentype.int
			|| tkn.Type == Tokentype.fnnum
			|| tkn.Type == Tokentype.vnum
			|| tkn.Type == Tokentype.vint
			|| tkn.Type == Tokentype.anum
			|| tkn.Type == Tokentype.aint
			|| tkn.Type == Tokentype.ops);
	}

	private IsStr(tkn: Token): boolean {
		return (tkn.Type == Tokentype.str
			|| tkn.Type == Tokentype.fnstr
			|| tkn.Type == Tokentype.vstr
			|| tkn.Type == Tokentype.astr
			|| tkn.Type == Tokentype.ops);
	}

}
