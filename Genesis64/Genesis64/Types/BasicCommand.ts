enum CmdType {
    cmd /*  0, commands, PRINT */,
    fnum /*  1, numerical method, SIN */,
    fstr /*  2, string method, LEFT$ */,
    fout /*  3, output method, SPC */,
    ops /*  4, operators, +,- */,
    comp /*  5, compare =, <= ... */
}

type BasicCmd = {
    name: string;
    abbrv: string;
    tkn: number;
    type: CmdType;
    reg?: RegExp;

    split?: Function;
    param?: string;
    count?: number;

}