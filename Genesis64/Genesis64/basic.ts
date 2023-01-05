
enum CmdType {
	cmd		/*  0, commands, PRINT */,
	fnum	/*  1, numerical method, SIN */,
	fstr	/*  2, string method, LEFT$ */,
	fout	/*  3, output method, SPC */,
	ops		/*  4, operators, +,- */
}

enum Tokentype {
	nop		/*  0, nop / rem */,
	cmd		/*  1, commands, PRINT */,
	ops		/*  2, operators, +, -, ... */,
	fnnum	/*  3, numercal methods, SIN(i) */,
	fnstr	/*  4, string methods, LEFT$("", i) */,
	fnout	/*  5, output methods, SPC(i) */,
	num		/*  6, a single number, 1.0 */,
	int		/*  7, an interger, 1 */,
	str		/*  8, string, either {1} or "abc" */,
	vnum	/*  9, num var, A */,
	vint	/* 10, int var, A% */,
	vstr	/* 11, str var, A$ */,
	anum	/* 12, num array, A[x] */,
	aint	/* 13, int array, A%[x] */,
	astr	/* 14, string array, A$[x] */,
	link	/* 15, print links: spc, "," and ";" */,
	comp	/* 16, compare: <, == ... */,
	err		/* 17, if something couldn't be parsed, id == syntax error */,
	eop		/* 18, token exec ok, end of part */,
	run		/* 19, token exec ok, end of line */,
	jmp		/* 20, jump (goto, gosub, etc) */,
	end		/* 21, prg ends here */,
	list	/* 22, list command loop */,
	input	/* 23, allow input */
}

interface BasicCmd {
	name: string;
	abbrv: string;
	tkn: number;
	type: CmdType;
	reg?: string;
}

class Basic {

	//#region " ----- Privates ----- "

	//#endregion

	public static Commands: BasicCmd[] = [

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
		{ name: "get#", abbrv: "", reg: "get\\#", tkn: 161 /*161 35*/, type: CmdType.cmd },
		{ name: "gosub", abbrv: "goS", tkn: 141, type: CmdType.cmd },
		{ name: "goto", abbrv: "gO", tkn: 137 /*203 164*/, type: CmdType.cmd },
		{ name: "if", abbrv: "", tkn: 139, type: CmdType.cmd },
		{ name: "input", abbrv: "", tkn: 133, type: CmdType.cmd },
		{ name: "input#", abbrv: "iN", reg: "input\\#", tkn: 132, type: CmdType.cmd },
		{ name: "let", abbrv: "lE", tkn: 136, type: CmdType.cmd },
		{ name: "list", abbrv: "lI", tkn: 155, type: CmdType.cmd },
		{ name: "load", abbrv: "lO", tkn: 147, type: CmdType.cmd },
		{ name: "new", abbrv: "", tkn: 162, type: CmdType.cmd },
		{ name: "next", abbrv: "nE", tkn: 130, type: CmdType.cmd },
		{ name: "on", abbrv: "", tkn: 145, type: CmdType.cmd },
		{ name: "open", abbrv: "oP", tkn: 159, type: CmdType.cmd },
		{ name: "poke", abbrv: "pO", tkn: 151, type: CmdType.cmd },
		{ name: "print", abbrv: "?", tkn: 153, type: CmdType.cmd },
		{ name: "print#", abbrv: "pR", reg: "print\\#", tkn: 152, type: CmdType.cmd },
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
		// =,<,>,<=,=>,==
		// ST, STATUS, TI, TIME, TI$, TIME$

	];


}
