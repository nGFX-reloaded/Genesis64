
interface BasicCmd {
	Name: string;			// name of the command, ie. the command
	Abbrv: string;			// abbreviation, if any
	TknId: number[];		// token id when saving, or -1, then use pet value
	Type: Tokentype;		// type of token
	Param?: CmdParam;		// parameter for this command
}

interface CmdParam {
	Len: number;			// number of parameters, 0 for none or all optional, > 0 for fixed, < 0 for variable with fixed length (ie: -1: one fixed param, rest optional)
	Type: Tokentype[];		// type of parameters
	Fn?: Function;			// function to call when parsing
}