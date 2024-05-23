
class Petscii {

	public static BasText: string[] = [
		"null",				/* 0 */		/* 0x0 */
		"ct a",
		"ct b",
		"ct c",
		"ct d",
		"white",
		"ct f",
		"ct g",
		"ct h",				/* (disable charset switch (C64)) */
		"ct i",				/* (enable charset switch (C64)) */
		"ct j",				/* 10 */
		"ct k",
		"ct l",
		"return",
		"ct n",
		"ct o",
		"ct p",				/* 0x10 */
		"down",
		"reverse on",
		"home",
		"delete",			/* 20 */
		"ct u",
		"ct v",
		"ct w",
		"ct x",
		"ct y",
		"ct z",
		"027",				/* (c128) */
		"red",
		"right",
		"green",			/* 30 */
		"blue",
		" ",				/* (space) */				/* 0x20 */
		"!",
		"\"",
		"#",
		"$",
		"%",
		"&",
		"'",
		"(",				/* 40 */
		")",
		"*",
		"+",
		",",
		"-",
		".",
		"/",
		"0",				/* 0x30 */
		"1",
		"2",				/* 50 */
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9",
		":",
		";",
		"<",				/* 60 */
		"=",
		">",
		"?",
		"@",				/* 0x40 */
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",				/* 70 */
		"g",
		"h",
		"i",
		"j",
		"k",
		"l",
		"m",
		"n",
		"o",
		"p",				/* 80 */	/* 0x50 */
		"q",
		"r",
		"s",
		"t",
		"u",
		"v",
		"w",
		"x",
		"y",
		"z",				/* 90 */
		"[",
		"pound",			/* pound */
		"]",
		"^",
		"arrow left",		/* <- */
		"096",				/* 0x60 */
		"097",
		"098",
		"099",
		"100",				/* 100 */
		"101",
		"102",
		"103",
		"104",
		"105",
		"106",
		"107",
		"108",
		"109",
		"110",				/* 110 */
		"111",
		"112",				/* 0x70 */
		"113",
		"114",
		"115",
		"116",
		"117",
		"118",
		"119",
		"120",				/* 120 */
		"121",
		"122",
		"123",
		"124",
		"125",
		"126",
		"127",
		"128",				/* 0x80 */
		"orange",
		"130",				/* 130 */
		"131",
		"132",
		"f1",
		"f3",
		"f5",
		"f7",
		"f2",
		"f4",
		"f6",
		"f8",				/* 140 */
		"141",
		"142",
		"143",
		"black",			/* 0x90 */
		"up",
		"reverse off",
		"clear",
		"148",				/* insert */
		"brown",
		"pink",				/* 150 */
		"dark gray",
		"gray",
		"light green",
		"light blue",
		"light gray",
		"156", /* run */
		"left",
		"yellow",
		"cyan",
		"sh space",			/* 160 */	/* 0xA0 */
		"cm k",
		"cm i",
		"cm t",
		"cm @",
		"cm g",
		"cm +",
		"cm m",
		"cm pound",
		"sh pound",
		"cm n",				/* 170 */
		"cm q",
		"cm d",
		"cm z",
		"cm s",
		"cm p",
		"cm a",				/* 0xB0 */
		"cm e",
		"cm r",
		"cm w",
		"cm h",				/* 180 */
		"cm j",
		"cm l",
		"cm y",
		"cm u",
		"cm d",
		"sh @",
		"cm f",
		"cm c",
		"cm x",
		"cm v",				/* 190 */
		"cm b",
		"sh asterisk",		/* 0xC0 */
		"A",
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",				/* 200 */
		"I",
		"J",
		"K",
		"L",
		"M",
		"N",
		"O",
		"P",				/* 0xD0 */
		"Q",
		"R",				/* 210 */
		"S",
		"T",
		"U",
		"V",
		"W",
		"X",
		"Y",
		"Z",
		"sh +",
		"cm -",				/* 220 */
		"sh -",
		"222",
		"cm asterisk",
		"224",				/* 0xE0 */
		"225",
		"226",
		"227",
		"228",
		"229",
		"230",				/* 230 */
		"231",
		"232",
		"233",
		"234",
		"235",
		"236",
		"237",
		"238",
		"239",
		"240",				/* 240 */		/* 0xF0 */
		"241",
		"242",
		"243",
		"244",
		"245",
		"246",
		"247",
		"248",
		"249",
		"250",				/* 250 */
		"251",
		"252",
		"253",
		"254",
		"pi",				/* 255 */		/* 0xFF */
	];

	public static TXTSCREENCODE: string = "@abcdefghijklmnopqrstuvwxyz[£]^_ !\"#$%&'()*+,-./0123456789:;<=>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ~~~|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"

	/**
	 * Convert pet (byte array) to a bastext'ed string
	 * @param pet		array of btyes
	 */
	public static PetToBas(pet: number[]): string {

		let basText: string = "";
		let bas: string = "";

		for (let i: number = 0; i < pet.length; i++) {
			bas = Petscii.BasText[pet[i]];
			basText += (bas.length == 1) ? bas : "{" + bas + "}";
		}

		return basText;
	}

	/**
	 * Convert text to pet (byte array)
	 * @param text		string
	 */
	public static BasToPet(text: string): number[] {

		let pet: number[] = [];

		// temp: build a map for the bas -> pet
		let bas: Map<string, number> = new Map<string, number>();
		for (let i: number = 0; i < Petscii.BasText.length; i++) {
			bas.set(Petscii.BasText[i], i);
		}

		let c: number = 0;
		let len: number = -1;
		while (len++ < text.length) {
			c++; if (c > 256) break;

			if (text.charAt(len) == "{") {

				let end: number = text.indexOf("}", len);
				if (end == -1)
					end = text.length - 1;

				let basText: string = text.substring(len + 1, end);

				if (bas.has(basText)) {
					pet.push(bas.get(basText));
				} else {
					pet.push(46); // "."
				}
				len = end;
				continue;
			}

			if (bas.has(text.charAt(len))) {
				pet.push(bas.get(text.charAt(len)));
			} else {
				if (text.charAt(len) != "")
					pet.push(46); // "."
			}
			
		}

		return pet;
	}

	/**
	 * Converts a single pet character (byte) to text
	 * @param pet
	 */
	public static PetToText(pet: number): string {

		let text = Petscii.BasText[pet];

		if (text.length > 1)
			text = "{" + text + "}";

		return text;
	}

	/**
	 * Convert screen code to petscii
	 * @param screen	screen code from screen ram
	 */
	public static ScreenToPet(screen: number): number {

		// see: http://sta.c64.org/cbm64scrtopetext.html

		let pet: number = screen;

		if (screen <= 31) {
			pet = screen + 64;
		} else if (screen >= 32 && screen <= 63) {
			// nop
		} else if (screen >= 64 && screen <= 93) {
			pet = screen + 128;
		} else if (screen >= 96 && screen <= 127) {
			pet = screen + +64;
		} else if (screen >= 128 && screen <= 159) {
			pet = screen - 128;
		} else if (screen >= 160 && screen <= 191) {
			pet = screen - 64;
		} else if (screen >= 192 && screen <= 223) {
			pet = screen - 64;
		} else if (screen >= 224 && screen <= 254) {
			// nop
		}

		return pet;
	}

	/**
	 * Convert petscii to screen code
	 * @param pet		petschii code
	 */
	public static PetToScreen(pet: number): number {

		let code: number = pet;

		if (pet <= 31) {
			code = pet + 128;
		} else if (pet >= 64 && pet <= 95) {
			code = pet - 64;
		} else if (pet >= 96 && pet <= 127) {
			code = pet - 32;
		} else if (pet >= 128 && pet <= 159) {
			code = pet + 64;
		} else if (pet >= 160 && pet <= 191) {
			code = pet - 64;
		} else if (pet >= 192 && pet <= 254) { // <= 223 , } else if (chr >= 224 && chr <= 254) {
			code = pet - 128
		}

		return code;
	}

	/**
	 * Convert bastext to html using the C64_Pro_Mono-STYLE font 
	 * ToDo: move to a better place
	 * @param text		string
	 * @param useLower	boolean, use uppercase/gfx or lowercase/uppercase
	 **/
	public static BasToHtml (text: string, useLower:boolean = false): string {

		const low: number = useLower ? 1 : 0;
		const pet: number[] = this.BasToPet(text);


		let literal: string = "";
		for (let i: number = 0; i < pet.length; i++) {

			if (pet[i] >= 0) {
				if (pet[i] <= 31 || (pet[i] >= 128 && pet[i] <= 159)) {
					literal += "&#xe" + (low + 2).toString() + (pet[0] + 64).toString(16).padStart(2, "0") + ";";
				} else {
					literal += "&#xe" + low.toString() + pet[i].toString(16).padStart(2, "0") + ";";
				}
			}
		}

		return literal;
	}

}
