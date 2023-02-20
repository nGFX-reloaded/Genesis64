enum Tokentype {
	nop     /*  0, nop / rem */,
	err     /*  1, if something couldn't be parsed, id == syntax error */,
	cmd     /*  2, commands, PRINT */,
	fnnum   /*  3, numercal methods, SIN(i) */,
	fnstr   /*  4, string methods, LEFT$("", i) */,
	fnout   /*  5, output methods, SPC(i) */,
	ops     /*  6, operators, +, -, ... */,
	comp    /*  7, compare: <, == ... */,
	num     /*  8, a single number, 1.0 */,
	str     /*  9, string, either {1} or "abc" */,
	vnum    /* 10, num var, A */,
	vint    /* 11, int var, A% */,
	vstr    /* 12, str var, A$ */,
	anum    /* 13, num array, A[x] */,
	aint    /* 14, int array, A%[x] */,
	astr    /* 15, string array, A$[x] */,
	link    /* 16, print links: spc, "," and ";" */,
	eop     /* 17, token exec ok, end of part */,
	run     /* 18, token exec ok, end of line */,
	jmp     /* 19, jump (goto, gosub, etc) */,
	end     /* 20, prg ends here */
}

type Token = {
	Type: Tokentype;
	Id: number;				// basic cmd/fn/error id
	Name?: string;			// if var, stores var's name
	Order?: number;			// this will remove the need for the token order array

	Num?: number;			// number data
	Str?: string;			// string data
	Values?: Array<Token>;	// ref to token array

	Fn?: Function;			// pointer to exec method
	hint: string;			// temp make reading easier
}

type TokenizeData = {
	Tokens: Token[];				// temp list tokens for the current part
	Literals: string[];				// list of literals
	Level: number;					// parser nesting level
	Vars: Token[];					// vars so far
	VarMap: Map<string, number>;	// helper map to match var name <-> token
	DimMap: Map<string, number[]>;	// helper map that stores array dimensions
	Data: Token[];					// data entries stored here
	Errors: number;					// number of errors
}
