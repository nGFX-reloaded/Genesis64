enum CmdType {
	cmd		/*  0, commands, PRINT */,
	fnum	/*  1, numerical method, SIN */,
	fstr	/*  2, string method, LEFT$ */,
	fout	/*  3, output method, SPC */,
	ops		/*  4, operators, +,- */,
	comp	/*  5, compare =, <= ... */
}


type BasicCmd = {
	Name: string;			// name of the command, ie. the command
	Abbrv: string;			// abbreviation, if any
	TknId: number;			// token id when saving, or -1, then use pet value
	Type: CmdType;

	Param?: CmdParameter;	// a parameter definition
	Ret?: Tokentype;		// the return type
}


type CmdParameter = {
	fn: Function;
	len: number;		// max num of params, -1 no limit
	chr: string;		// split char
	type: ParamType[];	// type list, min number of params
}

enum ParamType {
	any,	/* anything */
	num,	/* a number */
	adr,	/* a memory adr., 0-65535 */
	byte,	/* a byte, 0-255 */
	str,	/* a string literal */
	cmd,	/* a command */
	var,	/* a variable */
	same	/* same type as prev token -> a$ = string */
}