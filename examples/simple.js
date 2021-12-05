const util = require('util');
const WabtModule = require('./wabt');
const { WasmBuilder } = require("../dist/commonjs/builder");
const { ValueType, Opcode } = require('@wasmkit/wasm-parser');

WabtModule().then(function(wabt) {
    const compiledModule = WasmBuilder.buildModule({
        types: [{
            params: [ValueType.F32],
            results: [ValueType.I32],
        }],
        functions: [{
            typeIndex: 0,
            locals: [ValueType.F64, ValueType.F32],
            body: [
                {
                    opcode: Opcode.I32Const,
                    immediates: {
                        value: -123456
                    }
                }, {
                    opcode: Opcode.Return,
                    immediates: {}
                }, {
                    opcode: Opcode.End,
                    immediates: {}
                }
            ]
        }],
        tables: [],
        memories: [],
        globals: [],
        elements: [],
        datas: [],
        start: null,
        imports: [],
        exports: [],
    });

    const wabtWasmModule = wabt.readWasm(compiledModule, {});

    console.log(wabtWasmModule.toText({}));
});