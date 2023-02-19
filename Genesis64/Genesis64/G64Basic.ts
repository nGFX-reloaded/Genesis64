
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

	private regIsCmd: RegExp;
	private regIsFn: RegExp;
	private regIsAbbrv: RegExp;

	private regLineNr: RegExp = /^\s*(\d*)\s*(.*)\s*/;	// finds a line number, groups into lnr and rest

	private regLet: RegExp = /^(?:let\s*)?([a-zA-Z]+\d*[$%]?\s*(?:\[.+\])?)\s*=([^=].*)$/; // assignment (optional let)
	private regVar: RegExp = /^([a-zA-Z]+\d*[$%]?\s*(\[.+\])?)$/;	// a single variable (or array, with g64 delimiters [])
	private regNum: RegExp = /^[\+-]?(?:\d*\.)?\d+(?:e[\+-]?\d+)?$/; // a single number
	private regLiteral: RegExp = /^{(\d+)}$/;
	private regIsOps: RegExp = /\+|\-|\*|\/|\^|and|or|not/; // ToDo: create from list
	private regIsComp: RegExp = /==|!=|<>|<=|>=|<|>/; // ToDo: create from list

	private regBracket: RegExp = /^[\(\[](.*)[\)\]]$/;

	private regArrayStart: RegExp = /^\s*([a-zA-Z]+\d*[$%]?\s*(\[?))(.+)/; // finds the start of an array
	private regEncodeCompCmd: RegExp[] = [
		/^for(.*)to/,
		/^.+then(.*)/,
		/^let\s*(.*)/,
		/^def\s*fn\s*(.*)/
	]; // exclude = / == check for these
	private regEncodeArray: RegExp = /(?:fn\s*)?[a-zA-Z]+\d*[$%]?\s*\(/g;	// find array start for the () to [] converter, includes fn (to filter out later)

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



		const paramIO_File: CmdParameter = { fn: this.Splitter, chr: ",", len: 0, type: [ParamType.str, ParamType.num, ParamType.num] };

		const paramPoke: CmdParameter = { fn: this.Splitter, chr: ",", len: 2, type: [ParamType.adr, ParamType.byte] };
		const paramLet: CmdParameter = { fn: this.Splitter, chr: "|", len: 2, type: [ParamType.var, ParamType.same] };
		const paramOpsNum: CmdParameter = { fn: this.Splitter, chr: "|", len: -1, type: [ParamType.num, ParamType.num] };
		const paramOpsAny: CmdParameter = { fn: this.Splitter, chr: "|", len: -1, type: [ParamType.any, ParamType.same] };

		const paramPrint: CmdParameter = {
			fn: (code: string): string[] => { return [code] },
			chr: "",
			len: -1,
			type: [ParamType.any]
		}

		const paramFnNum: CmdParameter = { fn: this.Splitter, chr: ",", len: 1, type: [ParamType.num] };
		const paramFnStr: CmdParameter = { fn: this.Splitter, chr: ",", len: 1, type: [ParamType.str] };
		const paramFnAny: CmdParameter = { fn: this.Splitter, chr: ",", len: 1, type: [ParamType.any] };
		const paramFnStr_LR: CmdParameter = { fn: this.Splitter, chr: ",", len: 2, type: [ParamType.str, ParamType.num] };
		const paramFnStr_Mid: CmdParameter = { fn: this.Splitter, chr: ",", len: 2, type: [ParamType.str, ParamType.num, ParamType.num] };

		this.m_Commands = [

			//
			// ----- comands -----
			{ Name: "close", Abbrv: "clO", TknId: 160, Type: CmdType.cmd },
			{ Name: "clr", Abbrv: "cR", TknId: 156, Type: CmdType.cmd },
			{ Name: "cont", Abbrv: "cO", TknId: 154, Type: CmdType.cmd },
			{ Name: "cmd", Abbrv: "cM", TknId: 157, Type: CmdType.cmd },
			{ Name: "data", Abbrv: "dA", TknId: 131, Type: CmdType.cmd },
			{ Name: "def", Abbrv: "dE", TknId: 150, Type: CmdType.cmd },
			{ Name: "dim", Abbrv: "dI", TknId: 134, Type: CmdType.cmd },
			{ Name: "end", Abbrv: "eN", TknId: 128, Type: CmdType.cmd },
			{ Name: "for", Abbrv: "fO", TknId: 129, Type: CmdType.cmd },
			{ Name: "get", Abbrv: "gE", TknId: 161, Type: CmdType.cmd },
			{ Name: "get#", Abbrv: "", TknId: 161 /*161 35*/, Type: CmdType.cmd },
			{ Name: "gosub", Abbrv: "goS", TknId: 141, Type: CmdType.cmd },
			{ Name: "goto", Abbrv: "gO", TknId: 137 /*203 164*/, Type: CmdType.cmd },
			{ Name: "if", Abbrv: "", TknId: 139, Type: CmdType.cmd },
			{ Name: "input", Abbrv: "", TknId: 133, Type: CmdType.cmd },
			{ Name: "input#", Abbrv: "iN", TknId: 132, Type: CmdType.cmd },
			{ Name: "let", Abbrv: "lE", TknId: 136, Type: CmdType.cmd, Param: paramLet },
			{ Name: "list", Abbrv: "lI", TknId: 155, Type: CmdType.cmd },
			{ Name: "load", Abbrv: "lO", TknId: 147, Type: CmdType.cmd, Param: paramIO_File },
			{ Name: "new", Abbrv: "", TknId: 162, Type: CmdType.cmd },
			{ Name: "next", Abbrv: "nE", TknId: 130, Type: CmdType.cmd },
			{ Name: "on", Abbrv: "", TknId: 145, Type: CmdType.cmd },
			{ Name: "open", Abbrv: "oP", TknId: 159, Type: CmdType.cmd },
			{ Name: "poke", Abbrv: "pO", TknId: 151, Type: CmdType.cmd, Param: paramPoke },
			{ Name: "print", Abbrv: "?", TknId: 153, Type: CmdType.cmd, Param: paramPrint },
			{ Name: "print#", Abbrv: "pR", TknId: 152, Type: CmdType.cmd },
			{ Name: "read", Abbrv: "rE", TknId: 135, Type: CmdType.cmd },
			{ Name: "rem", Abbrv: "", TknId: 143, Type: CmdType.cmd },
			{ Name: "restore", Abbrv: "reS", TknId: 140, Type: CmdType.cmd },
			{ Name: "return", Abbrv: "reT", TknId: 142, Type: CmdType.cmd },
			{ Name: "run", Abbrv: "rU", TknId: 138, Type: CmdType.cmd },
			{ Name: "save", Abbrv: "sA", TknId: 148, Type: CmdType.cmd, Param: paramIO_File },
			{ Name: "stop", Abbrv: "sT", TknId: 144, Type: CmdType.cmd },
			{ Name: "step", Abbrv: "stE", TknId: 169, Type: CmdType.cmd },
			{ Name: "sys", Abbrv: "sY", TknId: 158, Type: CmdType.cmd },
			{ Name: "then", Abbrv: "tH", TknId: 167, Type: CmdType.cmd },
			{ Name: "to", Abbrv: "", TknId: 164, Type: CmdType.cmd },
			{ Name: "verify", Abbrv: "vE", TknId: 149, Type: CmdType.cmd },
			{ Name: "wait", Abbrv: "wA", TknId: 146, Type: CmdType.cmd },

			//
			// ----- fn num -----
			{ Name: "abs", Abbrv: "aB", TknId: 182, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "asc", Abbrv: "aS", TknId: 198, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "atn", Abbrv: "aT", TknId: 193, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "cos", Abbrv: "", TknId: 190, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "exp", Abbrv: "eX", TknId: 189, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "fn", Abbrv: "", TknId: 165, Type: CmdType.fnum },
			{ Name: "fre", Abbrv: "fR", TknId: 184, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "int", Abbrv: "", TknId: 181, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "len", Abbrv: "", TknId: 195, Type: CmdType.fnum, Param: paramFnStr },
			{ Name: "log", Abbrv: "", TknId: 188, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "peek", Abbrv: "pE", TknId: 194, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "pos", Abbrv: "", TknId: 185, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "rnd", Abbrv: "rN", TknId: 187, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "sgn", Abbrv: "sG", TknId: 180, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "sin", Abbrv: "sI", TknId: 191, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "sqr", Abbrv: "sQ", TknId: 186, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "tan", Abbrv: "", TknId: 192, Type: CmdType.fnum, Param: paramFnNum },
			{ Name: "usr", Abbrv: "uS", TknId: 183, Type: CmdType.fnum, Param: paramFnAny }, /* fix: returns a num OR a string */
			{ Name: "val", Abbrv: "vA", TknId: 197, Type: CmdType.fnum, Param: paramFnStr },

			//
			// ----- fn str -----
			{ Name: "chr$", Abbrv: "cH", TknId: 199, Type: CmdType.fstr, Param: paramFnNum },
			{ Name: "left$", Abbrv: "leF", TknId: 200, Type: CmdType.fstr, Param: paramFnStr_LR },
			{ Name: "mid$", Abbrv: "mI", TknId: 202, Type: CmdType.fstr, Param: paramFnStr_Mid },
			{ Name: "right$", Abbrv: "rI", TknId: 201, Type: CmdType.fstr, Param: paramFnStr_LR },
			{ Name: "str$", Abbrv: "stR", TknId: 196, Type: CmdType.fstr, Param: paramFnNum },

			//
			// ----- fn out -----
			{ Name: "spc(", Abbrv: "sP", TknId: 166, Type: CmdType.fout, Param: paramFnNum },
			{ Name: "tab(", Abbrv: "tA", TknId: 163, Type: CmdType.fout, Param: paramFnNum },

			//
			// ----- ops -----
			{ Name: "not", Abbrv: "nO", TknId: 168, Type: CmdType.ops, Param: paramOpsNum },
			{ Name: "and", Abbrv: "aN", TknId: 175, Type: CmdType.ops, Param: paramOpsNum },
			{ Name: "or", Abbrv: "", TknId: 176, Type: CmdType.ops, Param: paramOpsNum },
			{ Name: "^", Abbrv: "", TknId: -1, Type: CmdType.ops, Param: paramOpsNum },
			{ Name: "*", Abbrv: "", TknId: -1, Type: CmdType.ops, Param: paramOpsNum },
			{ Name: "/", Abbrv: "", TknId: -1, Type: CmdType.ops, Param: paramOpsNum },
			{ Name: "+", Abbrv: "", TknId: -1, Type: CmdType.ops, Param: paramOpsAny }, /* this is any */
			{ Name: "-", Abbrv: "", TknId: -1, Type: CmdType.ops, Param: paramOpsNum },

			//
			// ----- compare -----
			// ToDo: move comp to ops?
			{ Name: "==", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny },
			{ Name: "!=", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny }, /* same as <>, but modern */
			{ Name: "<=", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny },
			{ Name: ">=", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny },
			{ Name: "<>", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny },
			{ Name: "<", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny },
			{ Name: ">", Abbrv: "", TknId: -1, Type: CmdType.comp, Param: paramOpsAny },

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
			type: [ParamType.any]
		};

		for (let i: number = 0; i < this.m_Commands.length; i++) {

			// create deabbrv map
			if (this.m_Commands[i].Abbrv !== "") {
				this.m_mapDeAbbrev.set(this.m_Commands[i].Abbrv, this.m_Commands[i].Name);
				aAbbrv.push(this.m_Commands[i].Abbrv);
			}

			// create name / id map
			this.m_mapCmdId.set(this.m_Commands[i].Name, i);

			// set parser definition
			if (typeof this.m_Commands[i].Param === "undefined")
				this.m_Commands[i].Param = defEmpty;

			// set regex
			switch (this.m_Commands[i].Type) {
				case CmdType.cmd:
					this.m_Commands[i].Ret = Tokentype.cmd;
					this.m_lstCmd.push(i);
					aCmd.push(this.m_Commands[i].Name);
					break;

				case CmdType.fnum:
					this.m_Commands[i].Ret = Tokentype.fnnum;
					this.m_lstFnNum.push(i);
					aFn.push(this.m_Commands[i].Name);
					break;

				case CmdType.fstr:
					this.m_Commands[i].Ret = Tokentype.fnstr;
					this.m_lstFnStr.push(i);
					aFn.push(this.m_Commands[i].Name);
					break;

				case CmdType.fout:
					this.m_Commands[i].Ret = Tokentype.fnout;
					this.m_lstFnOut.push(i);
					aFn.push(this.m_Commands[i].Name);
					break;

				case CmdType.ops:
					this.m_Commands[i].Ret = Tokentype.fnnum
					this.m_lstOps.push(i);
					break;

				case CmdType.comp:
					this.m_Commands[i].Ret = Tokentype.fnnum;
					this.m_lstOps.push(i);
					break;
			}
		}

		// ToDo: move escape and list creation to own method
		this.regIsCmd = this.CreateListRegExp(aCmd);
		this.regIsFn = this.CreateListRegExp(aFn);
		this.regIsAbbrv = new RegExp("(" + aAbbrv.join("|").replace(/(\?)/, "\\$1") + ")", "g");

	}

	private CreateListRegExp(list: string[]): RegExp {
		return new RegExp("^(" + list.join("|").replace(/([\#\$\(\*\+\^])/g, "\\$1") + ")\\s*(.*)\\s*");
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
				const subMatch: string[] = match[m].match(this.regIsCmd);
				if (subMatch !== null)
					match[m] = match[m].replace(subMatch[1], "");

				if (match[m].length > 1) {
					this.regIsFn.lastIndex = -1;
					if (!this.regIsFn.test(match[m])) {
						const tuple: number[] = CodeHelper.FindMatching(code, code.indexOf(match[m]));

						// fix unclosed arrays
						if (!CodeHelper.IsMatching(tuple)) {
							tuple[1] = code.length;
							code += ")";
						}

						if (CodeHelper.IsMatching(tuple)) {
							code = code.substring(0, tuple[0]) + "["
								+ code.substring(tuple[0] + 1, tuple[1]) + "]"
								+ code.substring(tuple[1] + 1);
						}
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
		this.regIsCmd.lastIndex = -1;

		if (!this.regIsCmd.test(code)) {
			this.regArrayStart.lastIndex = -1;

			match = this.regArrayStart.exec(code);
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

		this.regIsAbbrv.lastIndex = -1;
		const match: string[] = code.match(this.regIsAbbrv);

		if (match !== null) {
			for (let i: number = 0; i < match.length; i++) {
				code = code.replace(match[i], this.m_mapDeAbbrev.get(match[i]));
			}
		}

		return code;
	}

	//#endregion

	private m_TknData: TokenizeData;
	public Temp(code: string): void {

		// get timeing
		console.time("temp");

		const lines: string[] = CodeHelper.CodeSplitter(code, "\n");

		//console.log(lines);

		this.m_TknData = { Tokens: [], Literals: [], Level: 0, Vars: [], VarMap: new Map<string, number>(), DimMap: new Map<string, boolean>(), Errors: 0 };

		for (let l: number = 0; l < lines.length; l++) {
			if (lines[l].trim() !== "") {
				let match: string[] = lines[l].match(this.regLineNr);
				const prgLine: PrgLine = { Ln: -1, Code: match[2], Tokens: [] };

				if (match[1] !== "") {
					prgLine.Ln = parseInt(match[1]);
				}

				if (prgLine.Code !== "") {
					// encode literals to make parsing easier
					const literals: SplitItem = CodeHelper.EncodeLiterals(this.DeAbbreviate(prgLine.Code));

					// de-abbrv and store back in line
					prgLine.Code = CodeHelper.RestoreLiterals(literals.Source, literals.List);
					this.m_TknData.Literals = literals.List;

					console.log("-----");
					console.log(prgLine.Code);

					// split line into parts and parse
					const parts: string[] = CodeHelper.CodeSplitter(literals.Source, ":");
					for (let p: number = 0; p < parts.length; p++) {
						// convert array () to []
						parts[p] = this.EncodeArray(parts[p]);

						// convert = to ==
						parts[p] = this.EncodeCompare(parts[p]);

						// tokenize
						this.m_TknData.Tokens = [];
						this.m_TknData.Level = 0;
						const token = this.Tokenizer(parts[p]);

						this.m_TknData.Tokens = this.SortTokenArray(this.m_TknData.Tokens);

						// sort and store in line
						console.log("-- tkn:", parts[p], this.m_TknData);
					}
				}
			}
		}

		console.timeEnd("temp");
	}

	/**
	 * Converts a piece of code into a token
	 * @param			code		code to tokenize
	 * @returns			Token
	 **/
	public Tokenizer(code: string): Token {

		let token: Token = this.CreateError(ErrorCodes.SYNTAX, "syntax error");
		let match: string[];
		let id: number = 0;

		code = code.trim();

		// set nesting level
		this.m_TknData.Level++;

		// reset regexes
		this.regBracket.lastIndex = -1;
		this.regLet.lastIndex = -1;
		this.regIsCmd.lastIndex = -1;
		this.regIsFn.lastIndex = -1;
		this.regVar.lastIndex = -1;
		this.regNum.lastIndex = -1;
		this.regLiteral.lastIndex = -1;

		//
		// if code starts and ends with () or [] and they are matching -> remove
		while (this.regBracket.test(code)) {
			match = this.regBracket.exec(code);
			if (match !== null) {
				const tuple: [number, number] = CodeHelper.FindMatching(code, 0, code.charAt(0), code.charAt(code.length - 1));
				if (tuple[0] == 0 && tuple[1] == (code.length - 1))
					code = match[1];
			}
		}


		// start with assign which is LET without let, if there's a let, remove it
		match = this.regLet.exec(code);
		if (match !== null) {
			console.log("- let:", match);
			return this.TokenizeItem(token, "let", match[1] + "|" + match[2]);
		}

		//
		// commands, every line needs one
		match = this.regIsCmd.exec(code);
		if (match !== null) {
			console.log("- cmd:", match);
			return this.TokenizeItem(token, match[1], match[2]);
		}

		//
		// functions
		match = this.regIsFn.exec(code);
		if (match !== null) {
			console.log("- fn:", match);
			return this.TokenizeItem(token, match[1], match[2]);
		}

		//
		// ----- variables -----
		match = this.regVar.exec(code);
		if (match !== null) {
			console.log("- var:", match);
			if (typeof match[2] === "undefined")
				match[2] = "";
			return this.TokenizeVar(token, match[1], match[2]);
		}

		//
		// ----- number -----
		match = this.regNum.exec(code);
		if (match !== null) {
			token = this.CreateToken(-1, Tokentype.num, 10, parseFloat(match[0]));
			token.hint = "number";
			return token;
		}

		//
		// ----- literal -----
		match = this.regLiteral.exec(code);
		if (match !== null) {
			token = this.CreateToken(-1, Tokentype.str, 10, this.m_TknData.Literals[parseInt(match[1])]);
			token.hint = "literal";
			return token;
		}

		//
		// ops
		this.regIsOps.lastIndex = -1;
		match = this.regIsOps.exec(code);
		if (match !== null) {
			console.log("- ops:", match);
			return this.TokenizeOps(token, code);
		}

		//
		// comp
		// ToDo: check if the order does matter for compares
		this.regIsComp.lastIndex = -1;
		match = this.regIsComp.exec(code);
		if (match !== null) {
			console.log("- comp:", match);
			return this.TokenizeOps(token, code);
		}

		console.log("-- no token or error");
		token.Num = -1;
		token.hint = "no token found";

		return token;

	}

	/**
	 * Creates a token for the given item (cmd, fn) and the parameters, checks parameter type and number
	 * @param			token			Token data, default is: SYNTAX ERROR
	 * @param			item			the "name" of this item, ie.: print
	 * @param			code			the parameter code to tokenize
	 * @returns			Token			overwritten token (with tokenize results)
	 **/
	private TokenizeItem(token: Token, item: string, code: string): Token {

		if (this.m_mapCmdId.has(item)) {
			token.Id = this.m_mapCmdId.get(item);
			token.Type = this.m_Commands[token.Id].Ret;
			token.Name = this.m_Commands[token.Id].Name;
			token.Str = "";
			token.Num = 0;
			token.Values = [];
			token.Order = (this.m_TknData.Tokens.length == 0) ? 0 : (-this.m_TknData.Level * 10);
			token.hint = item;

			const def: CmdParameter = this.m_Commands[token.Id].Param;
			const split: string[] = def.fn(code, def.chr);

			// if there are no params remove the empty split
			if (code.trim() == "")
				split.pop();

			// add token to list if it is the first token for this part
			if (this.m_TknData.Tokens.length == 0)
				this.m_TknData.Tokens.push(token);

			// tokenize params and check type
			for (let i = 0; i < split.length; i++) {
				let tkn: Token = this.Tokenizer(split[i]);

				// do not add param tokens on error
				if (token.Type == Tokentype.err)
					break;

				// add to value list and to part's token list
				token.Values.push(tkn);

				// plain numbers or strings are not pushed to the token list
				if (!this.IsPlainType(tkn))
					this.m_TknData.Tokens.push(tkn);
			}

			token = this.CheckType(token);

		}

		return token;
	}

	/**
	 * Tokinize a variable and creates entries in the variable list and map
	 * @param			token			Token data, default is: SYNTAX ERROR
	 * @param			item			name of the variable
	 * @param			index			index for array, "" if it's a simple var'
	 * @returns			Token
	 **/
	private TokenizeVar(token: Token, item: string, index: string): Token {

		if (index === "") {
			let varType: Tokentype = Tokentype.vnum;
			if (item.endsWith("$")) {
				varType = Tokentype.vstr;
			} else if (item.endsWith("%")) {
				varType = Tokentype.vint;
			}

			// add var to var list and map (or return token if already in there)
			if (this.m_TknData.VarMap.has(item)) {
				token = this.m_TknData.Vars[this.m_TknData.VarMap.get(item)];

			} else {
				token.Id = -1;
				token.Type = varType;
				token.Name = item;
				token.Str = "";		// set via let
				token.Num = 0;		// set via let
				token.Values = [];
				token.Order = 99999; // vars don't need to be added to tokenlist, just to varlist // (-this.m_TknData.Level * 10);
				token.hint = "var";

				this.m_TknData.VarMap.set(item, this.m_TknData.Vars.length);
				this.m_TknData.Vars.push(token);
			}
		}

		return token;
	}

	/**
	 * Tokenize operators
	 * @param			token			Token data, default is: SYNTAX ERROR
	 * @param			code			code to tokenize
	 * @returns			Token
	 **/
	private TokenizeOps(token: Token, code: string): Token {

		// combine double ops like --, ++, -+ and +-
		while (/[\+\-]\s*[\+\-]/.test(code))
			code = code.replace(/\-\s*\+/g, "-").replace(/\+\s*\-/g, "-").replace(/\-\s*\-/g, "+").replace(/\+\s*\+/g, "+");

		// go over ops in reverse order of importance
		for (let i = 0; i < this.m_lstOps.length; i++) {

			const cmd: BasicCmd = this.m_Commands[this.m_lstOps[i]];
			const split: string[] = this.Splitter(code, cmd.Name);

			// if split is empty, chances are high that we have something like x*-y
			// as variables can't be negative we cheat and turn this into x*0-y
			if (split.length > 1) {
				for (let j = 0; j < split.length; j++) {
					if (split[j] === "")
						split[j] = "0";
				}
			}

			// found at least one pair
			if (code.includes(cmd.Name)) {

				token.Id = this.m_mapCmdId.get(cmd.Name);
				token.Type = this.m_Commands[token.Id].Ret;
				token.Name = cmd.Name;
				token.Str = "";
				token.Num = 0;
				token.Values = [];
				token.Order = (this.m_TknData.Tokens.length == 0) ? 0 : (-this.m_TknData.Level * (10 + i));
				token.hint = cmd.Name;

				for (let j = 0; j < split.length; j++) {
					let tkn: Token = this.Tokenizer(split[j]);

					// do not add forther param tokens on error
					if (token.Type == Tokentype.err)
						break;

					// add to value list and to part's token list
					token.Values.push(tkn);

					// plain vars, numbers or strings are not pushed to the token list
					if (!this.IsPlainType(tkn))
						this.m_TknData.Tokens.push(tkn);
				}

				token = this.CheckType(token);

				// set return type to first value
				if (token.Type != Tokentype.err && token.Values.length > 0) {
					if (this.IsNum(token.Values[0])) {
						token.Type = Tokentype.fnnum;
					} else {
						if (this.IsStr(token.Values[0]))
							token.Type = Tokentype.fnstr;
					}
				}

				break;
			}


		}

		return token;
	}

	/**
	 * Checks a token's parameters, length and types
	 * @param			token			token to check parameters
	 * @returns			Token
	 **/
	private CheckType(token: Token): Token {

		if (token.Id != -1) {
			const param: CmdParameter = this.m_Commands[token.Id].Param;

			// check if we have enough or too many params
			if (param.len != -1) {
				if (token.Values.length < param.len) {
					token = this.SetError(token, ErrorCodes.SYNTAX, "not enough parameters");
					return token;
				}

				if (((token.Values.length > param.len) && (param.len == param.type.length)) || ((param.len < param.type.length) && (token.Values.length > param.type.length))) {
					token = this.SetError(token, ErrorCodes.SYNTAX, "to many parameters");
					return token;
				}
			}

			// go over params and check type
			if (param.type.length > 0) {
				for (let i = 0; i < token.Values.length; i++) {
					const paramType: ParamType = param.type[Math.min(i, param.type.length - 1)];
					const tkn: Token = token.Values[i];

					switch (paramType) {
						case ParamType.num:
						case ParamType.adr:
						case ParamType.byte:
							if (!this.IsNum(tkn))
								token = this.SetError(token, ErrorCodes.TYPE_MISMATCH, "parameter #" + (i + 1).toString() + " is not a number");
							break;

						case ParamType.str:
							if (!this.IsStr(tkn))
								token = this.SetError(token, ErrorCodes.TYPE_MISMATCH, "parameter #" + (i + 1).toString() + " is not a string");
							break;

						case ParamType.same: // compare with prev. token type (usually a var)
							if (i > 0 && token.Values.length > 0) {
								if (this.GetBaseType(token.Values[i - 1]) != this.GetBaseType(tkn))
									token = this.SetError(token, ErrorCodes.TYPE_MISMATCH, "types don't match");
							}
							break;
					}

					if (token.Type == Tokentype.err)
						break;

				}
			}

		}

		return token;
	}

	/**
	 * Wrapper CodeHelper.CodeSplitter
	 * @param			code			code to split
	 * @param			split			string to sue as separator
	 * @returns			string[]
	 **/
	private Splitter(code: string, split: string): string[] {
		return CodeHelper.CodeSplitter(code, split);
	}


	//
	//
	// ----- Helper ----

	/**
	 * Creates a simple token
	 * @param			id			id of the command/fn if applicable, otherwise -1
	 * @param			type		Tokentype of this token
	 * @param			order		execution order
	 * @param			value		[optional] number or string value
	 * @returns			Token
	 **/
	private CreateToken(id: number, type: Tokentype, order: number, value?: number | string): Token {
		const tkn: Token = { Name: "", Id: id, Type: type, Order: order, Num: 0, Str: "", Values: [], hint: "" };

		if (typeof value !== "undefined") {
			if (typeof value === "number")
				tkn.Num = value;

			if (typeof value === "string")
				tkn.Str = value;
		}

		return tkn;
	}

	/**
	 * Creates an error token
	 * @param			id			error number
	 * @param			message		additional error message
	 * @returns			Token
	 **/
	private CreateError(id: number, message: string): Token {
		return this.SetError(this.CreateToken(0, Tokentype.nop, 0), id, message);
	}

	/**
	 * Sets an error token
	 * @param			id			error number
	 * @param			message		additional error message
	 * @returns			Token
	 **/
	private SetError(token: Token, id: number, message: string): Token {
		token.Id = id;
		token.Name = CodeHelper.ErrorName(id);
		token.Order = -99999 + ((token.Type == Tokentype.nop) ? 0 : this.m_TknData.Errors++);
		token.Type = Tokentype.err;
		token.Str = message;
		token.Num = 0;

		return token;
	}

	/**
	 * Sorts the tokens by their Order field
	 * @param			aToken		array of tokens to sort
	 * @returns			Token[]		sorted array
	 **/
	private SortTokenArray(aToken: Token[]): Token[] {
		aToken.sort(function (a, b) {
			if (typeof a.Order === "undefined") a.Order = 99999;
			if (typeof b.Order === "undefined") b.Order = 99999;
			return a.Order - b.Order;
		});

		return aToken;
	}

	/**
	 * Returns the base type of a token, ie: aint -> number
	 * @param			tkn			Token to get the type from
	 * @returns			Tokentype
	 **/
	private GetBaseType(tkn: Token): Tokentype {

		if (this.IsNum(tkn))
			return Tokentype.num;

		if (this.IsStr(tkn))
			return Tokentype.str;

		return tkn.Type;
	}

	/**
	 * Checks if the given token is a value (literal or number) 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	private IsPlainType(tkn: Token): boolean {
		return (tkn.Type == Tokentype.num
			|| tkn.Type == Tokentype.int
			|| tkn.Type == Tokentype.str
			|| this.IsVar(tkn));
	}

	/**
	 * Checks if the given token returns a number 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
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

	/**
	 * Checks if the given token returns a string 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	private IsStr(tkn: Token): boolean {
		return (tkn.Type == Tokentype.str
			|| tkn.Type == Tokentype.fnstr
			|| tkn.Type == Tokentype.vstr
			|| tkn.Type == Tokentype.astr
			|| tkn.Type == Tokentype.ops);
	}

	/**
	 * Checks if the given token is variable 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	private IsVar(tkn: Token): boolean {
		return (tkn.Type == Tokentype.vnum
			|| tkn.Type == Tokentype.vint
			|| tkn.Type == Tokentype.vstr
			|| tkn.Type == Tokentype.anum
			|| tkn.Type == Tokentype.aint
			|| tkn.Type == Tokentype.astr)
	};

}
