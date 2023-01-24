
//#region " ----- Interfaces / Enums / Types ----- "

enum BasicVersion {
	v2, g64
}

type G64BasicOptions = {
	basicVersion: BasicVersion;
}

enum CmdType {
	cmd		/*  0, commands, PRINT */,
	fnum	/*  1, numerical method, SIN */,
	fstr	/*  2, string method, LEFT$ */,
	fout	/*  3, output method, SPC */,
	ops		/*  4, operators, +,- */,
	comp	/*  5, compare =, <= ... */
}

enum Tokentype {
	nop		/*  0, nop / rem */,
	err		/*  1, if something couldn't be parsed, id == syntax error */,
	cmd		/*  2, commands, PRINT */,
	fnnum	/*  3, numercal methods, SIN(i) */,
	fnstr	/*  4, string methods, LEFT$("", i) */,
	fnout	/*  5, output methods, SPC(i) */,
	ops		/*  6, operators, +, -, ... */,
	comp	/*  7, compare: <, == ... */,
	num		/*  8, a single number, 1.0 */,
	int		/*  9, an interger, 1 */,
	str		/* 10, string, either {1} or "abc" */,
	vnum	/* 11, num var, A */,
	vint	/* 12, int var, A% */,
	vstr	/* 13, str var, A$ */,
	anum	/* 14, num array, A[x] */,
	aint	/* 15, int array, A%[x] */,
	astr	/* 16, string array, A$[x] */,
	link	/* 17, print links: spc, "," and ";" */,
	eop		/* 18, token exec ok, end of part */,
	run		/* 19, token exec ok, end of line */,
	jmp		/* 20, jump (goto, gosub, etc) */,
	end		/* 21, prg ends here */
}

type Token = {
	Type: Tokentype;
	Id: number;				// basic cmd/fn/error id
	Data?: number;			// if sub token, the id of the cmd

	Name?: string;			// if var, stores var's name

	Order?: number;			// this will remove the need for the token order array

	Num?: number;			// number data
	Str?: string;			// string data
	Values?: Array<Token>;	// ref to token array

	Fn?: Function;			// pointer to exec method
}

type BasicCmd = {
	name: string;
	abbrv: string;
	tkn: number;
	type: CmdType;
	reg?: string | RegExp;
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

	private m_Options: G64BasicOptions;

	//#endregion

	//#region " ----- Publics ----- "

	public get Commands(): BasicCmd[] { return this.m_Commands; }
	public get Version(): BasicVersion { return this.m_Options.basicVersion; }

	//#endregion

	//#region " ----- Regex ----- "

	private regexLineNr: RegExp = /^\s*(\d*)\s*(.*)\s*/;
	private regexArrayStart: RegExp = /[_a-z]+[_a-z0-9]*[$%]?\s*\(/g;
	private regexCmd: RegExp;
	private regexFn: RegExp;

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
			{ name: "get#", abbrv: "", tkn: 161 /*161 35*/, type: CmdType.cmd, reg: "get\\#" },
			{ name: "gosub", abbrv: "goS", tkn: 141, type: CmdType.cmd },
			{ name: "goto", abbrv: "gO", tkn: 137 /*203 164*/, type: CmdType.cmd },
			{ name: "if", abbrv: "", tkn: 139, type: CmdType.cmd },
			{ name: "input", abbrv: "", tkn: 133, type: CmdType.cmd },
			{ name: "input#", abbrv: "iN", tkn: 132, type: CmdType.cmd, reg: "input\\#" },
			{ name: "let", abbrv: "lE", tkn: 136, type: CmdType.cmd },
			{ name: "list", abbrv: "lI", tkn: 155, type: CmdType.cmd },
			{ name: "load", abbrv: "lO", tkn: 147, type: CmdType.cmd },
			{ name: "new", abbrv: "", tkn: 162, type: CmdType.cmd },
			{ name: "next", abbrv: "nE", tkn: 130, type: CmdType.cmd },
			{ name: "on", abbrv: "", tkn: 145, type: CmdType.cmd },
			{ name: "open", abbrv: "oP", tkn: 159, type: CmdType.cmd },
			{ name: "poke", abbrv: "pO", tkn: 151, type: CmdType.cmd },
			{ name: "print", abbrv: "?", tkn: 153, type: CmdType.cmd },
			{ name: "print#", abbrv: "pR", tkn: 152, type: CmdType.cmd, reg: "print\\#" },
			{ name: "read", abbrv: "rE", tkn: 135, type: CmdType.cmd },
			{ name: "rem", abbrv: "", tkn: 143, type: CmdType.cmd },
			{ name: "restore", abbrv: "reS", tkn: 140, type: CmdType.cmd },
			{ name: "return", abbrv: "reT", tkn: 142, type: CmdType.cmd },
			{ name: "run", abbrv: "rU", tkn: 138, type: CmdType.cmd },
			{ name: "save", abbrv: "sA", tkn: 148, type: CmdType.cmd },
			{ name: "stop", abbrv: "sT", tkn: 144, type: CmdType.cmd },
			{ name: "step", abbrv: "stE", tkn: 169, type: CmdType.cmd },
			{ name: "sys", abbrv: "sY", tkn: 158, type: CmdType.cmd },
			{ name: "then", abbrv: "tH", tkn: 167, type: CmdType.cmd },
			{ name: "to", abbrv: "", tkn: 164, type: CmdType.cmd },
			{ name: "verify", abbrv: "vE", tkn: 149, type: CmdType.cmd },
			{ name: "wait", abbrv: "wA", tkn: 146, type: CmdType.cmd },

			//
			// ----- fn num -----
			{ name: "abs", abbrv: "aB", tkn: 182, type: CmdType.fnum },
			{ name: "asc", abbrv: "aS", tkn: 198, type: CmdType.fnum },
			{ name: "atn", abbrv: "aT", tkn: 193, type: CmdType.fnum },
			{ name: "cos", abbrv: "", tkn: 190, type: CmdType.fnum },
			{ name: "exp", abbrv: "eX", tkn: 189, type: CmdType.fnum },
			{ name: "fn", abbrv: "", tkn: 165, type: CmdType.fnum },
			{ name: "fre", abbrv: "fR", tkn: 184, type: CmdType.fnum },
			{ name: "int", abbrv: "", tkn: 181, type: CmdType.fnum },
			{ name: "len", abbrv: "", tkn: 195, type: CmdType.fnum },
			{ name: "log", abbrv: "", tkn: 188, type: CmdType.fnum },
			{ name: "peek", abbrv: "pE", tkn: 194, type: CmdType.fnum },
			{ name: "pos", abbrv: "", tkn: 185, type: CmdType.fnum },
			{ name: "rnd", abbrv: "rN", tkn: 187, type: CmdType.fnum },
			{ name: "sgn", abbrv: "sG", tkn: 180, type: CmdType.fnum },
			{ name: "sin", abbrv: "sI", tkn: 191, type: CmdType.fnum },
			{ name: "sqr", abbrv: "sQ", tkn: 186, type: CmdType.fnum },
			{ name: "tan", abbrv: "", tkn: 192, type: CmdType.fnum },
			{ name: "usr", abbrv: "uS", tkn: 183, type: CmdType.fnum },
			{ name: "val", abbrv: "vA", tkn: 197, type: CmdType.fnum },

			//
			// ----- fn str -----
			{ name: "chr$", abbrv: "cH", tkn: 199, reg: "chr\\$", type: CmdType.fstr },
			{ name: "left$", abbrv: "leF", tkn: 200, reg: "left\\$", type: CmdType.fstr },
			{ name: "mid$", abbrv: "mI", tkn: 202, reg: "mid\\$", type: CmdType.fstr },
			{ name: "right$", abbrv: "rI", tkn: 201, reg: "right\\$", type: CmdType.fstr },
			{ name: "str$", abbrv: "stR", tkn: 196, reg: "str\\$", type: CmdType.fstr },

			//
			// ----- fn out -----
			{ name: "spc(", abbrv: "sP", tkn: 166, reg: "spc\\(", type: CmdType.fout },
			{ name: "tab(", abbrv: "tA", tkn: 163, reg: "tab\\(", type: CmdType.fout },

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
		this.m_lstOps = [];
		this.m_lstComp = [];

		this.m_lstCmd = [];
		this.m_lstFnNum = [];
		this.m_lstFnStr = [];
		this.m_lstFnOut = [];
		this.m_lstOps = [];
		this.m_lstComp = [];

		for (let i: number = 0; i < this.m_Commands.length; i++) {
			// set regex
			if (typeof this.m_Commands[i].reg === "undefined") {
				this.m_Commands[i].reg = this.m_Commands[i].name;
			}
			//if (typeof this.m_Commands[i].reg === "string") {
			//	this.m_Commands[i].reg = new RegExp(this.m_Commands[i].reg + "\\s*(.*)");
			//	console.log(this.m_Commands[i].reg);
			//}

			if (this.m_Commands[i].type == CmdType.cmd) {
				aCmd.push(this.m_Commands[i].reg as string);
				this.m_lstCmd.push(i);
				this.m_Commands[i].reg = new RegExp("(" + this.m_Commands[i].reg + ")(.*)");
			}

			if (this.m_Commands[i].type == CmdType.fnum) {
				aFn.push(this.m_Commands[i].reg as string);
				this.m_lstFnNum.push(i);
				//this.m_Commands[i].reg = new RegExp("(" + this.m_Commands[i].reg + ")\s*(?:\().*)");
			}

			if (this.m_Commands[i].type == CmdType.fstr) {
				this.m_lstFnStr.push(i);
				aFn.push(this.m_Commands[i].reg as string);

			}

			if (this.m_Commands[i].type == CmdType.fout) {
				this.m_lstFnOut.push(i);
				aFn.push(this.m_Commands[i].reg as string);

			}

			if (this.m_Commands[i].type == CmdType.ops) {

				this.m_lstOps.push(i);
			}

			if (this.m_Commands[i].type == CmdType.comp) {
				this.m_lstComp.push(i);

			}
		}

		this.regexCmd = new RegExp("(" + aCmd.join("|") + ")");
		this.regexFn = new RegExp("(" + aFn.join("|") + ")");

	}


	//#endregion

	/**
	 * Encodes the c64 style array notation to c style () -> [] 
	 * @param	code		code piece to encode
	 * @return				string
	 **/
	private EncodeArray(code: string): string {

		let encoded: string = code;

		this.regexArrayStart.lastIndex = -1;
		if (encoded.includes("(") && encoded.includes(")")) {

			const match: string[] = code.match(this.regexArrayStart);

			if (match !== null) {
				for (let m: number = 0; m < match.length; m++) {
					let isArray: boolean = true;

					this.regexCmd.lastIndex = -1;
					this.regexFn.lastIndex = -1;
					this.regexArrayStart.lastIndex = -1;

					// skip commands 
					if (this.regexCmd.test(match[m]))
						isArray = this.regexArrayStart.test(match[m].replace(this.regexCmd, ""));

					// skip functions
					isArray = isArray && !this.regexFn.test(match[m]);

					if (isArray) {
						const tuple = CodeHelper.FindMatching(encoded, encoded.indexOf(match[m]));
						if (CodeHelper.IsMatching(tuple)) {
							encoded = encoded.substring(0, tuple[0]) + "["
								+ encoded.substring(tuple[0] + 1, tuple[1]) + "]"
								+ encoded.substring(tuple[1] + 1);
						}
					}
				}
			}
		}

		return encoded;
	}

	/**
	 * Encodes the c64 style compare = into c style ==
	 * @param	code		code to encode
	 * @return				string
	 **/
	private EncodeCompare(code: string): string {

		let encoded: string = code.replace(/=/g, "==");

		//^(let)?(?!if|for|def)\s*([a-zA-Z]+\n*[$%]?).*=

		return encoded;
	}

	public Temp(code: string): void {

		// get timeing
		console.time("temp");

		const lines: string[] = CodeHelper.CodeSplitter(code, "\n");

		//console.log(lines);

		for (let l: number = 0; l < lines.length; l++) {
			if (lines[l].trim() !== "") {
				let match: string[] = lines[l].match(this.regexLineNr);
				let lineNr: number = -1;
				let line = match[2];

				if (match[1] !== "") {
					lineNr = parseInt(match[1]);
				}

				if (line !== "") {
					// split into parts and encode
					const parts: string[] = CodeHelper.CodeSplitter(line, ":");

					for (let p: number = 0; p < parts.length; p++) {
						// de-abbrv

						// convert array () to []
						parts[p] = this.EncodeArray(parts[p]);

						// convert = to ==
						parts[p] = this.EncodeCompare(parts[p]);

						console.log(parts[p]);


					}

					// start parsing ..
					this.ParseLine(line);

				}

			}

		}

		console.timeEnd("temp");
	}

	/**
	 * Parses a line, without lineNr 
	 * @param	code	line to parse
	 **/
	private ParseLine(code: string): void {

		const parts: string[] = CodeHelper.CodeSplitter(code, ":");

		for (let p: number = 0; p < parts.length; p++) {
			this.Tokenizer(parts[p]);
		}

	}

	public Tokenizer(code: string): void {

		// code must start with with a command
		for (let i: number = 0; i < this.m_lstCmd.length; i++) {
			const match: string[] = new RegExp("(" + this.m_Commands[this.m_lstCmd[i]].reg + ")(.*)").exec(code);

			if (match !== null)
				console.log(code, match);
		}

	}
}
