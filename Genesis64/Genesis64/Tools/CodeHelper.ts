
interface SplitItem {
	Source: string;
	List: Array<string>;
}


class CodeHelper {

	/**
	 * Splits a piece of code with a given split string/char, except when in (), [] or {}, "" and ''
	 * @param code		code to split
	 * @param chars		splitting chars
	 */
	public static CodeSplitter(code: string, chars: string): string[] {

		let aResult: Array<string> = [];
		let tuple: Array<number> = [];
		let iPos: number = 0;

		const len: number = chars.length;
		const open: string = "([{\"'";
		const close: string = ")]}\"'";

		if (code.includes(chars)) {

			while (iPos < code.length) {
				if (open.includes(code.charAt(iPos))) {
					const item: number = open.indexOf(code.charAt(iPos));
					tuple = this.FindMatching(code, iPos, open.charAt(item), close.charAt(item));
					if (this.IsMatching(tuple)) {
						iPos = tuple[1];
					}
				}

				if (code.substring(iPos, iPos + len) == chars) {
					aResult.push(code.substring(0, iPos).trim())
					code = code.substring(iPos + len);
					iPos = 0;
				} else {
					iPos++;
				}
			}
		}

		aResult.push(code.trim());

		return aResult;
	}

	/**
	 * Finds matching brackets ( and ) for a given piece of code
	 * @param code		code to match ( and ) in
	 * @param offset	offset to start searching
	 */
	public static FindMatching(code: string, offset?: number, start?: string, end?: string): [number, number] {

		if (typeof code == "undefined") {
			console.log("You fucked up in FindMatching", code);
			return [-1, -1];
		}

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

		return [iStart, iEnd]
	}

	public static IsMatching(tuple: number[]): boolean {
		return (tuple.length == 2 && tuple[0] != -1 && tuple[1] != -1);
	}

	/**
	 * Encodes litearls in strings, stores literals in a list and replaces it in string
	 * @param line		line to encode literals in
	 */
	public static EncodeLiterals(line: string): SplitItem {
		let item: SplitItem = { Source: line, List: new Array<string>() };
		let iStart: number, iEnd: number, i: number, id: number;


		if (line.indexOf("\"") != -1) {

			while (line.indexOf("\"") != -1) {

				iStart = line.indexOf("\"");
				iEnd = -1;

				for (i = iStart; i < line.length; i++) {
					if (i > iStart && line.charAt(i) === "\"") {
						iEnd = i;
						break;
					}
				}

				if (iEnd == -1) { // no closing "
					iEnd = line.length;
					line += "\"";
				}

				id = item.List.length;
				item.List.push(line.substring(iStart + 1, iEnd));
				line = line.substring(0, iStart) + "{" + id.toString() + "}" + line.substring(iEnd + 1);
			}
		}

		item.Source = line;

		return item;
	}

}