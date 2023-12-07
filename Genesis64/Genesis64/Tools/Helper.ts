
type Matching = {
	Has: boolean;
	Start: number;
	End: number;
	Match: string;
}

class Helper {

	/**
	 * Finds matching brackets (start) and (end) for a given piece of code
	 * @param	code		code to match (start) and (end) in
	 * @param	offset		[optional] offset to start searching
	 * @param	start		[optional] starting character, defaults to (
	 * @param	end			[optional] ending character, defaults to )
	 */
	public static GetMatching(code: string, offset?: number, start?: string, end?: string): Matching {

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

	
}