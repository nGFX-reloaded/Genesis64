
//#region " ----- Interfaces / Enums / Types ----- "

//import { error } from "jquery";

enum BasicVersion {
	v2, g64
}

type G64BasicOptions = {
	basicVersion: BasicVersion;
}

//#endregion

class G64Basic {

	private PIPE: string = "|";

	//#region " ----- Privates ----- "

	private m_Mem: G64Memory;				// ref to memory

	private m_Commands: BasicCmd[] = [];

	private m_lstCmd: number[] = [];		// list of cmds
	private m_lstFnNum: number[] = [];		// list of fn nums
	private m_lstFnStr: number[] = [];		// list of fn strs
	private m_lstFnOut: number[] = [];		// list of fn outs
	private m_lstOps: number[] = [];		// list of ops
	private m_lstComp: number[] = [];		// list of comparers

	private m_fnNames: string = "";

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

	private regLet: RegExp = /^(?:let\s*)?(?!for|if)([a-zA-Z]+\d*[$%]?\s*(?:\[.+\])?)\s*=([^=].*)$/; // assignment (optional let)
	private regVar: RegExp = /^([a-zA-Z]+\d*[$%]?\s*(\[.+\])?)$/;	// a single variable (or array, with g64 delimiters [])
	private regNum: RegExp = /^[\+-]?(?:\d*\.)?\d+(?:e[\+-]?\d+)?$/; // a single number
	private regLiteral: RegExp = /^{(\d+)}$/;
	private regIsOps: RegExp = /not|or|and|\^|\*|\/|\+|\-/; // ToDo: create from list
	private regIsComp: RegExp = /==|!=|<>|<=|>=|<|>/; // ToDo: create from list
	private regIsSeperator: RegExp = /^[,;]$/;

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



		// const paramFile: CmdParameter = { chr: ",", len: 0, type: [ParamType.str, ParamType.num, ParamType.num] };

		const paramOpsNum: CmdParameter = { chr: this.PIPE, len: -1, type: [ParamType.num, ParamType.num] };
		const paramOpsAny: CmdParameter = { chr: this.PIPE, len: -1, type: [ParamType.any, ParamType.same] };

		//const paramPrint: CmdParameter = { chr: "", len: -1, type: [ParamType.any] };

		const paramFnNum: CmdParameter = { len: 1, type: [ParamType.num], fn: this.TokenizeFunction.bind(this) };
		const paramFnStr: CmdParameter = { len: 1, type: [ParamType.str] };

		const paramFnAny: CmdParameter = { len: 1, type: [ParamType.any] };
		const paramFnStr_LR: CmdParameter = { len: 2, type: [ParamType.str, ParamType.num] };
		const paramFnStr_Mid: CmdParameter = { len: 2, type: [ParamType.str, ParamType.num, ParamType.num] };

		this.m_Commands = [

			//
			// ----- comands -----
			{ Name: "close", Abbrv: "clO", TknId: 160, Type: CmdType.cmd },
			{ Name: "clr", Abbrv: "cR", TknId: 156, Type: CmdType.cmd },
			{ Name: "cont", Abbrv: "cO", TknId: 154, Type: CmdType.cmd },
			{ Name: "cmd", Abbrv: "cM", TknId: 157, Type: CmdType.cmd },
			{ Name: "data", Abbrv: "dA", TknId: 131, Type: CmdType.cmd, Param: { len: -1, type: [ParamType.any], fn: this.TokenizeData.bind(this) } },
			{ Name: "def", Abbrv: "dE", TknId: 150, Type: CmdType.cmd, Param: { len: -1, type: [ParamType.var, ParamType.num], fn: this.ParamDef.bind(this) } },
			{ Name: "dim", Abbrv: "dI", TknId: 134, Type: CmdType.cmd, Param: { len: -1, type: [ParamType.var, ParamType.num], fn: this.ParamDim.bind(this) } },
			{ Name: "end", Abbrv: "eN", TknId: 128, Type: CmdType.cmd },
			{ Name: "for", Abbrv: "fO", TknId: 129, Type: CmdType.cmd, Param: { chr: this.PIPE, len: 3, type: [ParamType.var, ParamType.num, ParamType.num], fn: this.ParamFor.bind(this) } },
			{ Name: "get", Abbrv: "gE", TknId: 161, Type: CmdType.cmd },
			{ Name: "get#", Abbrv: "", TknId: 161 /*161 35*/, Type: CmdType.cmd },
			{ Name: "gosub", Abbrv: "goS", TknId: 141, Type: CmdType.cmd },
			// { Name: "go", Abbrv: "", TknId: -1, Type: CmdType.cmd },
			{ Name: "goto", Abbrv: "gO", TknId: 137 /*203 164*/, Type: CmdType.cmd, Param: paramFnNum },
			{ Name: "if", Abbrv: "", TknId: 139, Type: CmdType.cmd, Param: { chr: this.PIPE, len: 2, type: [ParamType.num, ParamType.any], fn: this.ParamIf.bind(this) } },
			{ Name: "input", Abbrv: "", TknId: 133, Type: CmdType.cmd },
			{ Name: "input#", Abbrv: "iN", TknId: 132, Type: CmdType.cmd },
			{ Name: "let", Abbrv: "lE", TknId: 136, Type: CmdType.cmd, Param: { chr: this.PIPE, len: 2, type: [ParamType.var, ParamType.same] } },
			{ Name: "list", Abbrv: "lI", TknId: 155, Type: CmdType.cmd },
			{ Name: "load", Abbrv: "lO", TknId: 147, Type: CmdType.cmd },
			{ Name: "new", Abbrv: "", TknId: 162, Type: CmdType.cmd },
			{ Name: "next", Abbrv: "nE", TknId: 130, Type: CmdType.cmd },
			{ Name: "on", Abbrv: "", TknId: 145, Type: CmdType.cmd },
			{ Name: "open", Abbrv: "oP", TknId: 159, Type: CmdType.cmd },
			{ Name: "poke", Abbrv: "pO", TknId: 151, Type: CmdType.cmd, Param: { len: 2, type: [ParamType.adr, ParamType.byte] } },
			{ Name: "print", Abbrv: "?", TknId: 153, Type: CmdType.cmd, Param: { chr: this.PIPE, len: -1, type: [ParamType.any], fn: this.ParamPrint.bind(this) } },
			{ Name: "print#", Abbrv: "pR", TknId: 152, Type: CmdType.cmd },
			{ Name: "read", Abbrv: "rE", TknId: 135, Type: CmdType.cmd },
			{ Name: "rem", Abbrv: "", TknId: 143, Type: CmdType.cmd },
			{ Name: "restore", Abbrv: "reS", TknId: 140, Type: CmdType.cmd },
			{ Name: "return", Abbrv: "reT", TknId: 142, Type: CmdType.cmd },
			{ Name: "run", Abbrv: "rU", TknId: 138, Type: CmdType.cmd },
			{ Name: "save", Abbrv: "sA", TknId: 148, Type: CmdType.cmd },
			{ Name: "stop", Abbrv: "sT", TknId: 144, Type: CmdType.cmd },
			{ Name: "step", Abbrv: "stE", TknId: 169, Type: CmdType.cmd },
			{ Name: "sys", Abbrv: "sY", TknId: 158, Type: CmdType.cmd },
			{ Name: "then", Abbrv: "tH", TknId: 167, Type: CmdType.cmd },
			// { Name: "to", Abbrv: "", TknId: 164, Type: CmdType.cmd },
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
			chr: ",",
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

			// set param parser
			if (typeof this.m_Commands[i].Param.fn === "undefined")
				this.m_Commands[i].Param.fn = this.TokenizeParam.bind(this);

			// set param split
			if (typeof this.m_Commands[i].Param.chr === "undefined")
				this.m_Commands[i].Param.chr = ",";


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
					this.m_lstComp.push(i);
					break;
			}
		}

		// ToDo: move escape and list creation to own method
		this.regIsCmd = this.CreateListRegExp(aCmd);
		this.regIsFn = this.CreateListRegExp(aFn);
		this.regIsAbbrv = new RegExp("(" + aAbbrv.join("|").replace(/(\?)/, "\\$1") + ")", "g");

		this.m_fnNames = aFn.join("|").replace(/\(/g, "\\(");

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

		this.m_TknData = {
			Tokens: [],
			Literals: [],
			Level: 0, Vars: [],
			VarMap: new Map<string, number>(),
			DimMap: new Map<string, number[]>(),
			FnMap: new Map<string, Token>(),
			Data: [],
			Errors: 0
		};

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

	//#region " ----- Tokenizer ----- "

	/**
	 * Converts a piece of code into a token
	 * @param			code		code to tokenize
	 * @returns			Token
	 **/
	public Tokenizer(code: string): Token {

		let token: Token = this.CreateToken(-1, Tokentype.nop, 0);
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
		this.regIsComp.lastIndex = -1;
		this.regIsOps.lastIndex = -1;

		//
		// if code starts and ends with () or [] and they are matching -> remove
		code = this.RemoveBrackets(code);

		//
		// ----- commands, vars, literals and numbers are checked "as is -----
		//

		// start with assign which is LET without let, so just add it
		match = this.regLet.exec(code);
		if (match !== null)
			code = "let " + match[1] + this.PIPE + match[2];

		// commands
		match = this.regIsCmd.exec(code);
		if (match !== null) {
			console.log("- cmd:", match);
			return this.TokenizeItem(token, match[1], match[2]);
		}

		// variables
		match = this.regVar.exec(code);
		if (match !== null) {
			if (!this.regIsFn.test(match[1])) {
				console.log("- var:", match);
				if (typeof match[2] === "undefined") {
					return this.TokenizeVar(token, match[1]);
				} else {
					return this.TokenizeArray(token, match[1], match[2]);
				}
			}
		}
		// number
		match = this.regNum.exec(code);
		if (match !== null) {
			console.log("- num:", match);
			token = this.CreateToken(-1, Tokentype.num, 100, parseFloat(match[0]));
			token.hint = "number";
			return token;
		}

		// literals
		match = this.regLiteral.exec(code);
		if (match !== null) {
			token = this.CreateToken(-1, Tokentype.str, 100, this.m_TknData.Literals[parseInt(match[1])]);
			token.hint = "literal";
			return token;
		}

		//
		// ----- operators, compares and functions need more than simple testing -----
		//

		// ops
		match = this.regIsOps.exec(code); // just check if there is one of the ops in the code
		if (match !== null) {
			console.log("- ops:", match);
			token = this.TokenizeOps(token, Tokentype.ops, code);
			if (token.Type != Tokentype.nop)
				return token;
		}

		// comp
		match = this.regIsComp.exec(code);
		if (match !== null) {
			console.log("- comp:", match);
			return this.TokenizeOps(token, Tokentype.comp, code);
		}

		// functions
		match = this.regIsFn.exec(code);
		if (match !== null) {
			console.log("- fn:", match);
			return this.TokenizeItem(token, match[1], match[2]);
		}

		// connector chars
		match = this.regIsSeperator.exec(code);
		if (match !== null) {
			console.log("- sep:", match);
			token = this.CreateToken(-1, Tokentype.link, 200, match[0]);
			token.hint = match[0];
			return token;
		}


		console.log("-- no token or error '" + code + "'");
		token = this.SetError(token, ErrorCodes.SYNTAX, "no token found");
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
			const id: number = this.m_mapCmdId.get(item);
			const cmd: BasicCmd = this.m_Commands[id];

			token.Id = id;
			token.Type = cmd.Ret;
			token.Name = cmd.Name;
			token.Str = "";
			token.Num = 0;
			token.Values = [];
			token.Order = (this.m_TknData.Tokens.length == 0) ? 0 : (-this.m_TknData.Level * 10);
			token.hint = item;

			if (token.Type == Tokentype.cmd && this.m_TknData.Tokens.length > 0)
				token.Order = 10;

			// add token to list if it is the first token for this part
			if (this.m_TknData.Tokens.length == 0)
				this.m_TknData.Tokens.push(token);


			token = cmd.Param.fn(token, cmd, code);

		}

		return token;
	}

	/**
	 * Default parameter tokenizer and add to command token
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private TokenizeParam(token: Token, cmd: BasicCmd, code: string): Token {

		const def: CmdParameter = cmd.Param;
		const split: string[] = this.Splitter(code, def.chr);

		// if there are no params remove the empty split
		if (code.trim() == "")
			split.pop();

		// tokenize params and check type
		for (let i = 0; i < split.length; i++) {
			if (split[i] !== "") {
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
		}

		return this.CheckType(token);
	}

	/**
	 * Tokinize a variable and creates entries in the variable list and map
	 * @param			token			Token data, default is: SYNTAX ERROR
	 * @param			item			name of the variable
	 * @returns			Token
	 **/
	private TokenizeVar(token: Token, item: string): Token {

		let varType: Tokentype = Tokentype.nop;

		varType = Tokentype.vnum;
		if (item.endsWith("$")) {
			varType = Tokentype.vstr;
		} else {
			if (item.endsWith("%"))
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
			token.Order = -9999 + this.m_TknData.Level; // add to tokenlist, right after errors, to make sure vars are created on run
			token.hint = "var";

			this.m_TknData.VarMap.set(item, this.m_TknData.Vars.length);
			this.m_TknData.Vars.push(token);		// store in vars
			this.m_TknData.Tokens.push(token);		// store in tokenlist
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

	private TokenizeArray(token: Token, item: string, index: string): Token {

		const split: string[] = this.Splitter(this.RemoveBrackets(index), ",");
		var dims: number[] = [];

		let varType: Tokentype = Tokentype.anum;
		if (item.endsWith("$")) {
			varType = Tokentype.astr;
		} else {
			if (item.endsWith("%"))
				varType = Tokentype.aint;
		}

		// setup a dummy token, as arrays work like functions
		token.Id = -1;
		token.Type = varType;
		token.Name = item.substring(0, item.indexOf("["));
		token.Str = "";		// set via let
		token.Num = 0;		// set via let
		token.Values = [];
		token.Order = -9999 + this.m_TknData.Level; // add to tokenlist, right after errors, to make sure vars are created on run
		token.hint = "array";

		// check if dim exits, otherwise create vars and dim entry
		if (this.m_TknData.DimMap.has(token.Name)) {
			// check param length against map length
			dims = this.m_TknData.DimMap.get(token.Name);
			if (split.length !== dims.length)
				token = this.SetError(token, ErrorCodes.BAD_SUBSCRIPT, "too many dimensions");

		} else {
			//  create dim data
			for (let i: number = 0; i < split.length; i++) {
				dims.push(-1);	// just create a dim entry for now
			}
		}

		for (let i = 0; i < split.length; i++) {
			const tkn: Token = this.Tokenizer(split[i]);

			if (!this.IsNum(tkn) && token.Type != Tokentype.err)
				token = this.SetError(token, ErrorCodes.TYPE_MISMATCH, "array index #" + (i + 1).toString() + " is not a number");

			token.Values.push(tkn);
		}

		if (token.Type != Tokentype.err)
			this.m_TknData.Tokens.push(token);		// store in tokenlist

		return token;
	}

	/**
	 * Tokenize operators
	 * @param			token			Token data, default is: SYNTAX ERROR
	 * @param			code			code to tokenize
	 * @returns			Token
	 **/
	private TokenizeOps(token: Token, type: Tokentype, code: string): Token {

		// combine double ops like --, ++, -+ and +-
		if (type == Tokentype.ops)
			while (/[\+\-]\s*[\+\-]/.test(code))
				code = code.replace(/\-\s*\+/g, "-").replace(/\+\s*\-/g, "-").replace(/\-\s*\-/g, "+").replace(/\+\s*\+/g, "+");

		// go over ops/comps
		const list: number[] = (type == Tokentype.ops) ? this.m_lstOps : this.m_lstComp;
		for (let i = 0; i < list.length; i++) {
			const cmd: BasicCmd = this.m_Commands[list[i]];

			if (code.includes(cmd.Name)) {
				let split: string[] = this.Splitter(code, cmd.Name);

				if (split.length > 1) {
					// if split is empty, chances are high that we have something like x*-y
					// as variables can't be negative we cheat and turn this into x*0-y
					// or code like b=<>-1
					if (split[0].trim() === "") {
						if ((cmd.Name === "-") && isNaN(parseFloat(split[1]))) {
							split[0] = "0";
						} else {
							split.shift();
						}
					}

					// we do not chain ops/comps so we grab the first and join the rest again
					if (split.length > 2) {
						const tmpA: string = split.shift();
						const tmpB: string = split.join(cmd.Name);
						split = [tmpA, tmpB];
					}

					token.Id = this.m_mapCmdId.get(cmd.Name);
					token.Type = this.m_Commands[token.Id].Ret;
					token.Name = cmd.Name;
					token.Str = "";
					token.Num = 0;
					token.Values = [];
					token.Order = (this.m_TknData.Tokens.length == 0) ? 0 : (-this.m_TknData.Level * (10 + i));
					token.hint = cmd.Name;

					token = this.TokenizeParam(token, cmd, split.join(this.PIPE));

					// + can add strings, so we change the return type
					if (cmd.Name === "+")
						if (this.IsStr(token.Values[0]))
							token.Type = Tokentype.fnstr;

					break;
				}
			}
		}

		return token;
	}

	/**
	 * Tokenizer for functions
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private TokenizeFunction(token: Token, cmd: BasicCmd, code: string): Token {

		code = code.trim();

		const tuple: [number, number] = CodeHelper.FindMatching(code);

		if (tuple[0] == 0) {
			if (!CodeHelper.IsMatching(tuple)) {
				code += ")";
				tuple[1] = code.length - 1;
			}

			if (tuple[0] == 0 && tuple[1] == code.length - 1) {
				token = this.TokenizeParam(token, cmd, this.RemoveBrackets(code));
			}
		}

		return token;
	}

	//#endregion

	//#region " ---- Command Tokenizers ----- "

	/**
	 * Tokenizer for DEF
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private ParamDef(token: Token, cmd: BasicCmd, code: string): Token {

		const regFN: RegExp = /fn(.+)\((.+)\)\s*=(.+)/;
		const match: RegExpExecArray = regFN.exec(code.trim());


		if (match !== null) {
			match.shift();
			const fnName: string = match[0].trim();
			const fnVar: string = match[1].trim();
			const fnCode: string = match[2].trim();

			// create fn token
			let tknFn: Token = this.CreateToken(this.m_mapCmdId.get("fn"), Tokentype.fnnum, 50);
			if (this.m_TknData.FnMap.has(fnName)) {
				tknFn = this.m_TknData.FnMap.get(fnName);
			} else {
				tknFn = this.CreateToken(this.m_mapCmdId.get("fn"), Tokentype.fnnum, 50);
				tknFn.Name = fnName;
				this.m_TknData.FnMap.set(fnName, tknFn);
			}

			// set var token
			tknFn.Values.push(this.TokenizeVar(this.CreateToken(-1, Tokentype.err, -999), fnVar));

			// set fn
			tknFn.Values.push(this.TokenizeParam(tknFn, cmd, fnCode));

			console.log("DEF FN ->", code, tknFn);

		} else {
			token = this.SetError(token, ErrorCodes.SYNTAX, "cannot parse def fn");
		}

		token = this.SetError(token, -1, "def fn");
		return token;
	}

	/**
	 * Tokenize DATA parameters 
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private TokenizeData(token: Token, cmd: BasicCmd, code: string): Token {

		const def: CmdParameter = cmd.Param;
		const split: string[] = this.Splitter(CodeHelper.RestoreLiterals(code, this.m_TknData.Literals), def.chr);

		const regString: RegExp = /^\s*\"(.*)\"\s*$/;

		let match: RegExpMatchArray;

		if (split.length == 1 && split[0].trim() === "") {
			token = this.SetError(token, ErrorCodes.SYNTAX, "data without entries");
			return token;
		}

		for (let i: number = 0; i < split.length; i++) {
			let tkn: Token = this.CreateError(ErrorCodes.SYNTAX, "data entry error");

			this.regNum.lastIndex = -1;
			regString.lastIndex = -1;

			split[i] = split[i].trimStart(); // data ignores trailing spaces

			// check for numbers ...
			match = this.regNum.exec(split[i].trim());
			if (match !== null) {
				tkn = this.CreateToken(-1, Tokentype.num, 99999, match[0]); // read can access numbers via string as well
				tkn.Num = parseFloat(match[0]);
				tkn.hint = "num";

			} else {
				// ... everything else is treated as string
				match = regString.exec(split[i]);
				if (match !== null) {
					tkn = this.CreateToken(-1, Tokentype.num, 99999, match[1]); // pure strings enclosed in "" are store WITHOUT ""
					tkn.hint = "str";

				} else {
					tkn = this.CreateToken(-1, Tokentype.num, 99999, split[i]); // everything else is stored "as is"
					tkn.hint = "str";
				}
			}

			token.Values.push(tkn); // ToDo: on run collect all datas
		}

		return token;
	}

	/**
	 * Tokenize DIM parameters 
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private ParamDim(token: Token, cmd: BasicCmd, code: string): Token {

		// check if this DIM dims more than one array
		const arrays: string[] = this.Splitter(code, ",");

		for (let i: number = 0; i < arrays.length; i++) {
			if (/.+\(.+\)/.test(arrays[i].trim())) {

				const name: string = arrays[i].substring(0, arrays[i].indexOf("(")).trim();

				let type: Tokentype = Tokentype.anum;
				if (name.endsWith("$")) {
					type = Tokentype.astr;
				} else {
					if (name.endsWith("%"))
						type = Tokentype.aint;
				}

				if (this.m_TknData.DimMap.has(name)) {
					token = this.SetError(token, ErrorCodes.REDIMD_ARRAY, "array '" + name + "' already exists");
					break;

				} else {
					const tkn: Token = this.TokenizeParam(this.CreateToken(token.Id, token.Type, 100, name), cmd, this.RemoveBrackets(arrays[i].substring(arrays[i].indexOf("("))));

					if (tkn.Type != Tokentype.err) {
						tkn.Id = -1;
						tkn.Type = type;

						// simply register array now without really setting dimensions
						const dims: number[] = [];
						for (let k: number = 0; k < tkn.Values.length; k++) {
							dims.push(-1);
						}

						this.m_TknData.DimMap.set(name, dims);

						token.Values.push(tkn);

					} else {
						token = this.SetError(token, tkn.Id, tkn.Str);
						break;
					}
				}

			} else {
				token = this.SetError(token, ErrorCodes.SYNTAX, "parameter #" + (i + 1).toString() + " is not an array");
			}
		}

		return token;
	}

	/**
	 * Tokenizer for FOR, modifies code string and uses default parameter tokenizer
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private ParamFor(token: Token, cmd: BasicCmd, code: string): Token {

		const regFor = /^(.+)to(.+)step(.+)$/;

		if (!code.includes("step"))
			code += "step1";

		const match: RegExpMatchArray = regFor.exec(code);
		if (match !== null) {
			match.shift();
			token = this.TokenizeParam(token, cmd, match.join(this.PIPE));

		} else {
			token = this.SetError(token, ErrorCodes.SYNTAX, "malformed for");
		}

		return token;
	}

	/**
	 * Tokenizer for IF, modifies code string and uses default parameter tokenizer
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private ParamIf(token: Token, cmd: BasicCmd, code: string): Token {

		const regIf = /^(.+)(then|goto)(.+)$/;

		// fix THEN GOTO
		code = code.replace(/then\s*goto/, "goto");

		// fix THEN 10
		code = code.replace(/then\s*(\d+)/, "goto$1");

		const match: RegExpMatchArray = regIf.exec(code);
		if (match !== null) {
			match.shift();

			if (match[1] === "then") {
				match[1] = match.pop();
			} else {
				match[1] = match[1] + match.pop();
			}

			token = this.TokenizeParam(token, cmd, match.join(this.PIPE));

		} else {
			token = this.SetError(token, ErrorCodes.SYNTAX, "malformed if");
		}

		return token;
	}

	/**
	 * Tokenizer for PRINT, modifies code string and uses default parameter tokenizer
	 * @param			Token			token to add params to
	 * @param			cmd				the command
	 * @param			code			code containing params
	 * @returns			Token
	 **/
	private ParamPrint(token: Token, cmd: BasicCmd, code: string): Token {

		let i: number, j: number;
		let aParts: string[] = [], aFirst: string[] = [], aSecond: string[] = [];
		let match: RegExpMatchArray;
		let hasMatch: boolean;

		// check for ","
		aFirst = CodeHelper.CodeSplitter(code, ",");
		for (i = 0; i < aFirst.length; i++) {
			aParts.push(aFirst[i]);
			if (i < aFirst.length - 1) aParts.push(",");
		}

		// check for ";"
		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			aSecond = CodeHelper.CodeSplitter(aFirst[i], ";");

			// add back ";"
			for (j = 0; j < aSecond.length; j++) {
				aParts.push(aSecond[j].trim());
				if (j < aSecond.length - 1) aParts.push(";");
			}
		}

		// remove space between numbers
		for (i = 0; i < aParts.length; i++) {
			hasMatch = true;
			while (hasMatch) {
				match = new RegExp(/(\d+)\s*(\d+)/).exec(aParts[i]);

				if (match != null) {
					aParts[i] = aParts[i].replace(match[0], match[1] + match[2]);
				} else {
					hasMatch = false;
				}
			}
		}

		// remove space between: numvar [spc] num
		// so "a 2" becomes "a2"
		for (i = 0; i < aParts.length; i++) {
			hasMatch = true;
			while (hasMatch) {
				match = new RegExp(/([_a-z]+[_a-z0-9]*)\s+(\d+)/).exec(aParts[i]);

				if (match != null) {
					aParts[i] = aParts[i].replace(match[0], match[1] + match[2]);
				} else {
					hasMatch = false;
				}
			}
		}

		// split literals
		let strLit: string = "";
		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			hasMatch = true;
			while (hasMatch) {
				match = new RegExp(/[^\=\<\>]?\s*(\{\d+\})/g).exec(aFirst[i]); // but not in compares

				if (match != null) {
					strLit = aFirst[i].substring(0, aFirst[i].indexOf(match[1]));

					if (strLit !== "")
						aParts.push(strLit);

					aParts.push(match[1]);
					aFirst[i] = aFirst[i].substring(strLit.length + match[1].length);

				} else {

					if (aFirst[i] !== "")
						aParts.push(aFirst[i]);

					hasMatch = false;
				}
			}
		}

		// split between functions
		// sin(1) sin (1)
		const strStart: string = "(\\)|]|\\d)";
		const strEnd: string = "(\\(|" + this.m_fnNames + ")";

		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			hasMatch = true;

			while (hasMatch) {
				match = new RegExp(strStart + "\\s*" + strEnd).exec(aFirst[i]);

				if (match !== null) {
					aParts.push(aFirst[i].substring(0, aFirst[i].indexOf(match[0]) + match[1].length));
					aFirst[i] = aFirst[i].substring(aFirst[i].indexOf(match[0]) + match[1].length);

				} else {
					aParts.push(aFirst[i]);
					hasMatch = false;
				}
			}
		}

		// split between functions and vars
		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			hasMatch = true;

			while (hasMatch) {
				match = new RegExp("(\\)|])\\s*\\w+").exec(aFirst[i]);

				if (match !== null) {
					aParts.push(aFirst[i].substring(0, aFirst[i].indexOf(match[0]) + match[1].length));
					aFirst[i] = aFirst[i].substring(aFirst[i].indexOf(match[0]) + match[1].length);

				} else {
					aParts.push(aFirst[i]);
					hasMatch = false;
				}
			}
		}

		// remove empty parts and then join
		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			if (aFirst[i] !== "")
				aParts.push(aFirst[i]);
		}

		token = this.TokenizeParam(token, cmd, aParts.join(this.PIPE));

		return token;
	}


	//#endregion

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
								if (tkn.Type != Tokentype.err && token.Values[i - 1].Type != Tokentype.err && this.GetBaseType(token.Values[i - 1]) != this.GetBaseType(tkn))
									token = this.SetError(token, ErrorCodes.TYPE_MISMATCH, "types don't match");
							}
							break;

						case ParamType.cmd:
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

	/**
	 * Remove brackets from code, convert (1) into 1, works for () and []
	 * @param			code			code to remove brackets
	 * @returns			string
	 **/
	private RemoveBrackets(code: string): string {

		while (this.regBracket.test(code)) {
			const match: RegExpMatchArray = this.regBracket.exec(code);
			if (match !== null) {
				const tuple: [number, number] = CodeHelper.FindMatching(code, 0, code.charAt(0), code.charAt(code.length - 1));
				if (tuple[0] == 0 && tuple[1] == (code.length - 1))
					code = match[1];
			}
		}

		return code;
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
	 * Creates an array, sets up the name[index] entries in varmap and dimmap
	 * @param			token			the array token
	 * @param			dimensions		dimensions of this array
	 **/
	// ToDo: rewrite to take a DIM token either a real DIM or a tmp one
	private CreateArray(token: Token, dimensions: number[]): Token {
		const names: string[] = CodeHelper.CreateArrayIndex(token.Name, dimensions);

		for (let i = 0; i < names.length; i++) {
			const tkn: Token = this.CreateToken(-1, token.Type, -9999);

			tkn.Name = names[i];

			this.m_TknData.VarMap.set(tkn.Name, this.m_TknData.Vars.length);
			this.m_TknData.Vars.push(tkn);
		}

		this.m_TknData.DimMap.set(token.Name, dimensions);

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
	public GetBaseType(tkn: Token): Tokentype {

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
	public IsPlainType(tkn: Token): boolean {
		return (tkn.Type == Tokentype.num
			|| tkn.Type == Tokentype.str
			|| this.IsVar(tkn));
	}

	/**
	 * Checks if the given token returns a number 
	 * @param			tkn			Token to check
	 * @returns			boolean
	 **/
	public IsNum(tkn: Token): boolean {
		return (tkn.Type == Tokentype.num
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
	public IsStr(tkn: Token): boolean {
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
	public IsVar(tkn: Token): boolean {
		return (tkn.Type == Tokentype.vnum
			|| tkn.Type == Tokentype.vint
			|| tkn.Type == Tokentype.vstr
			|| tkn.Type == Tokentype.anum
			|| tkn.Type == Tokentype.aint
			|| tkn.Type == Tokentype.astr)
	};

}
