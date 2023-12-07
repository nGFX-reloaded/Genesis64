
type Matching = {
	Has: boolean;
	Start: number;
	End: number;
	Match: string;
}

class Helper {

	public static GetMatching(text: string, begin?: string, end?: string, position?:number): Matching {

		const result:Matching = {Has: false, Start: -1, End: -1, Match: ""};

		if (typeof position === "undefined")
			position = 0;

		if (typeof begin === "undefined")
			begin = "(";

if (typeof end === "undefined")
			end = ")";

		if (text.indexOf(begin, position) == -1)
			return result;



		return result;
	}

}