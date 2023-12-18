
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


class Helper {

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
		return code.replace(/(\$|\(|\)|\+|\*|\/|\<|\>|\?)/g, "\\$1");
	}

}