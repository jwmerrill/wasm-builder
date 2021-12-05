"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WasmBuilder = exports.WasmWriter = void 0;
const wasm_parser_1 = require("@wasmkit/wasm-parser");
const convo = new ArrayBuffer(8);
const u8 = new Uint8Array(convo);
const f32 = new Float32Array(convo);
const f64 = new Float64Array(convo);
const encoder = new TextEncoder();
class WasmWriter {
    constructor() {
        this.buffer = new Uint8Array(2048);
        this.size = 0;
    }
    expand(amount = 256) {
        const newBuffer = new Uint8Array(this.size + amount);
        newBuffer.set(this.buffer);
        this.buffer = newBuffer;
    }
    writeByte(byte) {
        if (!this.hasSpace(1))
            this.expand();
        this.buffer[this.size++] = byte;
    }
    writeSignedByte(byte) {
        this.writeByte((byte << 25) >>> 25);
    }
    writeInt32(num) {
        while (true) {
            let byte = num & 0x7F;
            num >>= 7;
            if ((num == -1 && (byte & 0x40)) || (num == 0 && !(byte & 0x40))) {
                this.writeByte(byte);
                break;
            }
            else {
                this.writeByte(byte | 0x80);
            }
        }
    }
    writeUint32(num) {
        do {
            let byte = num & 0x7F;
            num >>>= 7;
            this.writeByte(num !== 0 ? 0x80 | byte : byte);
        } while (num);
    }
    writeInt64(num) {
        while (true) {
            let byte = Number(num & 0x7fn);
            num >>= 7n;
            if ((num == -1n && (byte & 0x40)) || (num == 0n && !(byte & 0x40))) {
                this.writeByte(byte);
                break;
            }
            else {
                this.writeByte(byte | 0x80);
            }
        }
    }
    writeFloat32(num) {
        f32[0] = num;
        if (!this.hasSpace(4))
            this.expand();
        this.buffer.set(u8.subarray(0, 4), this.size);
        this.size += 4;
    }
    writeFloat64(num) {
        f64[0] = num;
        if (!this.hasSpace(8))
            this.expand();
        this.buffer.set(u8, this.size);
        this.size += 8;
    }
    writeName(text) {
        this.writeByteVector(encoder.encode(text));
    }
    writeByteVector(bytes, length = bytes.length) {
        if (!this.hasSpace(bytes.length + 5))
            this.expand(bytes.length + 256);
        this.writeUint32(length);
        this.buffer.set(bytes, this.size);
        this.size += bytes.length;
    }
    writeVector(elements, elementWriteFunc, length = elements.length) {
        this.writeUint32(length);
        for (let i = 0; i < elements.length; ++i)
            elementWriteFunc.call(this, elements[i]);
    }
    writeFunctionType(functionType) {
        this.writeByte(0x60);
        this.writeVector(functionType.params, this.writeSignedByte);
        this.writeVector(functionType.results, this.writeSignedByte);
    }
    writeLimits(resizableLimits, writeFlags = true) {
        let flags = 0;
        if (typeof resizableLimits.max === "number")
            flags |= 1;
        if (writeFlags)
            this.writeByte(flags);
        this.writeUint32(resizableLimits.min);
        if (typeof resizableLimits.max === "number")
            this.writeUint32(resizableLimits.max);
    }
    writeMemoryType(memoryType) {
        this.writeLimits(memoryType.limits);
    }
    writeTableType(tableType) {
        this.writeSignedByte(tableType.referenceType);
        this.writeLimits(tableType.limits);
    }
    writeGlobalType(globalType) {
        this.writeSignedByte(globalType.valueType);
        let flags = 0;
        if (globalType.mutable)
            flags |= 1;
        this.writeByte(flags);
    }
    writeInstruction(instruction) {
        if (instruction.opcode > 0xFF) {
            this.writeByte(instruction.opcode >> 8);
            this.writeUint32(instruction.opcode & 0xFF);
        }
        else
            this.writeByte(instruction.opcode);
        const immediates = instruction.immediates;
        switch (instruction.opcode) {
            case 2:
            case 3:
            case 4: {
                if (typeof immediates.valueType === "number")
                    this.writeInt32(immediates.valueType);
                else if (typeof immediates.typeIndex === "number")
                    this.writeInt32(immediates.typeIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            }
            case 12:
            case 13:
                if (typeof immediates.labelIndex === "number")
                    this.writeUint32(immediates.labelIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 14:
                if (typeof immediates.labelIndexs !== "undefined" && typeof immediates.defaultLabelIndex === "number") {
                    this.writeVector(immediates.labelIndexs, this.writeUint32);
                    this.writeUint32(immediates.defaultLabelIndex);
                }
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 16:
            case 210:
                if (typeof immediates.functionIndex === "number")
                    this.writeUint32(immediates.functionIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 17:
                if (typeof immediates.typeIndex === "number" && typeof immediates.tableIndex === "number") {
                    this.writeUint32(immediates.typeIndex);
                    this.writeUint32(immediates.tableIndex);
                }
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 208:
                if (typeof immediates.referenceType === "number")
                    this.writeUint32(immediates.referenceType);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 28:
                if (typeof immediates.valueTypes !== "undefined")
                    this.writeVector(immediates.valueTypes, this.writeUint32);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 32:
            case 33:
            case 34:
                if (typeof immediates.localIndex === "number")
                    this.writeUint32(immediates.localIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 35:
            case 36:
                if (typeof immediates.globalIndex === "number")
                    this.writeUint32(immediates.globalIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 37:
            case 38:
            case 64527:
            case 64528:
            case 64529:
                if (typeof immediates.tableIndex === "number")
                    this.writeUint32(immediates.tableIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 64524:
                if (typeof immediates.elementIndex === "number" && typeof immediates.tableIndex === "number") {
                    this.writeUint32(immediates.elementIndex);
                    this.writeUint32(immediates.tableIndex);
                }
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
            case 64526:
                if (typeof immediates.fromTableIndex === "number" && typeof immediates.toTableIndex === "number") {
                    this.writeUint32(immediates.fromTableIndex);
                    this.writeUint32(immediates.toTableIndex);
                }
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 64525:
                if (typeof immediates.elementIndex === "number")
                    this.writeUint32(immediates.elementIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 40:
            case 41:
            case 42:
            case 43:
            case 44:
            case 45:
            case 46:
            case 47:
            case 48:
            case 49:
            case 50:
            case 51:
            case 52:
            case 53:
            case 54:
            case 55:
            case 56:
            case 57:
            case 58:
            case 59:
            case 60:
            case 61:
            case 62:
                if (typeof immediates.memoryArgument !== "undefined") {
                    this.writeUint32(immediates.memoryArgument.align);
                    this.writeUint32(immediates.memoryArgument.offset);
                }
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 63:
            case 64:
                this.writeByte(0x00);
                break;
            case 64520:
                if (typeof immediates.dataIndex === "number")
                    this.writeUint32(immediates.dataIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                this.writeByte(0x00);
                break;
            case 64521:
                if (typeof immediates.dataIndex === "number")
                    this.writeUint32(immediates.dataIndex);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 64522:
                this.writeByte(0x00);
                this.writeByte(0x00);
                break;
            case 64523:
                this.writeByte(0x00);
                break;
            case 65:
                if (typeof immediates.value === "number")
                    this.writeInt32(immediates.value);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 66:
                if (typeof immediates.value === "bigint")
                    this.writeInt64(immediates.value);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 67:
                if (typeof immediates.value === "number")
                    this.writeFloat32(immediates.value);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            case 68:
                if (typeof immediates.value === "number")
                    this.writeFloat64(immediates.value);
                else
                    throw new TypeError("Invalid immediates found in " + instruction.opstring + " instruction.");
                break;
            default:
                this.assert(wasm_parser_1.Opstring.hasOwnProperty(instruction.opcode), "Unsupported instruction");
        }
    }
    writeInstructionExpression(expression) {
        for (let i = 0; i < expression.length; ++i) {
            this.writeInstruction(expression[i]);
        }
    }
    writeTypeEntry(typeEntry) {
        return this.writeFunctionType(typeEntry);
    }
    writeImportEntry(importEntry) {
        this.writeName(importEntry.module);
        this.writeName(importEntry.name);
        this.writeByte(importEntry.type);
        switch (importEntry.type) {
            case 0:
                this.writeUint32(importEntry.description.typeIndex);
                break;
            case 1:
                this.writeTableType(importEntry.description);
                break;
            case 2:
                this.writeMemoryType(importEntry.description);
                break;
            case 3:
                this.writeGlobalType(importEntry.description);
                break;
            default:
                throw new TypeError("Unsupported external type");
        }
    }
    writeFunctionEntry(funcDescription) {
        this.writeUint32(funcDescription.typeIndex);
    }
    writeTableEntry(tableType) {
        return this.writeTableType(tableType);
    }
    writeMemoryEntry(memoryType) {
        return this.writeMemoryType(memoryType);
    }
    writeGlobalEntry(globalEntry) {
        this.writeGlobalType(globalEntry.type);
        this.writeInstructionExpression(globalEntry.initialization);
    }
    writeExportEntry(exportEntry) {
        this.writeName(exportEntry.name);
        this.writeByte(exportEntry.type);
        switch (exportEntry.type) {
            case 0:
                this.writeUint32(exportEntry.description.functionIndex);
                break;
            case 1:
                this.writeUint32(exportEntry.description.tableIndex);
                break;
            case 2:
                this.writeUint32(exportEntry.description.memoryIndex);
                break;
            case 3:
                this.writeUint32(exportEntry.description.globalIndex);
                break;
            default:
                throw new TypeError("Unsupported external type");
        }
    }
    writeElementEntry(segment) {
        let modeFlags = 0;
        const modeFlagAddr = this.size;
        this.writeByte(modeFlags);
        if (segment.mode === 2)
            modeFlags |= 0b11;
        else if (segment.mode === 1)
            modeFlags |= 0b01;
        if (segment.tableIndex !== 0) {
            modeFlags |= 0b10;
            this.writeUint32(segment.tableIndex);
        }
        if (segment.mode === 0) {
            if (!segment.offset)
                throw new TypeError("Invalid active element segment - no segment offset found.");
            this.writeInstructionExpression(segment.offset);
        }
        if ((modeFlags & 0b11) !== 0)
            this.writeByte(segment.type);
        if (typeof (segment.initialization[0] || 0) === "number") {
            this.writeVector(segment.initialization, this.writeUint32);
        }
        else {
            modeFlags |= 0b100;
            this.writeVector(segment.initialization, this.writeInstructionExpression);
        }
        this.buffer[modeFlagAddr] = modeFlags;
    }
    writeCodeEntry(functionCode) {
        const functionWriter = new WasmWriter();
        const localCombine = [];
        for (const local of functionCode.locals) {
            if (!localCombine.length || localCombine[localCombine.length - 1][0] !== local)
                localCombine.push([local]);
            else
                localCombine[localCombine.length - 1].push(local);
        }
        functionWriter.writeVector(localCombine, (localsRaw) => {
            functionWriter.writeUint32(localsRaw.length);
            if (localsRaw.length)
                functionWriter.writeSignedByte(localsRaw[0]);
        });
        functionWriter.writeInstructionExpression(functionCode.body);
        this.writeByteVector(functionWriter.write());
    }
    writeDataEntry(segment) {
        this.writeByte(segment.mode);
        switch (segment.mode) {
            case 0:
                this.writeInstructionExpression(segment.offset);
                this.writeByteVector(segment.initialization);
                break;
            case 1:
                this.writeByteVector(segment.initialization);
                break;
            case 2:
                this.writeUint32(segment.memoryIndex);
                this.writeInstructionExpression(segment.offset);
                this.writeByteVector(segment.initialization);
                break;
            default:
                throw new SyntaxError("Unsupported data segment mode");
        }
    }
    hasSpace(amount = 0) {
        return this.size + amount < this.buffer.byteLength;
    }
    assert(check, message) {
        if (!check)
            throw new SyntaxError(message);
    }
    write() {
        return this.buffer.slice(0, this.size);
    }
}
exports.WasmWriter = WasmWriter;
class WasmBuilder extends WasmWriter {
    constructor() {
        super();
    }
    buildHeader() {
        this.writeByte(0x00);
        this.writeByte(0x61);
        this.writeByte(0x73);
        this.writeByte(0x6D);
        this.writeByte(0x01);
        this.writeByte(0x00);
        this.writeByte(0x00);
        this.writeByte(0x00);
    }
    buildSection(id, entryWriterFunc, entries) {
        if (entries.length === 0)
            return;
        this.writeByte(id);
        const sectionWriter = new WasmWriter();
        sectionWriter.writeVector(entries, entryWriterFunc);
        this.writeByteVector(sectionWriter.write());
    }
    static buildModule(wasmModule) {
        const builder = new WasmBuilder();
        builder.buildHeader();
        builder.buildSection(1, builder.writeTypeEntry, wasmModule.types);
        builder.buildSection(2, builder.writeImportEntry, wasmModule.imports);
        builder.buildSection(3, builder.writeFunctionEntry, wasmModule.functions);
        builder.buildSection(4, builder.writeTableEntry, wasmModule.tables);
        builder.buildSection(5, builder.writeMemoryEntry, wasmModule.memories);
        builder.buildSection(6, builder.writeGlobalEntry, wasmModule.globals);
        builder.buildSection(7, builder.writeExportEntry, wasmModule.exports);
        if (wasmModule.start !== null)
            builder.writeUint32(wasmModule.start);
        builder.buildSection(10, builder.writeCodeEntry, wasmModule.functions);
        builder.buildSection(11, builder.writeDataEntry, wasmModule.datas);
        return builder.write();
    }
}
exports.WasmBuilder = WasmBuilder;
//# sourceMappingURL=builder.js.map