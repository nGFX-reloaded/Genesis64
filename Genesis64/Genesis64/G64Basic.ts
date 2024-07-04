/**
 * G64Basic.ts
 * deals with the BASIC V2 language
 */

interface BasicCmd {
	Name: string;			// name of the command, ie. the command
	Abbrv: string;			// abbreviation, if any
	TknId: number[];		// token id(s) when saving, or -1, then use pet values
	Type: Tokentype;		// type of token
	Param?: CmdParam;		// parameter for this 
	Fn?: Function;			// function to call when executing
}

interface CmdParam {
	Len: number;			// number of parameters, 0 for none or all optional, > 0 for fixed, < 0 for variable with fixed length (ie: -1: one fixed param, rest optional)
	Type: ParamType[];		// type of parameters
	Fn?: Function;			// splitter function to call when parsing

	Split?: string;			// split chr, if any
}

enum ParamType {
	var			/* 0: any var */,
	num			/* 1: any numberical value */,
	str			/* 2: any string value */,
	same		/* 3: same type as previous */,
	any			/* 4: any type */,

	byte		/* 5: byte */,
	adr			/* 6: address (0-65536) */,
	cmd 		/* 7: command */,
}

enum BasicVersion {
	v2, hires, simnons
}


class G64Basic {

	//#region " ----- Privates ----- "

	private m_Memory: G64Memory = null;

	private m_ParserLiterals: string[] = [];	// stores literals for the current part
	private m_ParserLevel = 0;

	private m_BasicCmds: BasicCmd[] = [];

	private m_regexCmd: RegExp = null;
	private m_regexFn: RegExp = null;
	private m_regexOps: RegExp = null;

	private m_regexNum: RegExp = null;
	private m_regexVar: RegExp = null;
	private m_regexLit: RegExp = null;

	private m_regexLet: RegExp = null;

	private m_regexAbbrv: RegExp = null;
	private m_regexDeAbbrv: RegExp = null;

	private m_lstCmd: number[] = [];
	private m_lstFn: number[] = [];
	private m_lstOps: number[] = [];
	private m_lstUnary: number[] = [];

	private m_fnNames: string = "";

	private m_mapCmd: Map<string, number> = new Map<string, number>();
	private m_mapAbbrv: Map<string, number> = new Map<string, number>();
	private m_mapVar: Map<Tokentype, number> = new Map<Tokentype, number>();

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

		const literals = Tools.EncodeLiterals(lineTkn.Str);
		const parts: string[] = Tools.CodeSplitter(literals.Source, ":");

		this.m_ParserLiterals = literals.List;

		console.log(">", lineTkn);
		console.log(">", parts);

		for (let i: number = 0; i < parts.length; i++) {
			let part: string = parts[i].trim();

			// convert --, +- to - and simplify ++ to +
			while (/[\+\-]\s*[\+\-]/.test(part))
				part = part.replace(/\-\s*\+/g, "-").replace(/\+\s*\-/g, "-").replace(/\-\s*\-/g, "+").replace(/\+\s*\+/g, "+");

			// fix let
			const matchLet: string[] = part.match(this.m_regexLet);
			const matchCmd: string[] = part.match(this.m_regexCmd);
			if (matchLet !== null && matchCmd !== null) {
				if (matchLet[0] === matchCmd[0])
					part = "let" + part;
			}

			this.m_ParserLevel = 0;

			console.log("---", part, "---");
			lineTkn.Values.push(this.Tokenizer(part));
		}

		return lineTkn;
	}

	public ExecToken(tkn: G64Token): G64Token {

		let tknReturn: G64Token = tkn;

		if (Check.IsError(tkn))
			return tkn;

		if (Check.IsCmd(tkn))
			tknReturn = this.m_BasicCmds[tkn.Id].Fn(tkn);

		return tknReturn;
	}

	/**
	 * Tokenizes a piece of code
	 * @param		code	the code to tokenize
	 * @returns		the tokenized code
	 */
	private Tokenizer(code: string): G64Token {

		let tkn: G64Token = Tools.CreateToken(Tokentype.nop);

		console.log("            ".substring(0, this.m_ParserLevel + 1), "t >", this.m_ParserLevel++, ">", code);

		this.m_regexCmd.lastIndex = -1;
		this.m_regexFn.lastIndex = -1;
		this.m_regexOps.lastIndex = -1;


		this.m_regexNum.lastIndex = -1;
		this.m_regexLit.lastIndex = -1;
		this.m_regexVar.lastIndex = -1;

		// remove whiatespace
		code = code.trim();

		// fix numbers
		code = code; // todo: fix numbers

		// remove brackets
		if (code.startsWith("(") && code.endsWith(")")) {
			const result: Matching = Tools.FindMatching(code);
			if (result.Has) {
				code = code.substring(1, code.length - 1);
			}
		}

		// connectors
		if (code === "," || code === ";") {
			return Tools.CreateToken(Tokentype.link, code);
		}

		// get commands
		// a line (or part) always starts with a command, everything else is an error
		tkn = this.TokenizeItem(tkn, code, this.m_lstCmd);
		if (tkn.Type !== Tokentype.nop)
			return tkn;


		// get ops
		// ops are more important than fns, as they can be part of a command, so we run them right after the commands
		tkn = this.TokenizeOps(tkn, code);
		if (tkn.Type !== Tokentype.nop)
			return tkn;

		// get unary ops
		tkn = this.TokenizeItem(tkn, code, this.m_lstUnary);
		if (tkn.Type !== Tokentype.nop)
			return tkn;

		// get fns
		tkn = this.TokenizeItem(tkn, code, this.m_lstFn);
		if (tkn.Type !== Tokentype.nop)
			return tkn;

		// get numbers
		if (this.m_regexNum.test(code)) {
			return this.TokenizeNum(tkn, code);
		}

		// get literals
		if (this.m_regexLit.test(code)) {
			return this.TokenizeLit(tkn, code);
		}

		// get vars
		if (this.m_regexVar.test(code)) {
			return this.TokenizeVar(tkn, code);
		}



		return Tools.CreateToken(Tokentype.err, "cannot parse: '" + Tools.RestoreLiterals(code, this.m_ParserLiterals) + "'", ErrorCodes.SYNTAX);
	}

	private TokenizeItem(tkn: G64Token, code: string, lstCmd: number[]): G64Token {

		for (let i: number = 0; i < lstCmd.length; i++) {
			const cmd: BasicCmd = this.m_BasicCmds[lstCmd[i]];

			if (code.startsWith(cmd.Name)) {

				// remove first item from match, as it is the whole match
				console.log("    tki >", cmd.Name, ">", code);

				tkn.Id = lstCmd[i];
				tkn.Name = cmd.Name;
				tkn.Type = cmd.Type;
				tkn.Str = "";
				tkn.Hint = "";
				tkn.Num = 0;
				tkn.Values = [];

				// get parameters
				const params: string[] = cmd.Param.Fn(cmd, code.substring(cmd.Name.length).trim());
				for (let j: number = 0; j < params.length; j++) {
					let tknParam: G64Token = this.Tokenizer(params[j]);

					// if token contains an error, we return it in place of the original token
					if (tknParam.Type === Tokentype.err)
						return tknParam;

					// add to token's parameter list
					tkn.Values.push(tknParam);
				}

				// run parameter checking
				tkn = Check.CheckType(tkn, cmd);
				break;

			}
		}

		return tkn;
	}

	private TokenizeOps(tkn: G64Token, code: string): G64Token {

		for (let i: number = 0; i < this.m_lstOps.length; i++) {
			const cmd: BasicCmd = this.m_BasicCmds[this.m_lstOps[i]];
			let split: string[] = Tools.CodeSplitter(code, cmd.Name);

			if (split[0].trim().startsWith("not") && split.length == 1) {
				return tkn;
			}

			if (split.length > 1) {
				console.log("ops", cmd.Name, ">>", code, split);

				// we do not chain ops/comps so we grab the first and join the rest again
				if (split.length > 2) {
					const tmpA: string = split.shift();
					const tmpB: string = split.join(cmd.Name);
					split = [tmpA, tmpB];
				}

				// if the first split is empty, we have an unary opperator (-)
				// numbers are allowed, so we check if the second split is a number
				if (split[0].trim() === "") {
					if (!isNaN(parseFloat(split[1].trim()))) {
						return this.TokenizeNum(tkn, cmd.Name + split[1].trim());
					} else {
						continue;
					}
				}

				tkn.Id = this.m_lstOps[i];
				tkn.Name = cmd.Name;
				tkn.Type = cmd.Type;
				tkn.Str = "";
				tkn.Hint = "";
				tkn.Num = 0;

				tkn.Values = [];
				for (let j: number = 0; j < split.length; j++) {
					let tknParam: G64Token = this.Tokenizer(split[j].trim());

					// if token contains an error, we return it in place of the original token
					if (tknParam.Type === Tokentype.err)
						return tknParam;

					// add to token's parameter list
					tkn.Values.push(tknParam);
				}

				// run parameter checking
				tkn = Check.CheckType(tkn, cmd);
				break;
			}
		}

		return tkn;
	}

	/**
	 * Tokenize a BASIC number
	 * @param		tkn		default token passed from Tokenizer
	 * @param		code	the code to tokenize
	 * @returns		the tokenized number
	 */
	private TokenizeNum(tkn: G64Token, code: string): G64Token {

		let num = parseFloat(code);

		if (code.startsWith("$")) {
			num = parseInt("0x" + code.substring(1));
		} else {
			if (code.startsWith("%")) {
				num = parseInt(code.substring(1), 2);
			}
		}

		if (!isNaN(num)) {
			tkn = Tools.CreateToken(Tokentype.num, null, num);

		} else {
			tkn = Tools.CreateToken(Tokentype.err, null, ErrorCodes.TYPE_MISMATCH);
			tkn.Str = code;
			tkn.Hint = "Invalid number";
		}

		return tkn;
	}

	/**
	 * Tokenize a BASIC literal
	 * @param		tkn		default token passed from Tokenizer
	 * @param		code	the code to tokenize
	 * @returns		the tokenized literal
	 */
	private TokenizeLit(tkn: G64Token, code: string): G64Token {
		return Tools.CreateToken(Tokentype.str, this.m_ParserLiterals[parseInt(code.substring(1, code.length - 1))]);
	}

	/**
	 * Tokenize a BASIC variable
	 * @param		tkn		default token passed from Tokenizer
	 * @param		code	the code to tokenize
	 * @returns		the tokenized variable
	 */
	private TokenizeVar(tkn: G64Token, code: string): G64Token {

		const match: string[] = code.match(this.m_regexVar);

		if (match !== null) {
			match.shift();

			const isArray: boolean = (typeof match[1] !== "undefined");

			let type: Tokentype = (isArray) ? Tokentype.anum : Tokentype.vnum;
			switch (match[0].slice(-1)) {
				case "$":
					type = (isArray) ? Tokentype.astr : Tokentype.vstr;
					break;
				case "%":
					type = (isArray) ? Tokentype.aint : Tokentype.vint;
					break;
			}

			// create var token
			tkn = Tools.CreateToken(type, match[0]);
			tkn.Id = this.m_mapVar.get(type);

			return tkn;

			if (isArray) { // array
				console.log(">>> arr >>>", match[0]);
				const index: string[] = Tools.CodeSplitter(match[1].substring(1, match[1].length - 1), ",");

				console.log(">>> ar -->", index);

				for (let i: number = 0; i < index.length; i++) {
					const tknIndex: G64Token = this.Tokenizer(index[i]);

					if (tknIndex.Type === Tokentype.err) {
						tkn = tknIndex;
						break;
					}

					if (!Check.IsNum(tknIndex)) {
						tkn = Tools.CreateToken(Tokentype.err, "index #" + (i + 1).toString() + " is not a number.", ErrorCodes.TYPE_MISMATCH);
						break;
					}

					tkn.Values.push(tknIndex);
				}

			}

		}

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
		const paramNone: CmdParam = this.CreateParam(0, [], null);
		this.AddCommand(Tokentype.cmd, "close", "clO", 160);
		this.AddCommand(Tokentype.cmd, "clr", "cL", 156, paramNone, this.Cmd_Clr.bind(this));
		this.AddCommand(Tokentype.cmd, "cont", "cO", 154);
		this.AddCommand(Tokentype.cmd, "cmd", "cM", 157);
		this.AddCommand(Tokentype.cmd, "data", "dA", 131, this.CreateParam(0, [ParamType.any], this.Param_Data.bind(this)), this.Cmd_Data.bind(this)); // Note: on run grab data lines and link tokens to the data[] in memory
		this.AddCommand(Tokentype.cmd, "def", "dE", 150);
		this.AddCommand(Tokentype.cmd, "dim", "dI", 134);
		this.AddCommand(Tokentype.cmd, "end", "eN", 128);
		this.AddCommand(Tokentype.cmd, "for", "fO", 129);
		this.AddCommand(Tokentype.cmd, "get", "gE", 161);
		this.AddCommand(Tokentype.cmd, "get#", "", [161, 35]);
		this.AddCommand(Tokentype.cmd, "gosub", "goS", 141);
		this.AddCommand(Tokentype.cmd, "goto", "gO", 137);
		this.AddCommand(Tokentype.cmd, "if", "", 139, this.CreateParam(2, [ParamType.num, ParamType.cmd], this.Param_If.bind(this)), this.Cmd_If.bind(this));
		this.AddCommand(Tokentype.cmd, "input", "", 133);
		this.AddCommand(Tokentype.cmd, "input#", "iN", 132);
		this.AddCommand(Tokentype.cmd, "let", "lE", 136, this.CreateParam(2, [ParamType.var, ParamType.any], null, "="), this.Cmd_Let.bind(this));
		this.AddCommand(Tokentype.cmd, "list", "lI", 155);
		this.AddCommand(Tokentype.cmd, "load", "lA", 147);
		this.AddCommand(Tokentype.cmd, "new", "", 162);
		this.AddCommand(Tokentype.cmd, "next", "nE", 130);
		this.AddCommand(Tokentype.cmd, "on", "", 145);
		this.AddCommand(Tokentype.cmd, "open", "oP", 159);
		this.AddCommand(Tokentype.cmd, "poke", "pO", 151, this.CreateParam(2, [ParamType.adr, ParamType.byte], null, ","), this.Cmd_Poke.bind(this));
		this.AddCommand(Tokentype.cmd, "print", "?", 153, this.CreateParam(0, [ParamType.any], this.Param_Print.bind(this)), this.Cmd_Print.bind(this));
		this.AddCommand(Tokentype.cmd, "print#", "pR", 152);
		this.AddCommand(Tokentype.cmd, "read", "rE", 135, this.CreateParam(-1, [ParamType.var]), this.Cmd_Read.bind(this));
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
		const paramNum: CmdParam = this.CreateParam(1, [ParamType.num], this.Param_Functions.bind(this));
		const paramStr: CmdParam = this.CreateParam(1, [ParamType.str], this.Param_Functions.bind(this));
		this.AddCommand(Tokentype.fnnum, "abs", "aB", 182, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "asc", "aS", 198, paramStr, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "atn", "aT", 193, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "cos", "", 190, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "exp", "eX", 189, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "fn", "", 165, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "fre", "fR", 184, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "int", "", 181, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "len", "", 195, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "log", "", 188, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "peek", "pE", 194, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "pos", "", 185, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "rnd", "rN", 187, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "sgn", "sG", 180, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "sin", "sI", 191, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "sqr", "sQ", 186, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "tan", "", 192, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "usr", "uS", 183, paramNum, this.FnNum.bind(this));
		this.AddCommand(Tokentype.fnnum, "val", "vA", 197, paramStr, this.FnNum.bind(this));

		//
		// fn str
		//
		const paramStrNum: CmdParam = this.CreateParam(2, [ParamType.str, ParamType.byte], this.Param_Functions.bind(this));
		this.AddCommand(Tokentype.fnstr, "chr$", "cH", 199, paramNum, this.FnStr.bind(this));
		this.AddCommand(Tokentype.fnstr, "left$", "leF", 200, paramStrNum, this.FnStr.bind(this));
		this.AddCommand(Tokentype.fnstr, "mid$", "mI", 202, this.CreateParam(-2, [ParamType.str, ParamType.byte, ParamType.byte], this.Param_Functions.bind(this)), this.FnStr.bind(this));
		this.AddCommand(Tokentype.fnstr, "right$", "rI", 201, paramStrNum, this.FnStr.bind(this));
		this.AddCommand(Tokentype.fnstr, "str$", "stR", 196, paramNum, this.FnStr.bind(this));

		//
		// fn out
		//
		const paramFnOut: CmdParam = this.CreateParam(1, [ParamType.byte], this.Param_Functions.bind(this));
		this.AddCommand(Tokentype.fnout, "spc(", "sP", 166, paramFnOut);
		this.AddCommand(Tokentype.fnout, "tab(", "tA", 163, paramFnOut);

		//
		// ops
		//
		const paramOpsNum: CmdParam = this.CreateParam(2, [ParamType.num, ParamType.num]);
		const paramOpsAny: CmdParam = this.CreateParam(2, [ParamType.any, ParamType.same]);
		this.AddCommand(Tokentype.ops, "and", "aN", 175, paramOpsNum, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "or", "", 176, paramOpsNum, this.Ops.bind(this));

		this.AddCommand(Tokentype.ops, "=", "", 61, paramOpsAny, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "<>", "", [60, 62], paramOpsAny, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "<=", "", [60, 61], paramOpsAny, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, ">=", "", [62, 61], paramOpsAny, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "<", "", 60, paramOpsAny, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, ">", "", 62, paramOpsAny, this.Ops.bind(this));

		this.AddCommand(Tokentype.ops, "^", "", 94, paramOpsNum, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "*", "", 42, paramOpsNum, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "/", "", 47, paramOpsNum, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "+", "", 43, paramOpsAny, this.Ops.bind(this));
		this.AddCommand(Tokentype.ops, "-", "", 45, paramOpsNum, this.Ops.bind(this));

		//
		// unary ops
		this.AddCommand(Tokentype.not, "not", "nO", 168, paramNum, this.UnaryOps.bind(this));
		this.AddCommand(Tokentype.not, "-", "", 45, paramNum, this.UnaryOps.bind(this));

		//
		// sysvar / const
		//
		this.AddCommand(Tokentype.sysvar, "{pi}", "", 255);
		this.AddCommand(Tokentype.sysvar, "st", "", -1);
		this.AddCommand(Tokentype.sysvar, "ti", "", -1);
		this.AddCommand(Tokentype.sysvar, "ti$", "", -1);

		//
		// variables
		//
		this.AddCommand(Tokentype.vnum, "", "", -1, null, this.GetVar.bind(this));
		this.AddCommand(Tokentype.vint, "", "", -1, null, this.GetVar.bind(this));
		this.AddCommand(Tokentype.vstr, "", "", -1, null, this.GetVar.bind(this));
		this.AddCommand(Tokentype.anum, "", "", -1, null, this.GetVar.bind(this));
		this.AddCommand(Tokentype.aint, "", "", -1, null, this.GetVar.bind(this));
		this.AddCommand(Tokentype.astr, "", "", -1, null, this.GetVar.bind(this));

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
	private AddCommand(type: Tokentype, name: string, short: string, code: number | number[], param?: CmdParam | Function, fn?: Function): number {

		const id: number = this.m_BasicCmds.length;

		let cmd: BasicCmd = {
			Type: type,
			Name: name,
			Abbrv: short,
			TknId: (typeof code === "number") ? [code] : code,
			Param: null
		}

		//
		// no param or null, create it
		if (typeof param === "undefined" || param === null) {
			cmd.Param = this.CreateParam(0, [ParamType.any], null);

		} else {

			// param is a (splitter) function
			if (typeof param === "function") {
				cmd.Param = this.CreateParam(0, [ParamType.any], param);

			} else {
				cmd.Param = param;
			}
		}

		//
		// set runner method
		if (typeof fn !== "undefined") {
			cmd.Fn = fn;
		} else {
			cmd.Fn = (tkn: G64Token) => { return Tools.CreateToken(Tokentype.err, "no runner", ErrorCodes.SYNTAX); }
		}

		// add to lists
		switch (type) {
			case Tokentype.cmd:
				this.m_lstCmd.push(id);
				break;

			case Tokentype.fnnum:
			case Tokentype.fnstr:
			case Tokentype.fnout:
				this.m_lstFn.push(id);
				break;

			case Tokentype.ops:
				this.m_lstOps.push(id);
				break;

			case Tokentype.not:
				this.m_lstUnary.push(id);
				break;

			case Tokentype.vnum:
			case Tokentype.vint:
			case Tokentype.vstr:
			case Tokentype.anum:
			case Tokentype.aint:
			case Tokentype.astr:
				this.m_mapVar.set(type, id);
				break;
		}

		this.m_BasicCmds.push(cmd);
		this.m_mapCmd.set(name, id);

		this.m_mapAbbrv.set(short, id);

		return id;
	}

	private CreateParam(len: number, type: ParamType[], fn?: Function, split?: string): CmdParam {

		const param: CmdParam = {
			Len: len,
			Type: type,
			Split: ",",
		}

		if (typeof fn !== "undefined" && fn !== null) {
			param.Fn = fn;
		} else {
			param.Fn = (cmd: BasicCmd, param: string): string[] => {
				if (cmd.Param.Split === "")
					return [param];

				return Tools.CodeSplitter(param, cmd.Param.Split);
			};
		}


		if (typeof split !== "undefined") {
			param.Split = split;
		}

		return param;
	}

	/**
	 * built regexes for all commands
	 */
	private BuiltRegex(): void {

		//
		// built regex of all commands / fns
		let cmd: string[] = [];
		let fn: string[] = [];
		let ops: string[] = [];

		let abbrv: string[] = [];
		let deabbrv: string[] = [];


		for (let i: number = 0; i < this.m_BasicCmds.length; i++) {

			const name: string = Tools.EscapeRegex(this.m_BasicCmds[i].Name);

			switch (this.m_BasicCmds[i].Type) {
				case Tokentype.cmd:
					cmd.push(name);
					break;

				case Tokentype.fnnum:
				case Tokentype.fnstr:
				case Tokentype.fnout:
					fn.push(name);
					break;

				case Tokentype.ops:
					ops.push(Tools.EscapeRegex(this.m_BasicCmds[i].Name));
					break;
			}

			if (this.m_BasicCmds[i].Abbrv !== "") {
				abbrv.push(Tools.EscapeRegex(this.m_BasicCmds[i].Abbrv));
				deabbrv.push(name);
			}

		}

		this.m_fnNames = fn.join("|");

		// let is an extra ugly special case, temp add it here
		const letRegexString: string = "(?:let\\s*)?(?:\\w+\\d?[%$]?(?:\\(.+\\))?\\s*=.*)";
		this.m_regexLet = new RegExp("^" + letRegexString);
		cmd.push(letRegexString);

		this.m_regexCmd = new RegExp("^(" + cmd.join("|") + ")", "g");
		this.m_regexFn = new RegExp("^(" + this.m_fnNames + ")", "g");
		this.m_regexOps = new RegExp("(" + ops.join("|") + ")", "g");

		this.m_regexNum = /^(?:[-\+]?(?:\d*\.)?\d+(?:e[-\+]?\d+)?|\$[0-9a-f]+|\%[01]+)$/; // numbers, inc. hex $xx and $xxxx, bin %xxxxxxxx
		this.m_regexVar = /^([a-zA-Z]+\d*[$%]?)(\(.+\))?$/; // variables, inc. arrays
		this.m_regexLit = /^{\d+}$/; // literals

		this.m_regexAbbrv = new RegExp("(" + abbrv.join("|") + ")", "g");
		this.m_regexDeAbbrv = new RegExp("(" + deabbrv.join("|") + ")", "g");



	}


	//#endregion

	//#region " ----- Param Splitters ----- "

	private Param_Data(cmd: BasicCmd, param: string): string[] {

		param = param.trim();

		let aParts: string[] = Tools.CodeSplitter(param, ",");
		let aData: string[] = [];

		for (let i: number = 0; i < aParts.length; i++) {

			aParts[i] = aParts[i].trim();

			// numbers
			if (this.m_regexNum.test(aParts[i].trim())) {
				aData.push(aParts[i]);

			} else {
				if (aParts[i].includes("{") && aParts[i].includes("{")) {
					if (!this.m_regexLit.test(aParts[i])) {
						const text: string = Tools.RestoreLiterals(aParts[i], this.m_ParserLiterals);
						const lit: string = /.*{(\d+)}.*/.exec(aParts[i])[1];
						aParts[i] = "{" + lit + "}";
						this.m_ParserLiterals[lit] = text;
					}
					
				} else {
					aParts[i] = "{" + this.m_ParserLiterals.length + "}";
					this.m_ParserLiterals.push(aParts[i]);
				}
				aData.push(aParts[i]);
			}
		}

		return aData;
	}

	private Param_Functions(cmd: BasicCmd, param: string): string[] {

		// fnout has the barcket as part of the command, so we add a start (
		if (cmd.Type == Tokentype.fnout) {
			param = "(" + param;
		}

		// remove brackets
		if (param.startsWith("(") && param.endsWith(")")) {
			const result: Matching = Tools.FindMatching(param);
			if (result.Has) {
				param = param.substring(1, param.length - 1);
			}
		}

		return Tools.CodeSplitter(param, ",");
	}

	private Param_If(cmd: BasicCmd, param: string): string[] {

		const match: string[] = param.match(/^\s*(.+)(?:then|goto)(.+)/);
		let split: string[] = [];

		if (match !== null) {

			// remove full match from array 
			match.shift();

			if (/^\s*\d+$/.test(match[1])) {
				split = [match[0].trim(), "goto " + parseInt(match[2]).toString()];
			} else {
				split = [match[0].trim(), match[1].trim()];
			}
		}

		return split;
	}

	private Param_Print(cmd: BasicCmd, code: string): string[] {

		let i: number, j: number;
		let aParts: string[] = [], aFirst: string[] = [], aSecond: string[] = [];
		let match: RegExpMatchArray;
		let hasMatch: boolean;


		// check for "," andf then for ";"
		aFirst = Tools.CodeSplitter(code, ",");
		for (i = 0; i < aFirst.length; i++) {
			aSecond = Tools.CodeSplitter(aFirst[i], ";");
			for (j = 0; j < aSecond.length; j++) {
				aParts.push(aSecond[j]);
				if (j < aSecond.length - 1) aParts.push(";");
			}
			if (i < aFirst.length - 1) aParts.push(",");
		}

		// remove space between numbers (1 2 => 12) and between number variables and numbers (A 2 => A2)
		for (i = 0; i < aParts.length; i++) {
			hasMatch = true;
			while (hasMatch) {
				match = new RegExp(/(\d+|[a-zA-Z]+\d*)\s+(\d+)/).exec(aParts[i]);
				if (match !== null) {
					aParts[i] = aParts[i].replace(match[0], match[1] + match[2]);
				} else {
					hasMatch = false;
				}
			}
		}

		// split before functions if they are preceeded by ), ], }, number or letter
		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			hasMatch = true;
			while (hasMatch) {
				match = new RegExp("(.*[\\)\\]\\}0-9a-aA-Z]\s*)((?:" + this.m_fnNames + ").*)").exec(aFirst[i]);

				if (match !== null) {
					aParts.push(match[1]);
					aFirst[i] = match[2];
				} else {
					aParts.push(aFirst[i]);
					hasMatch = false;
				}
			}
		}

		// split before literals, except when used in a compare statement or ops or functions (error)
		aFirst = aParts.slice();
		aParts.length = 0;
		for (i = 0; i < aFirst.length; i++) {
			hasMatch = true;
			while (hasMatch) {
				match = new RegExp(/(.*[^\+\-\*\/\^=\<\>\(])\s*(\{\d+}.*)/).exec(aFirst[i]);

				if (!this.m_regexFn.test(aFirst[i]) && match !== null && match[1] !== "not") { // not is a special case, todo: move to regex
					aParts.push(match[1]);
					aFirst[i] = match[2];
				} else {
					aParts.push(aFirst[i]);
					hasMatch = false;
				}
			}
		}

		// remove empty elements from aParts array
		for (i = 0; i < aParts.length; i++) {
			if (aParts[i].length === 0) {
				aParts.splice(i, 1);
				i--;
			}
		}

		return aParts;
	}

	//#endregion

	//#region " ----- BASIC V2 Commands / Functions ----- "

	/**
	 * clears all variables and stacks
	 * see: https://www.c64-wiki.de/wiki/CLR
	 */
	private Cmd_Clr(tkn: G64Token): G64Token {
		this.m_Memory.Clear();
		return Tools.CreateToken(Tokentype.nop);
	}

	/**
	 * DATA command, ie. data for a program
	 * see: https://www.c64-wiki.de/wiki/DATA
	 */
	private Cmd_Data(tkn: G64Token): G64Token {
		return Tools.CreateToken(Tokentype.nop);
	}

	/**
	 * if command, ie. if a condition is true, execute the next command
	 * see: https://www.c64-wiki.de/wiki/IF
	 */
	private Cmd_If(tkn: G64Token): G64Token {

		const tknComp: G64Token = this.ExecToken(tkn.Values[0]);

		if (tknComp.Type === Tokentype.err)
			return tknComp;

		if (tknComp.Num != 0) {
			// result is true, excute next command
			return this.ExecToken(tkn.Values[1]);
		}

		// result is false, return an EOL

		return Tools.CreateToken(Tokentype.eol);
	}

	/**
	 * let command, ie. assign a value to a variable
	 * see: https://www.c64-wiki.de/wiki/LET
	 */
	private Cmd_Let(tkn: G64Token): G64Token {

		const tknVar: G64Token = this.ExecToken(tkn.Values[0]);
		const tknVal: G64Token = this.ExecToken(tkn.Values[1]);

		if (tknVar.Type === Tokentype.err)
			return tknVar;

		if (tknVal.Type === Tokentype.err)
			return tknVal;

		if (Check.IsSame(tknVar, tknVal)) {

			if (Check.IsStr(tkn.Values[0])) {
				tknVar.Str = tknVal.Str;
			} else {
				tknVar.Num = (Check.IsInt(tknVar)) ? Math.floor(tknVal.Num) : tknVal.Num;
			}

			return tknVar;
		}

		return Tools.CreateToken(Tokentype.err,
			"'let', value expected: " + Tools.GetTokentypeName(Check.GetBaseType(tknVar)) + ", got: " + Tools.GetTokentypeName(Check.GetBaseType(tknVal)) + ".",
			ErrorCodes.TYPE_MISMATCH);

	}

	/**
	 * poke command, ie. write a value to a memory address
	 * see: https://www.c64-wiki.de/wiki/POKE
	 */
	private Cmd_Poke(tkn: G64Token): G64Token {

		const tknAdr: G64Token = this.ExecToken(tkn.Values[0]);
		const tknVal: G64Token = this.ExecToken(tkn.Values[1]);

		if (tknAdr.Type === Tokentype.err)
			return tknAdr;

		if (tknVal.Type === Tokentype.err)
			return tknVal;

		if (Check.IsAdr(tknAdr) && Check.IsByte(tknVal)) {
			this.m_Memory.Poke(Math.floor(tknAdr.Num), Math.floor(tknVal.Num));
			return tknVal;
		}

		// ToDo: add detail error hint.
		return Tools.CreateToken(Tokentype.err, "'poke', invalid address or value", ErrorCodes.ILLEGAL_QUANTITY);
	}

	/**
	 * print command, ie. print a value to the screen
	 * see: https://www.c64-wiki.de/wiki/PRINT
	 */
	private Cmd_Print(tkn: G64Token): G64Token {

		let out: string = "";
		let crlf: boolean = true;

		for (let i: number = 0; i < tkn.Values.length; i++) {

			if (tkn.Values[i].Type === Tokentype.link) {
				if (tkn.Values[i].Str == ",") {
					// this.m_memory.WriteLine("           ".substr(0, 10 - (this.m_memory.GetByte(this.m_memory.ADR_CRSR_X) % 10)), false);
					out += "           ".substring(0, 10 - (out.length % 10));
				} else {
					// nop
				}

				if (i == tkn.Values.length - 1)
					crlf = false;

			} else if (tkn.Values[i].Type === Tokentype.fnout) {
				if (tkn.Values[i].Id === this.m_mapCmd.get("tab(")) {
					out += " ".repeat(tkn.Values[i].Values[0].Num);
				} else {
					out += " ".repeat(tkn.Values[i].Values[0].Num);
				}

				// nop
				if (i == tkn.Values.length - 1)
					crlf = false;

			} else {

				const tknVal: G64Token = this.ExecToken(tkn.Values[i]);

				if (tknVal.Type === Tokentype.err)
					return tknVal;

				if (Check.IsStr(tknVal)) {
					out += tknVal.Str;
				} else if (Check.IsNum(tknVal)) {
					out += Tools.NumberToString(tknVal.Num);
				}
			}
		}

		console.log("PRINT:", out);

		return tkn;
	}

	/**
	 * read command, ie. read a value from the data stack
	 * see: https://www.c64-wiki.de/wiki/READ
	 */
	private Cmd_Read(tkn: G64Token): G64Token {

		console.log("read:", tkn.Values);

		for (let i: number = 0; i < tkn.Values.length; i++) {
			if (Check.IsVar(tkn.Values[i])) {
				// read from data stack
				const tknVar: G64Token = this.ExecToken(tkn.Values[i]);

				if (tknVar.Type === Tokentype.err)
					return tknVar;

				console.log("--> reading:", tknVar);
			} else {

				return Tools.CreateToken(Tokentype.err, "'read', variable expected, got " + Tools.GetTokentypeName(Check.GetBaseType(tkn.Values[i])), ErrorCodes.SYNTAX);

			}

		}


		return tkn;
	}

	//
	// --- fns, ops ---
	//

	/**
	 * all numerical functions
	 */
	private FnNum(tkn: G64Token): G64Token {

		const tknVal: G64Token = this.ExecToken(tkn.Values[0]);
		tkn.Num = 0;

		if (tknVal.Type === Tokentype.err)
			return tknVal;

		switch (tkn.Name) {
			case "abs":
				tkn.Num = Math.abs(tknVal.Num);
				break;

			case "asc":
				const bytes: number[] = Petscii.BasToPet(tknVal.Str);
				if (bytes.length > 0) {
					tkn.Num = bytes[0];
				} else {
					return Tools.CreateToken(Tokentype.err, "'asc', in basic v2 the string cannot be empty", ErrorCodes.ILLEGAL_QUANTITY);
				}
				break;

			case "atn":
				tkn.Num = Math.atan(tknVal.Num);
				break;

			case "cos":
				tkn.Num = Math.cos(tknVal.Num);
				break;

			case "exp":
				tkn.Num = Math.exp(tknVal.Num);
				break;

			case "fn":
				// ToDo: implement FN
				console.log("FnNum: to be supplied FN");
				break;

			case "fre":
				// ToDo: implement FRE (count tokens?)
				console.log("FnNum: to be supplied FRE");
				break;

			case "int":
				tkn.Num = Math.floor(tknVal.Num);
				break;

			case "len":
				tkn.Num = Petscii.BasToPet(tknVal.Str).length;
				break;

			case "log":
				tkn.Num = Math.log(tknVal.Num);
				break;

			case "peek":
				if (Check.IsAdr(tknVal)) {
					tkn.Num = this.m_Memory.Peek(Math.floor(tknVal.Num));
				} else {
					return Tools.CreateToken(Tokentype.err, "'peek', invalid address", ErrorCodes.ILLEGAL_QUANTITY);
				}
				break;

			case "pos":
				// Todo: implement POS
				console.log("FnNum: to be supplied POS");
				break;

			case "rnd":
				tkn.Num = Math.random() * tknVal.Num;
				console.log("rnd, add mersenne twister");
				break;

			case "sgn":
				tkn.Num = (tknVal.Num < 0) ? -1 : (tknVal.Num > 0) ? 1 : 0;
				break;

			case "sin":
				tkn.Num = Math.sin(tknVal.Num);
				break;

			case "sqr":
				tkn.Num = Math.sqrt(tknVal.Num);
				break;

			case "tan":
				tkn.Num = Math.tan(tknVal.Num);
				break;

			case "usr":
				// ToDo: implement USR
				console.log("FnNum: to be supplied USR");
				break;

			case "val":
				const num = parseFloat(tknVal.Str.replace(/\s+/g, ""));
				if (!isNaN(num))
					tkn.Num = num;
				break;
		}

		return tkn;
	}

	private FnStr(tkn: G64Token): G64Token {

		const tknVal: G64Token = this.ExecToken(tkn.Values[0]);

		tkn.Str = "";

		if (tknVal.Type === Tokentype.err)
			return tknVal;

		if (tkn.Name === "chr$") {
			tkn.Str = Petscii.PetToBas([tknVal.Num]);

		} else if (tkn.Name === "str$") {
			tkn.Str = tknVal.Num.toString(); // toPrecision(8); <- use with print

		} else {
			const bytes: number[] = Petscii.BasToPet(tknVal.Str);
			const tknValB: G64Token = this.ExecToken(tkn.Values[1]);

			if (tknValB.Type === Tokentype.err)
				return tknValB;

			if (tkn.Name === "left$") {
				tkn.Str = Petscii.PetToBas(bytes.slice(0, tknValB.Num));

			} else if (tkn.Name === "right$") {
				tkn.Str = Petscii.PetToBas(bytes.slice(-tknValB.Num));

			} else {
				let len: number = bytes.length - 1;

				if (tknValB.Num < 1)
					return Tools.CreateToken(Tokentype.err, "'mid$', start must be greater than 0", ErrorCodes.ILLEGAL_QUANTITY);

				if (tkn.Values.length === 3) {
					const tknValC: G64Token = this.ExecToken(tkn.Values[2]);

					if (tknValC.Type === Tokentype.err)
						return tknValC;

					len = tknValC.Num;
				}

				tkn.Str = Petscii.PetToBas(bytes.slice(tknValB.Num - 1, tknValB.Num + len));
			}
		}

		return tkn;
	}

	/**
	 * ops, ie. +, -, *, /, etc.
	 * see: https://www.c64-wiki.de/wiki/Operatoren
	 */
	private Ops(tkn: G64Token): G64Token {

		const tknValA: G64Token = this.ExecToken(tkn.Values[0]);
		const tknValB: G64Token = this.ExecToken(tkn.Values[1]);

		switch (tkn.Name) {
			case "and":
				tkn.Num = (tknValA.Num & tknValB.Num);
				break;

			case "or":
				tkn.Num = (tknValA.Num | tknValB.Num);
				break;

			case "=":
				if (Check.IsNum(tknValA)) {
					tkn.Num = (tknValA.Num === tknValB.Num) ? -1 : 0;
				} else {
					tkn.Num = (tknValA.Str === tknValB.Str) ? -1 : 0;
				}
				break;

			case "<>":
			case "!=":
				if (Check.IsNum(tknValA)) {
					tkn.Num = (tknValA.Num !== tknValB.Num) ? -1 : 0;
				} else {
					tkn.Num = (tknValA.Str !== tknValB.Str) ? -1 : 0;
				}
				break;

			case "<=":
				if (Check.IsNum(tknValA)) {
					tkn.Num = (tknValA.Num <= tknValB.Num) ? -1 : 0;
				} else {
					tkn.Num = (tknValA.Str <= tknValB.Str) ? -1 : 0;
				}
				break;

			case ">=":
				if (Check.IsNum(tknValA)) {
					tkn.Num = (tknValA.Num >= tknValB.Num) ? -1 : 0;
				} else {
					tkn.Num = (tknValA.Str >= tknValB.Str) ? -1 : 0;
				}
				break;

			case "<":
				if (Check.IsNum(tknValA)) {
					tkn.Num = (tknValA.Num < tknValB.Num) ? -1 : 0;
				} else {
					tkn.Num = (tknValA.Str < tknValB.Str) ? -1 : 0;
				}
				break;

			case ">":
				if (Check.IsNum(tknValA)) {
					tkn.Num = (tknValA.Num > tknValB.Num) ? -1 : 0;
				} else {
					tkn.Num = (tknValA.Str > tknValB.Str) ? -1 : 0;
				}
				break;

			case "^":
				tkn.Num = Math.pow(tknValA.Num, tknValB.Num);
				break;

			case "*":
				tkn.Num = tknValA.Num * tknValB.Num;
				break;

			case "/":
				if (tknValB.Num === 0) {
					return Tools.CreateToken(Tokentype.err, "division by zero", ErrorCodes.DIVISION_BY_ZERO);
				}
				tkn.Num = tknValA.Num / tknValB.Num;
				break;

			case "+":
				if (Check.IsNum(tknValA)) {
					tkn.Num = tknValA.Num + tknValB.Num;
				} else {
					tkn.Type = Tokentype.str;
					tkn.Str = tknValA.Str + tknValB.Str;
				}
				break;

			case "-":
				tkn.Num = tknValA.Num - tknValB.Num;
				break;
		}

		return tkn;
	}

	/**
	 * unary ops, ie. not, -
	 * see: https://www.c64-wiki.de/wiki/Operatoren
	 */
	private UnaryOps(tkn: G64Token): G64Token {

		const tknVal: G64Token = this.ExecToken(tkn.Values[0]);

		switch (tkn.Name) {
			case "not":
				tkn.Num = -tknVal.Num - 1;
				break;

			case "-":
				tkn.Num = -tknVal.Num;
				break;
		}

		return tkn;
	}

	//
	// --- vars / sysvars ---
	//
	private GetVar(tkn: G64Token): G64Token {
		return this.m_Memory.Variable(tkn);
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