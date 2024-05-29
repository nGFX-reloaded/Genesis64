
interface Matching {
	Has: boolean;
	Start: number;
	End: number;
	Match: string;
}

interface SplitItem {
	Source: string;
	List: Array<string>;
}


class Tools {

	/**
	 * Splits a piece of code with a given split string/char, except when in (), [] or {}, "" and ''
	 * @param code		code to split
	 * @param chars		splitting chars
	 */
	public static CodeSplitter(code: string, chars: string): string[] {

		let aResult: string[] = [];
		let matching: Matching = { Has: false, Start: -1, End: -1, Match: "" };
		let iPos: number = 0;

		const len: number = chars.length;
		const open: string = "([{\"'";
		const close: string = ")]}\"'";

		if (chars === "")
			return [code];

		if (code.trim().startsWith(chars))
			code = " " + code;

		if (code.includes(chars)) {
			while (iPos < code.length) {
				if (open.includes(code.charAt(iPos))) {
					const item: number = open.indexOf(code.charAt(iPos));
					matching = this.FindMatching(code, iPos, open.charAt(item), close.charAt(item));
					if (matching.Has)
						iPos = matching.End;
				}

				if (code.substring(iPos, iPos + len) == chars) {
					aResult.push(code.substring(0, iPos)); // do not trim
					code = code.substring(iPos + len);
					iPos = 0;
				} else {
					iPos++;
				}
			}
		}

		aResult.push(code); // do not trim

		return aResult;
	}

	/**
	 * Finds matching brackets (start) and (end) for a given piece of code
	 * @param	code		code to match (start) and (end) in
	 * @param	offset		[optional] offset to start searching
	 * @param	start		[optional] starting character, defaults to (
	 * @param	end			[optional] ending character, defaults to )
	 */
	public static FindMatching(code: string, offset?: number, start?: string, end?: string): Matching {

		const result: Matching = { Has: false, Start: -1, End: -1, Match: "" };

		if (typeof start === "undefined") start = "(";
		if (typeof end === "undefined") end = ")";

		const iStart: number = code.indexOf(start, (typeof offset === "undefined") ? 0 : offset);
		let iEnd: number = -1;
		let i: number;
		let count: number = 0;

		if (iStart != -1) {
			for (i = iStart; i < code.length; i++) {
				if (code.charAt(i) == start) count++;
				if (code.charAt(i) == end) count--;

				if (count == 0) {
					iEnd = i;
					break;
				}
			}
		}

		result.Start = iStart;
		result.End = iEnd;
		result.Has = (iStart != -1 && iEnd != -1);

		if (result.Has)
			result.Match = code.substring(iStart, iEnd + 1);

		return result;
	}

	/**
	 * Encodes litearls in strings, stores literals in a list and replaces it in string
	 * @param	code		code to encode literals in
	 */
	public static EncodeLiterals(code: string): SplitItem {
		let item: SplitItem = { Source: code, List: new Array<string>() };
		let iStart: number, iEnd: number, i: number, id: number;


		if (code.indexOf("\"") != -1) {

			while (code.indexOf("\"") != -1) {

				iStart = code.indexOf("\"");
				iEnd = -1;

				for (i = iStart; i < code.length; i++) {
					if (i > iStart && code.charAt(i) === "\"") {
						iEnd = i;
						break;
					}
				}

				if (iEnd == -1) { // no closing "
					iEnd = code.length;
					code += "\"";
				}

				id = item.List.length;
				item.List.push(code.substring(iStart + 1, iEnd));
				code = code.substring(0, iStart) + "{" + id.toString() + "}" + code.substring(iEnd + 1);
			}
		}

		item.Source = code;

		return item;
	}

	/**
	 * Restores encoded literals
	 * @param			code			encoded piece of code
	 * @param			literals		list of literals
	 * @param			getText			[optional] return text without ""
	 * @returns			string
	 **/
	public static RestoreLiterals(code: string, literals: string[], getText: boolean = false): string {

		let text: string = "";
		for (let i: number = 0; i < literals.length; i++) {
			text = (getText) ? literals[i] : "\"" + literals[i] + "\"";
			code = code.replace("{" + i.toString() + "}", text);
		}

		return code;

	}

	/**
	 * escapes a few special characters for regexes
	 * @param			code			code to escape
	 * @returns			string
	 */
	public static EscapeRegex(code: string): string {
		return code.replace(/(\$|\(|\)|\+|\*|\/|\<|\>|\?|\^)/g, "\\$1");
	}

	/**
	 * Returns the name of an error 
	 * @param	id			error id
	 **/
	public static ErrorName(id: number): string {

		let error: string = "syntax error";

		switch (id) {
			case ErrorCodes.TOO_MANY_FILES:
				error = "too many files";
				break;
			case ErrorCodes.FILE_OPEN:
				error = "file open";
				break;
			case ErrorCodes.FILE_NOT_OPEN:
				error = "file not open";
				break;
			case ErrorCodes.FILE_NOT_FOUND:
				error = "file not found";
				break;
			case ErrorCodes.DEVICE_NOT_PRESENT:
				error = "device not present";
				break;
			case ErrorCodes.NOT_INPUT_FILE:
				error = "not input file";
				break;
			case ErrorCodes.NOT_OUTPUT_FILE:
				error = "not output file";
				break;
			case ErrorCodes.MISSING_FILENAME:
				error = "missing filename";
				break;
			case ErrorCodes.ILLEGAL_DEVICE_NUMBER:
				error = "illegal device number";
				break;
			case ErrorCodes.NEXT_WITHOUT_FOR:
				error = "next without for";
				break;
			case ErrorCodes.SYNTAX:
				error = "syntax";
				break;
			case ErrorCodes.RETURN_WITHOUT_GOSUB:
				error = "return without gosub";
				break;
			case ErrorCodes.OUT_OF_DATA:
				error = "out of data";
				break;
			case ErrorCodes.ILLEGAL_QUANTITY:
				error = "illegal quantity";
				break;
			case ErrorCodes.OVERFLOW:
				error = "overflow";
				break;
			case ErrorCodes.OUT_OF_MEMORY:
				error = "out of memory";
				break;
			case ErrorCodes.UNDEFD_STATEMENT:
				error = "undefd statement";
				break;
			case ErrorCodes.BAD_SUBSCRIPT:
				error = "bad subscript";
				break;
			case ErrorCodes.REDIMD_ARRAY:
				error = "redimd array";
				break;
			case ErrorCodes.DIVISION_BY_ZERO:
				error = "division by zero";
				break;
			case ErrorCodes.ILLEGAL_DIRECT:
				error = "illegal direct";
				break;
			case ErrorCodes.TYPE_MISMATCH:
				error = "type mismatch";
				break;
			case ErrorCodes.STRING_TOO_LONG:
				error = "string too long";
				break;
			case ErrorCodes.FILE_DATA:
				error = "file data";
				break;
			case ErrorCodes.FORMULA_TOO_COMPLEX:
				error = "formula too complex";
				break;
			case ErrorCodes.CANT_CONTINUE:
				error = "cant continue";
				break;
			case ErrorCodes.UNDEFD_FUNCTION:
				error = "undefd function";
				break;
			case ErrorCodes.VERIFY:
				error = "verify";
				break;
			case ErrorCodes.LOAD:
				error = "load";
				break;
			case ErrorCodes.BREAK:
				error = "break";
				break;
			case ErrorCodes.LINE_NOT_FOUND:
				error = "line not found";
				break;
		}

		return error;
	}

	/**
	 * Creates a token
	 * @param	type		token type
	 * @param	str			[optional] string value, on error: error message, will be converted to petscii bytes[]
	 * @param	num			[optional] number value, on error: error id
	 * @returns			G64Token
	 */
	public static CreateToken(type: Tokentype, str?: string, num?: number): G64Token {
		let tkn: G64Token = { Type: type, Values: [], Str:"", Num: 0 };

		switch (type) {
			case Tokentype.line:
				tkn = {
					Type: type,
					Values: [],
					Str: (typeof str !== "undefined") ? str : "",
					Num: (typeof num !== "undefined") ? num : -1
				};
				break;

			case Tokentype.err:
				tkn = {
					Type: type,
					Id: (typeof num !== "undefined") ? num : ErrorCodes.SYNTAX,
					Str: Tools.ErrorName((typeof num !== "undefined") ? num : ErrorCodes.SYNTAX),
					Hint: (typeof str !== "undefined" || str === null) ? str : ""
				};
				break;

			case Tokentype.num:
				tkn = {
					Type: Tokentype.num,
					Num: (typeof num !== "undefined") ? num : 0
				};
				break;

			case Tokentype.str:
				tkn = {
					Type: type,
					Str: (typeof str !== "undefined") ? str : ""
				};
				break;

			case Tokentype.vnum:
			case Tokentype.vint:
				tkn = {
					Type: type,
					Name: (typeof str !== "undefined") ? str : "",
					Num: 0
				};
				break;

			case Tokentype.anum:
			case Tokentype.aint:
				tkn = {
					Type: type,
					Name: (typeof str !== "undefined") ? str : "",
					Num: 0,
					Values: []
				};
				break;

			case Tokentype.vstr:
				tkn = {
					Type: type,
					Name: (typeof str !== "undefined") ? str : "",
					Str: ""
				};
				break;

			case Tokentype.astr:
				tkn = {
					Type: type,
					Name: (typeof str !== "undefined") ? str : "",
					Str: "",
					Values: []
				};
				break;

			case Tokentype.link: 
				tkn = {
					Type: type,
					Str: (typeof str !== "undefined") ? str : ""
				};
				break;
		}

		return tkn;
	}

	public static GetTokentypeName(type: Tokentype): string {

		let typeName = "error, type has no name.";

		switch (type) {
			case Tokentype.num:
				typeName = "number";
				break;

			case Tokentype.str:
				typeName = "string";
				break;

			case Tokentype.err:
				typeName = "error";
				break;
		}


		return typeName;
	}

}