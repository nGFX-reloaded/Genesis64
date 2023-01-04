
interface ColorData {
	r: number;
	g: number;
	b: number;
	name: string;
	css: string;
	chr: number;
}

class G64Colors {

	//#region " ----- Privates ----- "

	private m_isDirty: boolean = false; // has anything changed?

	private m_colorBuffer: ArrayBuffer;		// used to create a color texture
	private m_colorView: Uint8Array;

	private m_Colors: Array<ColorData>;

	//#endregion

	//#region " ----- Publics ----- "

	public get ColorView(): Uint8Array { return this.m_colorView; }

	//#endregion

	constructor() {

		Genesis64.Instance.Log(" - G64 colors created\n");

		// color data bmp
		this.m_colorBuffer = new ArrayBuffer(256 * 4);
		this.m_colorView = new Uint8Array(this.m_colorBuffer);
		this.m_colorView.fill(0);

		this.Init();

	}

	//#region " ----- Init ----- "

	public Init(): void {

		this.m_Colors = new Array<ColorData>();

		// set the default c64 colors
		this.m_Colors.push({ "r": 0x00, "g": 0x00, "b": 0x00, "name": "Black", "css": "#000000", "chr": 144 }); //0
		this.m_Colors.push({ "r": 0xff, "g": 0xff, "b": 0xff, "name": "White", "css": "#ffffff", "chr": 5 }); // 1
		this.m_Colors.push({ "r": 0x68, "g": 0x37, "b": 0x2b, "name": "Red", "css": "#68372b", "chr": 28 }); // 2
		this.m_Colors.push({ "r": 0x70, "g": 0xa4, "b": 0xb2, "name": "Cyan", "css": "#70a4b2", "chr": 159 }); // 3
		this.m_Colors.push({ "r": 0x6f, "g": 0x3d, "b": 0x86, "name": "Purple", "css": "#6f3d86", "chr": 156 }); // 4
		this.m_Colors.push({ "r": 0x58, "g": 0x8d, "b": 0x43, "name": "Green", "css": "#588d43", "chr": 30 }); // 5
		this.m_Colors.push({ "r": 0x35, "g": 0x28, "b": 0x79, "name": "Blue", "css": "#352879", "chr": 31 }); // 6
		this.m_Colors.push({ "r": 0xb8, "g": 0xc7, "b": 0x6f, "name": "Yellow", "css": "#B8C76F", "chr": 158 }); // 7
		this.m_Colors.push({ "r": 0x6f, "g": 0x4f, "b": 0x25, "name": "Orange", "css": "#6F4F25", "chr": 129 }); // 8
		this.m_Colors.push({ "r": 0x43, "g": 0x39, "b": 0x00, "name": "Brown", "css": "#433900", "chr": 149 }); // 9
		this.m_Colors.push({ "r": 0x9a, "g": 0x67, "b": 0x59, "name": "Lightred", "css": "#9A6759", "chr": 150 }); // 10
		this.m_Colors.push({ "r": 0x44, "g": 0x44, "b": 0x44, "name": "Darkgrey", "css": "#444444", "chr": 151 }); // 11
		this.m_Colors.push({ "r": 0x6c, "g": 0x6c, "b": 0x6c, "name": "Grey", "css": "#6C6C6C", "chr": 152 }); // 12
		this.m_Colors.push({ "r": 0x9a, "g": 0xd2, "b": 0x84, "name": "Lightgreen", "css": "#9AD284", "chr": 153 }); // 13
		this.m_Colors.push({ "r": 0x6c, "g": 0x5e, "b": 0xb5, "name": "Lightblue", "css": "#6C5EB5", "chr": 154 }); // 14
		this.m_Colors.push({ "r": 0x95, "g": 0x95, "b": 0x95, "name": "Lightgrey", "css": "#959595", "chr": 155 }); // 15 
	}


	/** Copies the colors into the buffer for creating the color texture */
	public SetColorView(): void {
				
		let ptr: number = 0;

		// only first 16 colors for now
		// copy to v4 array
		for (let j = 0; j < 16; j++) {
			for (let i: number = 0; i < this.m_Colors.length; i++) {
				this.m_colorView[ptr++] = this.m_Colors[i].r;
				this.m_colorView[ptr++] = this.m_Colors[i].g;
				this.m_colorView[ptr++] = this.m_Colors[i].b;
				this.m_colorView[ptr++] = 255; // alpha
			}
		}

		this.m_isDirty = false;
	}

	//#endregion

	//#region " ----- Public Methods ----- "

	/**
	 * Sets a new RGBA value for color
	 * @param color		id of the color to change
	 * @param r			red byte
	 * @param g			green byte
	 * @param b			blue byte
	 * @param a			alpha byte
	 */
	public SetColor(color: number, r: number, g: number, b: number, a: number): void {

		const id: number = color * 4;

		//this.m_f32Colors[id] = r * (1 / 255);
		//this.m_f32Colors[id + 1] = g * (1 / 255);
		//this.m_f32Colors[id + 2] = b * (1 / 255);
		//this.m_f32Colors[id + 3] = a * (1 / 255);

		this.m_isDirty = true;

	}

	/**
	 * returns a colordata for a given color (0-15 for c64 colors)
	 * @param color		number, 0-15
	 */
	public GetColor(color: number): ColorData {

		// ToDo: limit colors
		return this.m_Colors[color];

	}

	//#endregion

}