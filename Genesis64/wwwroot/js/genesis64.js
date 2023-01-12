var BasicVersion;
(function (BasicVersion) {
    BasicVersion[BasicVersion["v2"] = 0] = "v2";
    BasicVersion[BasicVersion["g64"] = 1] = "g64";
})(BasicVersion || (BasicVersion = {}));
var CmdType;
(function (CmdType) {
    CmdType[CmdType["cmd"] = 0] = "cmd";
    CmdType[CmdType["fnum"] = 1] = "fnum";
    CmdType[CmdType["fstr"] = 2] = "fstr";
    CmdType[CmdType["fout"] = 3] = "fout";
    CmdType[CmdType["ops"] = 4] = "ops";
    CmdType[CmdType["comp"] = 5] = "comp";
})(CmdType || (CmdType = {}));
var Tokentype;
(function (Tokentype) {
    Tokentype[Tokentype["nop"] = 0] = "nop";
    Tokentype[Tokentype["err"] = 1] = "err";
    Tokentype[Tokentype["cmd"] = 2] = "cmd";
    Tokentype[Tokentype["fnnum"] = 3] = "fnnum";
    Tokentype[Tokentype["fnstr"] = 4] = "fnstr";
    Tokentype[Tokentype["fnout"] = 5] = "fnout";
    Tokentype[Tokentype["ops"] = 6] = "ops";
    Tokentype[Tokentype["comp"] = 7] = "comp";
    Tokentype[Tokentype["num"] = 8] = "num";
    Tokentype[Tokentype["int"] = 9] = "int";
    Tokentype[Tokentype["str"] = 10] = "str";
    Tokentype[Tokentype["vnum"] = 11] = "vnum";
    Tokentype[Tokentype["vint"] = 12] = "vint";
    Tokentype[Tokentype["vstr"] = 13] = "vstr";
    Tokentype[Tokentype["anum"] = 14] = "anum";
    Tokentype[Tokentype["aint"] = 15] = "aint";
    Tokentype[Tokentype["astr"] = 16] = "astr";
    Tokentype[Tokentype["link"] = 17] = "link";
    Tokentype[Tokentype["eop"] = 18] = "eop";
    Tokentype[Tokentype["run"] = 19] = "run";
    Tokentype[Tokentype["jmp"] = 20] = "jmp";
    Tokentype[Tokentype["end"] = 21] = "end";
})(Tokentype || (Tokentype = {}));
class G64Basic {
    get Commands() { return this.m_Commands; }
    get Version() { return this.m_Options.basicVersion; }
    constructor() {
        this.m_Commands = [];
        this.m_lstCmd = [];
        this.m_lstFnNum = [];
        this.m_lstFnStr = [];
        this.m_lstFnOut = [];
        this.m_lstOps = [];
        this.m_lstComp = [];
        this.regexLineNr = /^\s*(\d*)\s*(.*)\s*/;
        this.regexArrayStart = /[_a-z]+[_a-z0-9]*[$%]?\s*\(/g;
        Genesis64.Instance.Log(" - Basic created\n");
        this.m_Options = {
            basicVersion: BasicVersion.v2
        };
        this.m_Mem = Genesis64.Instance.Memory;
    }
    Init(options) {
        switch (options.basicVersion) {
            case BasicVersion.v2:
                Genesis64.Instance.Log("   ... setting up BASIC V2 ... ");
                this.InitBasicV2();
                this.InitLists();
                break;
            case BasicVersion.g64:
                Genesis64.Instance.Log("   ... setting up G64 BASIC ... ");
                this.InitBasicG64();
                this.InitLists();
                break;
        }
        Genesis64.Instance.Log("OK\n");
        this.m_Options = {
            ...options
        };
    }
    InitBasicV2() {
        this.m_Commands = [
            { name: "close", abbrv: "clO", tkn: 160, type: CmdType.cmd },
            { name: "clr", abbrv: "cR", tkn: 156, type: CmdType.cmd },
            { name: "cont", abbrv: "cO", tkn: 154, type: CmdType.cmd },
            { name: "cmd", abbrv: "cM", tkn: 157, type: CmdType.cmd },
            { name: "data", abbrv: "dA", tkn: 131, type: CmdType.cmd },
            { name: "def", abbrv: "dE", tkn: 150, type: CmdType.cmd },
            { name: "dim", abbrv: "dI", tkn: 134, type: CmdType.cmd },
            { name: "end", abbrv: "eN", tkn: 128, type: CmdType.cmd },
            { name: "for", abbrv: "fO", tkn: 129, type: CmdType.cmd },
            { name: "get", abbrv: "gE", tkn: 161, type: CmdType.cmd },
            { name: "get#", abbrv: "", tkn: 161, type: CmdType.cmd, reg: "get\\#" },
            { name: "gosub", abbrv: "goS", tkn: 141, type: CmdType.cmd },
            { name: "goto", abbrv: "gO", tkn: 137, type: CmdType.cmd },
            { name: "if", abbrv: "", tkn: 139, type: CmdType.cmd },
            { name: "input", abbrv: "", tkn: 133, type: CmdType.cmd },
            { name: "input#", abbrv: "iN", tkn: 132, type: CmdType.cmd, reg: "input\\#" },
            { name: "let", abbrv: "lE", tkn: 136, type: CmdType.cmd, reg: "(?:(?:let)?\\s*(?:[_a-z]+[_a-z0-9]*[$%]?(?:\\s*\\[.+\\])?)\s*=\\s*(?:[^=]+))" },
            { name: "list", abbrv: "lI", tkn: 155, type: CmdType.cmd },
            { name: "load", abbrv: "lO", tkn: 147, type: CmdType.cmd },
            { name: "new", abbrv: "", tkn: 162, type: CmdType.cmd },
            { name: "next", abbrv: "nE", tkn: 130, type: CmdType.cmd },
            { name: "on", abbrv: "", tkn: 145, type: CmdType.cmd },
            { name: "open", abbrv: "oP", tkn: 159, type: CmdType.cmd },
            { name: "poke", abbrv: "pO", tkn: 151, type: CmdType.cmd },
            { name: "print", abbrv: "?", tkn: 153, type: CmdType.cmd },
            { name: "print#", abbrv: "pR", tkn: 152, type: CmdType.cmd, reg: "print\\#" },
            { name: "read", abbrv: "rE", tkn: 135, type: CmdType.cmd },
            { name: "rem", abbrv: "", tkn: 143, type: CmdType.cmd },
            { name: "restore", abbrv: "reS", tkn: 140, type: CmdType.cmd },
            { name: "return", abbrv: "reT", tkn: 142, type: CmdType.cmd },
            { name: "run", abbrv: "rU", tkn: 138, type: CmdType.cmd },
            { name: "save", abbrv: "sA", tkn: 148, type: CmdType.cmd },
            { name: "stop", abbrv: "sT", tkn: 144, type: CmdType.cmd },
            { name: "step", abbrv: "stE", tkn: 169, type: CmdType.cmd },
            { name: "sys", abbrv: "sY", tkn: 158, type: CmdType.cmd },
            { name: "then", abbrv: "tH", tkn: 167, type: CmdType.cmd },
            { name: "to", abbrv: "", tkn: 164, type: CmdType.cmd },
            { name: "verify", abbrv: "vE", tkn: 149, type: CmdType.cmd },
            { name: "wait", abbrv: "wA", tkn: 146, type: CmdType.cmd },
            { name: "abs", abbrv: "aB", tkn: 182, type: CmdType.fnum },
            { name: "asc", abbrv: "aS", tkn: 198, type: CmdType.fnum },
            { name: "atn", abbrv: "aT", tkn: 193, type: CmdType.fnum },
            { name: "cos", abbrv: "", tkn: 190, type: CmdType.fnum },
            { name: "exp", abbrv: "eX", tkn: 189, type: CmdType.fnum },
            { name: "fn", abbrv: "", tkn: 165, type: CmdType.fnum },
            { name: "fre", abbrv: "fR", tkn: 184, type: CmdType.fnum },
            { name: "int", abbrv: "", tkn: 181, type: CmdType.fnum },
            { name: "len", abbrv: "", tkn: 195, type: CmdType.fnum },
            { name: "log", abbrv: "", tkn: 188, type: CmdType.fnum },
            { name: "peek", abbrv: "pE", tkn: 194, type: CmdType.fnum },
            { name: "pos", abbrv: "", tkn: 185, type: CmdType.fnum },
            { name: "rnd", abbrv: "rN", tkn: 187, type: CmdType.fnum },
            { name: "sgn", abbrv: "sG", tkn: 180, type: CmdType.fnum },
            { name: "sin", abbrv: "sI", tkn: 191, type: CmdType.fnum },
            { name: "sqr", abbrv: "sQ", tkn: 186, type: CmdType.fnum },
            { name: "tan", abbrv: "", tkn: 192, type: CmdType.fnum },
            { name: "usr", abbrv: "uS", tkn: 183, type: CmdType.fnum },
            { name: "val", abbrv: "vA", tkn: 197, type: CmdType.fnum },
            { name: "chr$", abbrv: "cH", tkn: 199, reg: "chr\\$", type: CmdType.fstr },
            { name: "left$", abbrv: "leF", tkn: 200, reg: "left\\$", type: CmdType.fstr },
            { name: "mid$", abbrv: "mI", tkn: 202, reg: "mid\\$", type: CmdType.fstr },
            { name: "right$", abbrv: "rI", tkn: 201, reg: "right\\$", type: CmdType.fstr },
            { name: "str$", abbrv: "stR", tkn: 196, reg: "str\\$", type: CmdType.fstr },
            { name: "spc(", abbrv: "sP", tkn: 166, reg: "spc\\(", type: CmdType.fout },
            { name: "tab(", abbrv: "tA", tkn: 163, reg: "tab\\(", type: CmdType.fout },
            { name: "and", abbrv: "aN", tkn: 175, type: CmdType.ops },
            { name: "or", abbrv: "", tkn: 176, type: CmdType.ops },
            { name: "not", abbrv: "nO", tkn: 168, type: CmdType.ops },
        ];
    }
    InitBasicG64() {
        this.InitBasicV2();
    }
    InitLists() {
        const aCmd = [];
        const aFn = [];
        this.m_lstOps = [];
        this.m_lstComp = [];
        this.m_lstCmd = [];
        this.m_lstFnNum = [];
        this.m_lstFnStr = [];
        this.m_lstFnOut = [];
        this.m_lstOps = [];
        this.m_lstComp = [];
        for (let i = 0; i < this.m_Commands.length; i++) {
            if (typeof this.m_Commands[i].reg === "undefined") {
                this.m_Commands[i].reg = this.m_Commands[i].name;
            }
            if (this.m_Commands[i].type == CmdType.cmd) {
                aCmd.push(this.m_Commands[i].reg);
                this.m_lstCmd.push(i);
                this.m_Commands[i].reg = new RegExp("(" + this.m_Commands[i].reg + ")(.*)");
            }
            if (this.m_Commands[i].type == CmdType.fnum) {
                aFn.push(this.m_Commands[i].reg);
                this.m_lstFnNum.push(i);
            }
            if (this.m_Commands[i].type == CmdType.fstr) {
                this.m_lstFnStr.push(i);
                aFn.push(this.m_Commands[i].reg);
            }
            if (this.m_Commands[i].type == CmdType.fout) {
                this.m_lstFnOut.push(i);
                aFn.push(this.m_Commands[i].reg);
            }
            if (this.m_Commands[i].type == CmdType.ops) {
                this.m_lstOps.push(i);
            }
            if (this.m_Commands[i].type == CmdType.comp) {
                this.m_lstComp.push(i);
            }
        }
        this.regexCmd = new RegExp("(" + aCmd.join("|") + ")");
        this.regexFn = new RegExp("(" + aFn.join("|") + ")");
    }
    EncodeArray(code) {
        let encoded = code;
        if (code.includes("(") && code.includes(")")) {
            const match = code.match(this.regexArrayStart);
            console.log("-- ", code, match);
        }
        return encoded;
    }
    Temp(code) {
        console.time("temp");
        const lines = CodeHelper.CodeSplitter(code, "\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() !== "") {
                let match = lines[i].match(this.regexLineNr);
                let lineNr = -1;
                let line = match[2];
                if (match[1] !== "") {
                    lineNr = parseInt(match[1]);
                }
                if (line !== "") {
                    line = this.EncodeArray(line);
                    this.ParseLine(line);
                }
            }
        }
        console.timeEnd("temp");
    }
    ParseLine(code) {
        const parts = CodeHelper.CodeSplitter(code, ":");
        for (let p = 0; p < parts.length; p++) {
            this.Tokenizer(parts[p]);
        }
    }
    Tokenizer(code) {
        for (let i = 0; i < this.m_lstCmd.length; i++) {
            const match = new RegExp("(" + this.m_Commands[this.m_lstCmd[i]].reg + ")(.*)").exec(code);
            if (match !== null)
                console.log(code, match);
        }
    }
}
class G64Colors {
    get ColorView() { return this.m_colorView; }
    constructor() {
        this.m_isDirty = false;
        Genesis64.Instance.Log(" - G64 colors created\n");
        this.m_colorBuffer = new ArrayBuffer(256 * 4);
        this.m_colorView = new Uint8Array(this.m_colorBuffer);
        this.m_colorView.fill(0);
        this.Init();
    }
    Init() {
        this.m_Colors = new Array();
        this.m_Colors.push({ "r": 0x00, "g": 0x00, "b": 0x00, "name": "Black", "css": "#000000", "chr": 144 });
        this.m_Colors.push({ "r": 0xff, "g": 0xff, "b": 0xff, "name": "White", "css": "#ffffff", "chr": 5 });
        this.m_Colors.push({ "r": 0x68, "g": 0x37, "b": 0x2b, "name": "Red", "css": "#68372b", "chr": 28 });
        this.m_Colors.push({ "r": 0x70, "g": 0xa4, "b": 0xb2, "name": "Cyan", "css": "#70a4b2", "chr": 159 });
        this.m_Colors.push({ "r": 0x6f, "g": 0x3d, "b": 0x86, "name": "Purple", "css": "#6f3d86", "chr": 156 });
        this.m_Colors.push({ "r": 0x58, "g": 0x8d, "b": 0x43, "name": "Green", "css": "#588d43", "chr": 30 });
        this.m_Colors.push({ "r": 0x35, "g": 0x28, "b": 0x79, "name": "Blue", "css": "#352879", "chr": 31 });
        this.m_Colors.push({ "r": 0xb8, "g": 0xc7, "b": 0x6f, "name": "Yellow", "css": "#B8C76F", "chr": 158 });
        this.m_Colors.push({ "r": 0x6f, "g": 0x4f, "b": 0x25, "name": "Orange", "css": "#6F4F25", "chr": 129 });
        this.m_Colors.push({ "r": 0x43, "g": 0x39, "b": 0x00, "name": "Brown", "css": "#433900", "chr": 149 });
        this.m_Colors.push({ "r": 0x9a, "g": 0x67, "b": 0x59, "name": "Lightred", "css": "#9A6759", "chr": 150 });
        this.m_Colors.push({ "r": 0x44, "g": 0x44, "b": 0x44, "name": "Darkgrey", "css": "#444444", "chr": 151 });
        this.m_Colors.push({ "r": 0x6c, "g": 0x6c, "b": 0x6c, "name": "Grey", "css": "#6C6C6C", "chr": 152 });
        this.m_Colors.push({ "r": 0x9a, "g": 0xd2, "b": 0x84, "name": "Lightgreen", "css": "#9AD284", "chr": 153 });
        this.m_Colors.push({ "r": 0x6c, "g": 0x5e, "b": 0xb5, "name": "Lightblue", "css": "#6C5EB5", "chr": 154 });
        this.m_Colors.push({ "r": 0x95, "g": 0x95, "b": 0x95, "name": "Lightgrey", "css": "#959595", "chr": 155 });
    }
    SetColorView() {
        let ptr = 0;
        for (let j = 0; j < 16; j++) {
            for (let i = 0; i < this.m_Colors.length; i++) {
                this.m_colorView[ptr++] = this.m_Colors[i].r;
                this.m_colorView[ptr++] = this.m_Colors[i].g;
                this.m_colorView[ptr++] = this.m_Colors[i].b;
                this.m_colorView[ptr++] = 255;
            }
        }
        this.m_isDirty = false;
    }
    SetColor(color, r, g, b, a) {
        const id = color * 4;
        this.m_isDirty = true;
    }
    GetColor(color) {
        return this.m_Colors[color];
    }
}
class G64Memory {
    get IsDone() { return this.m_isDone; }
    constructor() {
        this.m_isDirty = false;
        this.m_isDone = false;
        this.m_initStep = 0;
        this.ADR_CHARACTERROM = 0xE000;
        this.PTR_SCREENRAM = 0x0400;
        this.PTR_COLORRAM = 0xD800;
        this.PTR_SPRITEPTR = 0x07FF;
        this.PTR_FONTBANK = 0xE000;
        this.PTR_BITMAP = 0x0000;
        Genesis64.Instance.Log(" - G64 memory created\n");
    }
    Init() {
        switch (this.m_initStep) {
            case 0:
                this.InitRam();
                this.m_initStep++;
                break;
            case 1:
                this.InitFont();
                this.m_initStep++;
                break;
            case 2:
                this.SetFontRom();
                this.m_initStep++;
                break;
            case 3:
                this.SetBootMsg();
                this.m_initStep++;
                break;
            default:
                this.m_initStep = -666;
                break;
        }
        return this.m_initStep;
    }
    InitRam() {
        this._start("   ... setting up RAM values ... ");
        this.m_ramBuffer = new ArrayBuffer(1024 * 64);
        this.m_ramView = new Uint8Array(this.m_ramBuffer);
        this.m_ramView.fill(0);
        let val = true;
        for (let i = 0; i < this.m_ramView.length; i++) {
            if ((i % 64) == 0)
                val = !val;
            this.m_ramView[i] = (val) ? 255 : 0;
        }
        this._done();
    }
    InitFont() {
        this._start("   ... creating font data ... ");
        const imgFont = document.createElement("img");
        imgFont.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAACACAYAAADktbcKAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAE7JJREFUeNrsXYmO5LoN3DX8/7/8kkXSQUcrkcViUZI9EtDATLcl6+AtHr//+eefX3/a79+///PHf9u/v//9q2mfZ9rf2r7I"
            + "M9+/e+/ujf/9nPc7+v52vMgcrWe88Uf7au3793fZ+avPT9E/s3+R/UD2D/2fhT8Gx0b9o+1qXzpa1Pf/1oJ7/ZHx0Q39/qC/o++32vd4o81HnvGQ3WqfvqO5e98j+589P6Z/e16j8921eXA52qPeOX1+7yG8N/afPhZc9367kIcUCIQuRjF+5v2VLYP8HpKjv++EMDvNp0Ugdn5s/yyH9xj0CC6u6Es8CqMAcsX7vWdG"
            + "m1SNQJl9+fStQp7s+Y36twi2kkgh4nq7dpRAKJCf2R8P4Xvjfz53BEBRneczuBpQEfEKGYO1KagAUEEEomurJk7eOK1KVgEfGRWqRZIeEahAfmTsiAQTHeNaIUpaVK5SglixnhXqzSoR2bIfzVgzIsF4yMucUYXaoNyvnn3l87m/KVBrmMmIV+1LkfFRa3h0jor1WRyiHR/h0j0uU2XpVay/RYwRB++tL/t+pD/CRdv5"
            + "VKsXCIyPRHX0JoyRMv5v3M814Gmnnfbsxkgit+IFinvZ6PctB4pwT0aXe6JqUs29Iv0z56Py82D7V0pnqBSd7TOa/7UjAEbvMyM6HGvIscZt57vyloGxWyh14IwfgfferJ/H6PpROX8VB4+qSB58jp67ZyN2+1tEdxshqcLGkNHfVTaUHURFFjEVhsmIjwNyW4XCzywRnIU/RILx4FOiAjAbjrhaqoyE3oIrD92aqyWx"
            + "ZN6RMdSO9ndkLEINZyggI67YljjuGVEj8OPBX+93JSFkbi6iTGr0rjuD6CoJoAcQIx0/almt5sQI0GbuaZVrUAIaK0GhCNyz80TOItK3Bz8WF1WL/yjSIucVlTLKVYBIsAUqtmUlAeYQokZQxtGl0g11V9GXMSrvpDKp9sGCP5aQIfhwzwRQlIt6nmTW5mU5iMedkLnNVEFUgGGJwKgKM5KCqv0Adhk/e74RfxLGNpKW"
            + "ANgFZhEE6V/pxjoDeRXENTP3iFFNPT7ybPUclNJk5nwzrsDMcxe7kNFvu0ajoXPLrIEJVvqWOEaiOzOfNuiD/VTsP3ptmtlzNqgmCyPROJPIPDNrGn0oFWBmIEfW8vqWxhi1Ks8hsu9WZJrSwInchVfCzQr8iNjgeu1mAUC1yCfEryuQlV3n9wEie97qg6oQ1QxBmgXgXkYmj2BkjI4sflQZOlvnnxH83QiHtcSdCEAq"
            + "9drZBjRUf/Oy9mTDRZFbirdLRr1sQgiHr/LiYzM0VSD8aA9GeHyvPkyVcWUGAUEIHpJvoEIS2Bn5LeeiHSRGhZ8G6zylzhLlwV/7282IKZEJP50ToWGwM9Y8IgIrkR8lwC3wKcPNURWlOidBb36eM5tiTpHw5vbZ5TaA1RJExSYrEcmKe58VoYaK2Og4ivtyiyi0RBKZv8I4yaxvhbPT937cuyHaafMQUkFoV7k1R/Xd"
            + "WVLbKjxBg3/aPXITgiizlTIbFnWvVLltZufv5aLPSAm7u8RG+keyQK24Bt0pOzBTr8L7/Z5Jmd7IiY88ctqT2/0WJJwdQHKQ/x1E+o1+KD+KADyR8yut4RVi60wR+0hxa/f6rp7g7CAaNpIK7T9rPUfSeEfLGiPVSUj+8gM4RzSfW6iiKqu4RZXh64mSw2oGVz3+j7cBoElKnsqJTzDVs0X019sAnlLM8oD6aW9sN5rd"
            + "JcodeymnR+OzOditNMpodpXWW6znPYa6lY6yyER9GHrzG+0ZGxzUWxt7v4z29zz4ovYZ5P/I/qnqWzAwHsUxFeO8ehvWeyHiaYRWh/WIhje+lwRilL4pU/3WC49Fn8lEpHnVgZGS697+Z8+P6a9MELJKikWTqFjPeCnpEHUumvXoQh5S1k/3FjPD220VgCnCUVcFIr1h/z3irij8wfbPcniPQY/g4oq+xKMwlZVTIu/3"
            + "nhlt0uxrPqZvFfJkzw+trLOSSCHiOlt5SoH8zP54CO9WB0YBNOKXXxE9F6kcYz3Dpq9WAaCCCETXVk2cvHGQJB6zkB9BGCv6VYn8yNgRCSY6xsVy0ipOXilBrFjPCvVmlYhs2Y9mrJmtPZhVcSvUBnUim5G94lLqQNniikg1WEaMVKzP0rEiFNirL1AhJivWj+bd9yL+KoqPeiL8bBXKY3CIeO7doqgYw58Bf3QwxGmn"
            + "vaUxxPVWvCB7jxodv6enRayojBTyRNUkY0iKSmhRX47I+WTv2RX39LPSizHpwpA+o/lfOwJg9D4zosOxKggiunvzX20BH81FqQNn/Ai892b9PEbXj8r5qzh4VEVCStf1nrtnI3b7G2IBtfK+ff62PM2yyN97D/P+J4iKLGIqDJMRHwfEzoLCzywRnIU/NLjKgk+JCsBsOOJqqUBgyOBReOjWXC2JJfOOjDehlcZ6xD3Z"
            + "DNIeAnsi/8gghqTPQubmwZ9Vuk1BCJmbiyiTGr3rziC6SgLoAcRIx0cWNZMTI0CbuadVrkEJaKwEhSJwz84TOYtoqmyvf2XqdRRpkfOKShnlKgBbggnhECrREzmEqBGUcXSpdEPdVfRljMo7qUyqfbDgjyVkCD7cMwEU5aJIcUdPhGM5iMedkLnNVEFUgBGJ1otGrGVtJIyIvmL87Pm271HeAkgkgEwJ5wyCIP0r3Vhn"
            + "IK+CuGbmHjGqqcdHnq2eg1KazJxvxhWYee5iFzL6bddoNHRumTUwwUptLgLVfFqvNPZTsf/otWlmz9mgmiyMRONMIvPMrGn0oVSAmYEcJ61zXJ2pvKNm9t1yfVUaOJG78Eq4WYEfERtcr9GlwVSLfGO6LWXprjZjTyTHXybKDIkv3wHIRxmNLK47IhgZoyOLH1WGzlFWpL8IAMJhLXGnOunkaiCLGJYsYMzqeAgReIoj"
            + "kvpM0JRtVV58bIamCoQf7cEIjx+fFHSmioDWe69Ii+0RgZ2R33Iu2kFiVPhpsM5T6ixRHvz9VRuQEVMiE346J2rXjhKBGeLuCscnlgC3wJdFfs8xZ3YF5dH6PGc2xZwiiWDaZ5fbAFZLEBWbrEQkKzPNrAg1VMRGx1Hcl1tEoSWSyPwVxklmfSucnb73494N0U6bh5AKQrvKrTmq786S2lbhCRr88xex+uUkBFFmK2U2"
            + "LOpeqXLbzM7fy0WfkRJ2d4mN9EfPN/LeqnRaM/YKyWugzGNwz6RMb+TERx457cntfgsSzg4gOcj/DiL908u+nerAC5BfaQ2vEFtnithHilu713f1BGcH0bCRVGj/Wes5ksY7WtYYqU5C8pcfwDmi+dxCFVVZxS2qDF9PlBxWM7jq8X+8DQBNUvJUTnyCqZ4tor/eBvCUYpYH1E97Y7vR7C4swqoQnDVQRavpRiqrsvNm"
            + "Um5X7bl6vcyeo++s3ouZTCSaN6DKrfkeicFR/+IKHZQZj/GzRt/HPof0q0w6+VR17qepDG349qg2Abt/3WAgVNzNUqAZ/dEko9XSDMupvL2P2DkiHITpn32/1Z+tMBVJPvv9nWr8DBwo8SPiCn1FABSpDttLbYXUhx/17fW3gOZ7LKv/aBOtOaAVW6znolVfrL5WAUm2OCva34IRr7+XEqwytVxVdWCr6GcUeRXxFSM4"
            + "aasr3SjVQialUiGYO3gvJVSEc/fmr4xie7uIP4ocXa3mWNWBFfDD9s++O6JqwhIAwwFmABaTsJKtuVaFGNl79kruiNbGy5xdZg/Q80W4sZUGPAo/CrtVVV6HUQny/yUF9Si0lbUWMWRlx1dwkOzmIumVItTeSpDhpWHLvNMaBy3IqhBRrSQeVlx/lotahTc8CRBBVm+PLWmXrXadsTH9WeWPsS5nEanSiLPD/qy69Xka"
            + "/Oy6buZcbsULFFbZ6PdeiilLBLRsFNG5PRHhWQkhcsuSucdmrOxMjsQI/KgkwAixiRLkiA3v89y1I5X1xD3vlgExJEYBHLn98Oa/2gYxmktk/7w9zdxCeO8d2YCYW46q+as4OHMLYcHn6Ll7NmK3vyG6m5X3Tc3BEP1xdEPwFGeeqL8Egpio/SWqqjHc0fLurFRfEEcchXRlrdOyX6RVAGbDEUcLBQIjAFd56NZcPaMT"
            + "+w6VxXlEkBEjEgvIFlIi6oTn7BKBH5URnIVLpXppJULtvevOILpKAugBxEjHj1pWqzkxArSZe1rlGirtGKgEhSIwo2sr/VAsLqoW/1GkRc4rKmWUqwBsCSaEQ6hET+QQokZQxlBU6Yiyq+jLGJV3UplU+2DBn+p2Jl0ZqLq0UqS4oyfCsRzE407I3Ha7KUAAwxKBURVmJAVlbSSMiL5ifEUUJeOOjK47LQFkXWxZBKkO"
            + "2d0BeRXENTP3iFFNPT7ybPUclNJk5nwrQ567kmHEESiSLScTjYZ6QanviVFvL9Ram/WLsPY9Es0W3f/s+Sn6Z/Zv12hAbx5KFQ/9/4oiv7fgbDQaMv7onjR7T4xST4TTsvowcgbRq7qKaEBl/5nRgFV2LiZGZYX61/5/RQdRVTP1kKjSYWbVQSnE/FWFSd+w/4gNanZE4GcvWCexb5tVa8NCpIE7crepctRYZW325jgD"
            + "ebI6vqrAZsX5VRnp1Gv0qgmz4cxoVN/sa2qLSFzRwZiEELM4B8JZsv2VSKYmIAortGIPPPVslaRiqVCeiuupd6zk0OPYzJmNkNyzA1yt/jJDn6mKq16pZ0UTpuwoYWRFZCtb04w1IyI8EwuQkUytDEgzYFxiA2AQwUsowVDRNp3RTB0PTRiBcmkv7djMhBmM9MVWRWZTbnn9I0baasYWOb/VNoAfkQ/gtNN2kRQzKgRy"
            + "jRh95kYnzYqY2QCKqOFvhxTf6EEoAWg1ALP90fONvLcqnVbW4MhIhlk34F4eg+mxAE+n3JYo9dPLS59WT4Qq2/1m5FQQoGz14dP2gI+ZiPokQ/apDkwcqEoUZseoqhKMIsObiJ8CSS234t0libt6grODaLIJLrN+++r9PCrGcxkFc55R57TseEcCWGADUEVVVnGLKiPlEyWHKAJWhcofFaDIBqCOAHs6AJ+2L7K+kgA8"
            + "AZF2y1Bz2kF8GQGIxPgzCKtCcNZAFY2e84qORufk+Z1X7F92fFUNRPU7q/eiEi6zOS6qAtfuEWeLRJypxeLMeEzyRvR97HNIv8qkk09V597YIuXNRjkV2P3r4TRcHThLgWb0j9Srr5RmWE6F5khAVJEIB2H6Z99v9a/KBDSKT1BmGmLhQIkfPUQfzTGUEQiJButFObXBHFY2GS/KDA0GYarbotmGkMOwkDlzC4CUPOvt"
            + "h7d/0f4WjHj9vUpKldGDVdGAvTWwyKtIGz+Ck2514IhughrLMioEk9yyR8kzxr6KenA/xYtwlJ15tZpjRQMq4Iftn3135obqinCa1bXt2HBZtuZaFWJk79kruSOa0y9zdpk9QM8X4cZWBqMo/CjsVlWZgnrS1edzIxQazVgS6R8ZX8FBspvr6VhRat+OgY6fsS9EUlUp9w+1v4zi2BH4Q7moVXjDkwARZEWzJVuqEmpD"
            + "UdiY/nzxeouzwgBYbcTZYX9W3fo8DX52XTdzLrfiBSpvusj3Fgf1REDLRhGd2xMRnpUQIrcsmXtsxsoeveWI9B9Vg64mNoyPQbRGwbUjlUWSf44ABjUkRgEcuf3w5r9TOuzvuVSn7Mrm7PNsQMwtR9X8VRycuYWw4HP03D0bsdvfEN1tdNgVHAzRH0c3BE9x5on6SyCIidpfoqoawx0tj83qrNUIF1b4sIzWadkv0ioA"
            + "s+GIo4UCgRGAqzx0a66e0Yl9h8riPCLIiBGJBWQLKRF1wnN2icCPygjOwqVSvRwRgdG77gyiqySAHkCMdPyoZXWWLzhig8jcE8/gUNlqTyhnRhCY0bWVfigWF1WL/yjSIucVlTLKVYCIqyUqtmUlAeYQokZQxlBU6Yiyq+jLGJV3UplU+2DBn+p2pvf9PRNAUS7K3FGPXJBVRCAyt91uChDAsERgVIUZSUFZGwkjoq8Y"
            + "XxFFybgjo+tOSwBZF1sWQZD+1WHH1cirIK6ZuUeMaurxkWer51BddLVCao326e7rr4AjUCR3eSYaDfWCUt8To95eqLVWXWeejWaL7n/2/BT9M/u3azSgNw+liof+f0WR31vwytJg2XtilHoinJbVh5EziF7VVUQDKvvPjAassnNVlHSrkCzb/6/oIKoa9yuLg646KIWYn6l+vBvC7DSfb+NtlSHW2otV1YHvyN2mylFj"
            + "lbXZm+PMaq0ZI1FVRaLs+VUZ6dRrtKzwI5sT66fixerPuKa2iMQVHYxJCDGLcyCcJdtfiWRqAqKwQiv2wFPPVkkqlgrlqbieesdKDqurA1+t/jJDn6mKq16pZ0UTpuwoYWRFZCtb04w1IyI8EwuQkUytDEgzYFxiA2AQwUsowVDRNp3RTB0PTRiBcmkv7djMhBmM9BW5mVGk3PL6R4y01Ywtcn6rbQA/Ih/AaaftIilm"
            + "VAjkGjH6zI1OmhUxswEUUcPfDim+0YNQAtBqAGb7o+cbeW9VOq2swZGRDLNuwL08BtNjAZ5OuS1R6pQJP62aCFW2+83IqSBApyzYO+BjJqI+yZB9qgMTB6oShdkxqqoEo8jwJuKnQFLLrXh3SeKunuDsIJpsgsvV1YGfnFz0MAouhsT6XZ2EpB3vSAALbACqqMoqblFlpHyi5BBFwKpQ+aMCFNkA1BFgTwfg0/ZF1lcS"
            + "gCcg0m4Zak47iK9q/xJgAF348sAfGGjJAAAAAElFTkSuQmCC");
        imgFont.width = 256;
        imgFont.height = 128;
        const canvasFont = document.createElement("canvas");
        canvasFont.id = "G64Font";
        canvasFont.width = 256;
        canvasFont.height = 128;
        this.m_ctxFont = canvasFont.getContext("2d");
        imgFont.onload = (event) => {
            this.m_ctxFont.drawImage(imgFont, 0, 0);
            this._done();
        };
    }
    SetFontRom() {
        this._start("   ... copy font data to ram ... ");
        const w = this.m_ctxFont.canvas.width;
        const h = this.m_ctxFont.canvas.height;
        const imgDataChr = this.m_ctxFont.getImageData(0, 0, w, h);
        let ptr = 0;
        let pixel;
        let aBank = [this.ADR_CHARACTERROM, this.ADR_CHARACTERROM + 0x1000];
        let byte = 0;
        for (let bank = 0; bank < aBank.length; bank++) {
            ptr = aBank[bank];
            for (let y = (bank * 8); y < (8 * (bank + 1)); y++) {
                for (let x = 0; x < 32; x++) {
                    for (let yy = 0; yy < 8; yy++) {
                        byte = 0;
                        for (let xx = 0; xx < 8; xx++) {
                            pixel = ((xx * 4) + (x * 8 * 4)) + ((yy * w * 4) + (y * 8 * w * 4));
                            byte = BitHelper.BitPlace(byte, 7 - xx, (imgDataChr.data[pixel + 3] >= 128));
                        }
                        this.m_ramView[ptr++] = byte;
                    }
                }
            }
        }
        this._done();
    }
    SetBootMsg() {
        this._start("   ... writing boot message ... ");
        const strBootMsg = "                                        " +
            "     **** genesis 64 v. " + Genesis64.Instance.Version + " ****      " +
            "                                        " +
            " 64k ram system  38911 basic bytes free " +
            "                                        " +
            "ready.                                  ";
        for (let i = 0; i < strBootMsg.length; i++) {
            this.m_ramView[this.PTR_SCREENRAM + i] = Petscii.TXTSCREENCODE.indexOf(strBootMsg.charAt(i));
        }
        this._done();
    }
    _start(message) {
        Genesis64.Instance.Log(message);
        this.m_isDone = false;
    }
    _done() {
        Genesis64.Instance.Log("OK\n");
        this.m_isDone = true;
    }
    Poke(ptr, byte) {
        this.m_ramView[ptr] = byte;
        this.m_isDirty = true;
    }
    Peek(ptr) {
        return this.m_ramView[ptr];
    }
}
var KeyboardMode;
(function (KeyboardMode) {
    KeyboardMode[KeyboardMode["default"] = 0] = "default";
    KeyboardMode[KeyboardMode["german"] = 1] = "german";
})(KeyboardMode || (KeyboardMode = {}));
class Genesis64 {
    constructor() {
        this.m_LogBuffer = "";
        this.Version = "0.0.1";
    }
    static get Instance() {
        if (typeof this.m_instance === "undefined") {
            this.m_instance = new this();
            this.m_instance.Init();
        }
        return this.m_instance;
    }
    get Memory() { return this.m_Mem; }
    get Options() { return this.m_Options; }
    Init() {
        this.m_Options = {
            basicVersion: BasicVersion.v2,
            keyboardMode: KeyboardMode.default
        };
        this.m_fsm = new MiniFSM("init", false);
        this.m_Mem = new G64Memory();
        this.m_colors = new G64Colors();
        this.m_Basic = new G64Basic();
        this.m_fsm.AddSingle("Startup", () => {
            this.Log("Starting Genesis64\n");
            this.m_fsm.SetState("CreateHTML");
        }, FsmActionType.onEnter);
        this.m_fsm.AddSingle("CreateHTML", () => {
            this.m_divContainer = document.getElementById("Genesis64");
            this.m_fsm.SetState("InitRam");
        }, FsmActionType.onEnter);
        this.m_fsm.Add("InitRam", "", () => {
            if (this.m_Mem.Init() === -666)
                this.m_fsm.SetState("SetColors");
        }, null, () => { if (this.m_Mem.IsDone) {
            this.m_fsm.SetState("InitRam");
        } });
        this.m_fsm.AddSingle("SetColors", () => {
            this.m_colors.SetColorView();
            this.m_fsm.SetState("InitBasic");
        }, FsmActionType.onEnter);
        this.m_fsm.AddSingle("InitBasic", () => {
            this.m_Basic.Init({ basicVersion: BasicVersion.v2 });
            this.m_fsm.SetState("Done");
        }, FsmActionType.onEnter);
        this.m_fsm.AddSingle("Done", () => {
            console.log("Genesis64 instance initialized.");
            this.m_fsm.StopTimer();
            this.m_fsm.SetState("Test");
        }, FsmActionType.onEnter);
        this.m_fsm.AddSingle("Test", () => {
            this.m_Basic.Temp("10 ?\"test\": rem test\n" +
                "20 rem goto10: print \"nope\"\n" +
                "30 printend\n" +
                "40 leta=1:leta(2)=2:leta(b(3))=3\n" +
                "50 a=4:a(2)=5:a(b(3))=6\n" +
                "60printa,a(2),a(b(3))" +
                "70printa,abs(-2),a(b(3)), sin(a(1))");
        }, FsmActionType.onEnter);
        this.m_fsm.StartTimer(100);
        this.m_fsm.Unpause();
        this.m_fsm.SetState("Startup");
    }
    SetOptions(options) {
        this.m_Options = {
            ...options
        };
    }
    Log(message) {
        this.m_LogBuffer += message;
        if (this.m_LogBuffer.endsWith("\n")) {
            console.log(this.m_LogBuffer.substring(0, this.m_LogBuffer.length - 1));
            this.m_LogBuffer = "";
        }
    }
}
class Petscii {
    static PetToBas(pet) {
        let basText = "";
        let bas = "";
        for (let i = 0; i < pet.length; i++) {
            bas = Petscii.BasText[pet[i]];
            basText += (bas.length == 1) ? bas : "{" + bas + "}";
        }
        return basText;
    }
    static BasToPet(text) {
        let pet = [];
        let bas = new Map();
        for (let i = 0; i < Petscii.BasText.length; i++) {
            bas.set(Petscii.BasText[i], i);
        }
        let c = 0;
        let len = -1;
        while (len++ < text.length) {
            c++;
            if (c > 256)
                break;
            if (text.charAt(len) == "{") {
                let end = text.indexOf("}", len);
                if (end == -1)
                    end = text.length - 1;
                let basText = text.substring(len + 1, end);
                if (bas.has(basText)) {
                    pet.push(bas.get(basText));
                }
                else {
                    pet.push(46);
                }
                len = end;
                continue;
            }
            if (bas.has(text.charAt(len))) {
                pet.push(bas.get(text.charAt(len)));
            }
            else {
                if (text.charAt(len) != "")
                    pet.push(46);
            }
        }
        return pet;
    }
    static PetToText(pet) {
        let text = Petscii.BasText[pet];
        if (text.length > 1)
            text = "{" + text + "}";
        return text;
    }
    static ScreenToPet(screen) {
        let pet = screen;
        if (screen <= 31) {
            pet = screen + 64;
        }
        else if (screen >= 32 && screen <= 63) {
        }
        else if (screen >= 64 && screen <= 93) {
            pet = screen + 128;
        }
        else if (screen >= 96 && screen <= 127) {
            pet = screen + +64;
        }
        else if (screen >= 128 && screen <= 159) {
            pet = screen - 128;
        }
        else if (screen >= 160 && screen <= 191) {
            pet = screen - 64;
        }
        else if (screen >= 192 && screen <= 223) {
            pet = screen - 64;
        }
        else if (screen >= 224 && screen <= 254) {
        }
        return pet;
    }
    static PetToScreen(pet) {
        let code = pet;
        if (pet <= 31) {
            code = pet + 128;
        }
        else if (pet >= 64 && pet <= 95) {
            code = pet - 64;
        }
        else if (pet >= 96 && pet <= 127) {
            code = pet - 32;
        }
        else if (pet >= 128 && pet <= 159) {
            code = pet + 64;
        }
        else if (pet >= 160 && pet <= 191) {
            code = pet - 64;
        }
        else if (pet >= 192 && pet <= 254) {
            code = pet - 128;
        }
        return code;
    }
    static BasToHtml(text, useLower = false) {
        const low = useLower ? 1 : 0;
        const pet = this.BasToPet(text);
        let literal = "";
        for (let i = 0; i < pet.length; i++) {
            if (pet[i] >= 0) {
                if (pet[i] <= 31 || (pet[i] >= 128 && pet[i] <= 159)) {
                    literal += "&#xe" + (low + 2).toString() + (pet[0] + 64).toString(16).padStart(2, "0") + ";";
                }
                else {
                    literal += "&#xe" + low.toString() + pet[i].toString(16).padStart(2, "0") + ";";
                }
            }
        }
        return literal;
    }
}
Petscii.BasText = [
    "null",
    "ct a",
    "ct b",
    "ct c",
    "ct d",
    "white",
    "ct f",
    "ct g",
    "ct h",
    "ct i",
    "ct j",
    "ct k",
    "ct l",
    "return",
    "ct n",
    "ct o",
    "ct p",
    "down",
    "reverse on",
    "home",
    "delete",
    "ct u",
    "ct v",
    "ct w",
    "ct x",
    "ct y",
    "ct z",
    "027",
    "red",
    "right",
    "green",
    "blue",
    " ",
    "!",
    "\"",
    "#",
    "$",
    "%",
    "&",
    "'",
    "(",
    ")",
    "*",
    "+",
    ",",
    "-",
    ".",
    "/",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ":",
    ";",
    "<",
    "=",
    ">",
    "?",
    "@",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "[",
    "pound",
    "]",
    "^",
    "arrow left",
    "096",
    "097",
    "098",
    "099",
    "100",
    "101",
    "102",
    "103",
    "104",
    "105",
    "106",
    "107",
    "108",
    "109",
    "110",
    "111",
    "112",
    "113",
    "114",
    "115",
    "116",
    "117",
    "118",
    "119",
    "120",
    "121",
    "122",
    "123",
    "124",
    "125",
    "126",
    "127",
    "128",
    "orange",
    "130",
    "131",
    "132",
    "f1",
    "f3",
    "f5",
    "f7",
    "f2",
    "f4",
    "f6",
    "f8",
    "141",
    "142",
    "143",
    "black",
    "up",
    "reverse off",
    "clear",
    "148",
    "brown",
    "pink",
    "dark gray",
    "gray",
    "light green",
    "light blue",
    "light gray",
    "156",
    "left",
    "yellow",
    "cyan",
    "sh space",
    "cm k",
    "cm i",
    "cm t",
    "cm @",
    "cm g",
    "cm +",
    "cm m",
    "cm pound",
    "sh pound",
    "cm n",
    "cm q",
    "cm d",
    "cm z",
    "cm s",
    "cm p",
    "cm a",
    "cm e",
    "cm r",
    "cm w",
    "cm h",
    "cm j",
    "cm l",
    "cm y",
    "cm u",
    "cm d",
    "sh @",
    "cm f",
    "cm c",
    "cm x",
    "cm v",
    "cm b",
    "sh asterisk",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "sh +",
    "cm -",
    "sh -",
    "222",
    "cm asterisk",
    "224",
    "225",
    "226",
    "227",
    "228",
    "229",
    "230",
    "231",
    "232",
    "233",
    "234",
    "235",
    "236",
    "237",
    "238",
    "239",
    "240",
    "241",
    "242",
    "243",
    "244",
    "245",
    "246",
    "247",
    "248",
    "249",
    "250",
    "251",
    "252",
    "253",
    "254",
    "pi",
];
Petscii.TXTSCREENCODE = "@abcdefghijklmnopqrstuvwxyz[£]^_ !\"#$%&'()*+,-./0123456789:;<=>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ~~~|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~";
class BitHelper {
    static Byte(bits) {
        let byte;
        if (typeof bits === "number") {
            byte = bits;
        }
        else {
            byte = this.BitCreate(bits);
        }
        return byte;
    }
    static BitCreate(bits) {
        let byte = 0;
        for (let i = 0; i < 8; i++) {
            if (bits.charAt(i) == "1") {
                byte = this.BitSet(byte, 7 - i);
            }
        }
        return byte;
    }
    static BitTest(byte, bit) {
        return (((byte >> bit) % 2) != 0);
    }
    static BitSet(byte, bit) {
        return (byte | (1 << bit));
    }
    static BitClear(byte, bit) {
        return byte & ~(1 << bit);
    }
    static BitToggle(byte, bit) {
        return (this.BitTest(byte, bit)) ? this.BitClear(byte, bit) : this.BitSet(byte, bit);
    }
    static BitPlace(byte, bit, set) {
        return (set) ? this.BitSet(byte, bit) : this.BitClear(byte, bit);
    }
}
class CodeHelper {
    static CodeSplitter(code, chars) {
        let aResult = [];
        let tuple = [];
        let iPos = 0;
        const len = chars.length;
        const open = "([{\"'";
        const close = ")]}\"'";
        if (code.includes(chars)) {
            while (iPos < code.length) {
                if (open.includes(code.charAt(iPos))) {
                    const item = open.indexOf(code.charAt(iPos));
                    tuple = this.FindMatching(code, iPos, open.charAt(item), close.charAt(item));
                    if (this.IsMatching(tuple)) {
                        iPos = tuple[1];
                    }
                }
                if (code.substring(iPos, iPos + len) == chars) {
                    aResult.push(code.substring(0, iPos).trim());
                    code = code.substring(iPos + len);
                    iPos = 0;
                }
                else {
                    iPos++;
                }
            }
        }
        aResult.push(code.trim());
        return aResult;
    }
    static FindMatching(code, offset, start, end) {
        if (typeof code == "undefined") {
            console.log("You fucked up in FindMatching", code);
            return [-1, -1];
        }
        if (typeof start === "undefined")
            start = "(";
        if (typeof end === "undefined")
            end = ")";
        const iStart = code.indexOf(start, (typeof offset === "undefined") ? 0 : offset);
        let iEnd = -1;
        let i;
        let count = 0;
        if (iStart != -1) {
            for (i = iStart; i < code.length; i++) {
                if (code.charAt(i) == start)
                    count++;
                if (code.charAt(i) == end)
                    count--;
                if (count == 0) {
                    iEnd = i;
                    break;
                }
            }
        }
        return [iStart, iEnd];
    }
    static IsMatching(tuple) {
        return (tuple.length == 2 && tuple[0] != -1 && tuple[1] != -1);
    }
    static EncodeLiterals(line) {
        let item = { Source: line, List: new Array() };
        let iStart, iEnd, i, id;
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
                if (iEnd == -1) {
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
class MersenneTwister {
    constructor() {
        this.N = 624;
        this.M = 397;
        this.MATRIX_A = 0x9908b0df;
        this.UPPER_MASK = 0x80000000;
        this.LOWER_MASK = 0x7fffffff;
        this.MAX_RAND_INT = 0x7fffffff;
        this.mag01 = [0x0, this.MATRIX_A];
        this.mt = new Array();
        this.mti = this.N + 1;
    }
    MersenneTwister() {
        if (typeof MersenneTwister._instance !== "undefined") {
            console.log("Cannot have two instances of MersenneTwister.");
        }
        else {
            this.init_genrand(new Date().getTime());
            MersenneTwister._instance = this;
        }
    }
    static get Instance() {
        if (typeof MersenneTwister._instance === "undefined") {
            return new MersenneTwister();
        }
        return MersenneTwister._instance;
    }
    get MaxRandomInt() { return this.MAX_RAND_INT; }
    Next(minValue, maxValue) {
        if (typeof minValue === "undefined" && typeof maxValue === "undefined") {
            return this.genrand_int31();
        }
        if (typeof maxValue === "undefined") {
            maxValue = minValue;
            minValue = 0;
        }
        if (minValue > maxValue) {
            let tmp = maxValue;
            maxValue = minValue;
            minValue = tmp;
        }
        return Math.floor((maxValue - minValue + 1) * this.genrand_real2() + minValue);
    }
    NextFloat(includeOne) {
        if (typeof includeOne === "undefined") {
            return this.genrand_real2();
        }
        if (includeOne) {
            return this.genrand_real1();
        }
        return this.genrand_real2();
    }
    NextFloatPositive() {
        return this.genrand_real3();
    }
    NextDouble(includeOne) {
        if (typeof includeOne === "undefined") {
            return this.genrand_real2();
        }
        if (includeOne) {
            return this.genrand_real1();
        }
        return this.genrand_real2();
    }
    NextDoublePositive() {
        return this.genrand_real3();
    }
    Next53BitRes() {
        return this.genrand_res53();
    }
    Init(seed) {
        if (typeof seed === "undefined") {
            this.init_genrand(new Date().getTime() + Math.random());
        }
        else {
            if (typeof seed === "number") {
                this.init_genrand(Math.floor(seed));
            }
            else {
                let initArray = new Array();
                for (var i = 0; i < seed.length; i++) {
                    initArray.push(seed[i]);
                }
                this.init_by_array(initArray, initArray.length);
            }
        }
    }
    init_genrand(s) {
        this.mt[0] = s & 0xffffffff;
        for (this.mti = 1; this.mti < this.N; this.mti++) {
            this.mt[this.mti] =
                (1812433253 * (this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >> 30)) + this.mti);
            this.mt[this.mti] &= 0xffffffff;
        }
    }
    init_by_array(init_key, key_length) {
        let i, j, k;
        this.init_genrand(19650218);
        i = 1;
        j = 0;
        k = (this.N > key_length) ? this.N : key_length;
        for (; k > 0; k--) {
            this.mt[i] = ((this.mt[i] ^ ((this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) * 1664525)) + init_key[j] + j);
            this.mt[i] &= 0xffffffff;
            i++;
            j++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
            if (j >= key_length)
                j = 0;
        }
        for (k = this.N - 1; k > 0; k--) {
            this.mt[i] = ((this.mt[i] ^ ((this.mt[i - 1] ^ (this.mt[i - 1] >> 30)) * 1566083941)) - i);
            this.mt[i] &= 0xffffffff;
            i++;
            if (i >= this.N) {
                this.mt[0] = this.mt[this.N - 1];
                i = 1;
            }
        }
        this.mt[0] = 0x80000000;
    }
    genrand_int32() {
        let y;
        if (this.mti >= this.N) {
            let kk;
            if (this.mti == this.N + 1)
                this.init_genrand(5489);
            for (kk = 0; kk < this.N - this.M; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + this.M] ^ (y >> 1) ^ this.mag01[y & 0x1];
            }
            for (; kk < this.N - 1; kk++) {
                y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
                this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >> 1) ^ this.mag01[y & 0x1];
            }
            y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
            this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >> 1) ^ this.mag01[y & 0x1];
            this.mti = 0;
        }
        y = this.mt[this.mti++];
        y ^= (y >> 11);
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= (y >> 18);
        return y;
    }
    genrand_int31() {
        return Math.floor(this.genrand_int32() >> 1);
    }
    genrand_real1() {
        return this.genrand_int32() * (1.0 / 4294967295.0);
    }
    genrand_real2() {
        return this.genrand_int32() * (1.0 / 4294967296.0);
    }
    genrand_real3() {
        return ((this.genrand_int32()) + 0.5) * (1.0 / 4294967296.0);
    }
    genrand_res53() {
        let a = this.genrand_int32() >> 5, b = this.genrand_int32() >> 6;
        return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
    }
}
class MiniFSMState {
    constructor(_Name, _Parameter, _OnEnterID, _OnUpdateID, _OnExitID) {
        this.toString = () => {
            return "FSMState: " + this.Name + " -> p: " + this.Parameter + ", s: " + this.OnEnterID + ", u: " + this.OnUpdateID + ", e: " + this.OnExitID;
        };
        this.Name = _Name;
        this.Parameter = _Parameter;
        this.OnEnterID = _OnEnterID;
        this.OnUpdateID = _OnUpdateID;
        this.OnExitID = _OnExitID;
        this.IsLateUpdate = false;
        this.IsRunning = true;
    }
}
class MiniFSMWorker {
    constructor(_Name, _WorkerID, _IsRunning) {
        this.toString = () => {
            return "FsmWorker: " + this.Name + " -> id: " + this.WorkerID;
        };
        this.Name = _Name;
        this.WorkerID = _WorkerID;
        this.IsRunning = _IsRunning;
    }
}
var FsmActionType;
(function (FsmActionType) {
    FsmActionType[FsmActionType["onEnter"] = 0] = "onEnter";
    FsmActionType[FsmActionType["onUpdate"] = 1] = "onUpdate";
    FsmActionType[FsmActionType["onExit"] = 2] = "onExit";
})(FsmActionType || (FsmActionType = {}));
class MiniFSM {
    get Name() { return this.m_Name; }
    set Name(value) { this.m_Name = value; }
    get State() { return ((this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) ? this.m_lstStates[this.m_iCurrentState].Name : ""); }
    get Parameter() { return ((this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) ? this.m_lstStates[this.m_iCurrentState].Parameter : ""); }
    set Parameter(value) {
        if (this.m_iCurrentState >= 0 && this.m_iCurrentState < this.m_lstStates.length) {
            let state = this.m_lstStates[this.m_iCurrentState];
            state.Parameter = value;
            this.m_lstStates[this.m_iCurrentState] = state;
        }
    }
    get StateID() { return this.m_iCurrentState; }
    get NextState() { return this.m_NextState; }
    set NextState(value) { this.m_NextState = value; }
    get LastState() { return ((this.m_iLastState != -1) ? this.m_lstStates[this.m_iLastState].Name : ""); }
    get IsRunning() { return this.m_isRunning; }
    set IsRunning(value) { this.m_isRunning = value; }
    get Debug() { return this.m_debug; }
    set Debug(value) { this.m_debug = value; }
    constructor(name, isRunning) {
        this.m_Name = "";
        this.m_isRunning = true;
        this.m_isRunningState = false;
        this.m_debug = false;
        this.m_iCurrentState = -1;
        this.m_iCurrentStateUpdate = -1;
        this.m_iLastState = -1;
        this.m_iWorker = -1;
        this.m_NextState = "";
        this.m_mapStates = new Map();
        this.m_lstStates = [];
        this.m_lstWorker = [];
        this.m_lstAction = [];
        this.m_iTimerId = -1;
        if (typeof name !== "undefined") {
            this.m_Name = name;
        }
        if (typeof isRunning !== "undefined") {
            this.m_isRunning = isRunning;
        }
        else {
            this.m_isRunning = false;
        }
    }
    Update() {
        if (this.m_isRunning) {
            for (this.m_iWorker = 0; this.m_iWorker < this.m_lstWorker.length; this.m_iWorker++) {
                if (this.m_lstWorker[this.m_iWorker].IsRunning)
                    this.m_lstAction[this.m_lstWorker[this.m_iWorker].WorkerID]();
            }
            if (this.m_iCurrentStateUpdate != -1)
                if (this.m_lstStates[this.m_iCurrentState].IsRunning)
                    this.m_lstAction[this.m_iCurrentStateUpdate]();
        }
    }
    StartTimer(delay) {
        if (this.m_iTimerId != -1)
            this.StopTimer();
        this.m_iTimerId = setInterval(() => { this.Update(); }, delay);
    }
    StopTimer() {
        if (this.m_iTimerId != -1)
            clearInterval(this.m_iTimerId);
        this.m_iTimerId = -1;
    }
    Reset() {
        this.m_isRunning = false;
        this.m_isRunningState = false;
        this.m_iCurrentState = -1;
        this.m_iCurrentStateUpdate = -1;
        this.m_iLastState = -1;
        this.m_iWorker = -1;
        this.m_NextState = "";
        this.m_mapStates.clear();
        this.m_lstStates = [];
        this.m_lstWorker = [];
        this.m_lstAction = [];
    }
    SetState(name, parameter) {
        let id = -1;
        this.m_iCurrentStateUpdate = -1;
        this.m_isRunningState = false;
        if (typeof parameter === "undefined")
            parameter = "";
        if (this.m_mapStates.has(name)) {
            this.m_lstStates[this.m_mapStates.get(name)].Parameter = parameter;
        }
        else {
            return;
        }
        if (this.m_debug)
            console.log("fsm -> setstate:", name, parameter);
        if (this.m_iCurrentState != -1 && parameter != MiniFSM.SKIP_ONEXIT) {
            id = this.m_lstStates[this.m_iCurrentState].OnExitID;
            if (id != -1)
                this.m_lstAction[id]();
            this.m_iLastState = this.m_iCurrentState;
            this.m_iCurrentState = -1;
        }
        if (this.m_mapStates.has(name)) {
            id = this.m_mapStates.get(name);
            this.m_iCurrentState = id;
            if (this.m_lstStates[id].OnEnterID != -1)
                this.m_lstAction[this.m_lstStates[id].OnEnterID]();
            if (this.m_lstStates[id].OnUpdateID != -1) {
                this.m_iCurrentStateUpdate = this.m_lstStates[id].OnUpdateID;
                this.m_isRunningState = true;
            }
        }
        else {
            console.error("MiniFSM: missing state -> " + name + ".");
        }
    }
    Pause(name) {
        if (typeof name === "undefined") {
            this.m_isRunning = false;
        }
        else {
            if (this.m_mapStates.has(name)) {
                this.m_lstStates[this.m_mapStates.get(name)].IsRunning = false;
            }
        }
    }
    PauseWorker(name) {
        if (this.m_mapStates.has(name)) {
            this.m_lstWorker[this.m_mapStates.get(name)].IsRunning = false;
        }
    }
    Unpause(name) {
        if (typeof name === "undefined") {
            this.m_isRunning = true;
        }
        else {
            if (this.m_mapStates.has(name)) {
                this.m_lstStates[this.m_mapStates.get(name)].IsRunning = true;
            }
        }
    }
    UnpauseWorker(name) {
        if (this.m_mapStates.has(name)) {
            if (typeof this.m_lstWorker[this.m_mapStates.get(name)] !== "undefined")
                this.m_lstWorker[this.m_mapStates.get(name)].IsRunning = true;
        }
    }
    Next() {
        this.SetState(this.GetNextState());
    }
    Exit() {
        this.m_iCurrentStateUpdate = -1;
        this.m_isRunningState = false;
        this.m_iLastState = this.m_iCurrentState;
        if (this.m_lstStates[this.m_iCurrentState].OnExitID != -1)
            this.m_lstAction[this.m_lstStates[this.m_iCurrentState].OnExitID]();
        this.m_iCurrentState = -1;
    }
    GetNextState() {
        const tmp = this.m_NextState;
        this.m_NextState = "";
        return tmp;
    }
    IsState(name) {
        return (this.State == name);
    }
    IsParameter(parameter) {
        return (this.Parameter == parameter);
    }
    Add(name, parameter, onEnter, onExit, onUpdate) {
        let id = -1;
        if (typeof parameter === "undefined")
            parameter = "";
        if (typeof onEnter === "undefined")
            onEnter = null;
        if (typeof onExit === "undefined")
            onExit = null;
        if (typeof onUpdate === "undefined")
            onUpdate = null;
        if (!this.m_mapStates.has(name)) {
            id = this.m_lstStates.length;
            this.m_lstStates.push(new MiniFSMState(name, (parameter != null) ? parameter : "", (onEnter != null) ? this.AddAction(onEnter) : -1, (onUpdate != null) ? this.AddAction(onUpdate) : -1, (onExit != null) ? this.AddAction(onExit) : -1));
            this.m_mapStates.set(name, id);
        }
        else {
            console.error("MiniFSM: Cannot add state '" + name + "', name already exists.");
        }
        return id;
    }
    AddSingle(name, action, type) {
        let id = -1;
        switch (type) {
            case FsmActionType.onEnter:
                id = this.Add(name, "", action);
                break;
            case FsmActionType.onExit:
                id = this.Add(name, "", null, action);
                break;
            case FsmActionType.onUpdate:
                id = this.Add(name, "", null, null, action);
                break;
        }
        return id;
    }
    AddWorker(name, action, autostart) {
        let id = -1;
        if (this.m_mapStates.has(name)) {
            id = this.m_lstWorker.length;
            this.m_lstWorker.push(new MiniFSMWorker(name, this.AddAction(action), autostart));
            this.m_mapStates.set(name, id);
        }
        else {
            console.error("MiniFSM: Cannot add worker '" + name + "', name already exists.");
        }
        return id;
    }
    AddAction(action) {
        let id = this.m_lstAction.length;
        this.m_lstAction.push(action);
        return id;
    }
}
MiniFSM.SKIP_ONEXIT = "@@@SKIPEXIT@@@";
//# sourceMappingURL=genesis64.js.map