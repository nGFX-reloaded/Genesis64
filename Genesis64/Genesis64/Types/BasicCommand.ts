enum CmdType {
	cmd		/*  0, commands, PRINT */,
	fnum	/*  1, numerical method, SIN */,
	fstr	/*  2, string method, LEFT$ */,
	fout	/*  3, output method, SPC */,
	ops		/*  4, operators, +,- */,
	comp	/*  5, compare =, <= ... */
}



type BasicCmd = {
	name: string;
	abbrv: string;
	tkn: number;
	type: CmdType;
	reg?: RegExp;

	def?: CmdDefData;
}


type CmdDefData = {
	fn: Function;
	len: number;		// max num of params, -1 no limit
	chr: string;		// split char
	type?: string[];	// type list, min number of params
	reg?: RegExp;		// optional reg exp
}