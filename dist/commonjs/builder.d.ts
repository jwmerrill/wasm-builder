import { DataSegment, ElementSegment, ExportEntry, FunctionCode, FunctionDescription, FunctionType, GlobalEntry, GlobalType, ImportEntry, Instruction, InstructionExpression, MemoryType, ResizableLimits, SectionId, TableType, WasmModule } from "@wasmkit/wasm-parser";
export declare class WasmWriter {
    private buffer;
    size: number;
    private expand;
    writeByte(byte: number): void;
    writeSignedByte(byte: number): void;
    writeInt32(num: number): void;
    writeUint32(num: number): void;
    writeInt64(num: bigint): void;
    writeFloat32(num: number): void;
    writeFloat64(num: number): void;
    writeName(text: string): void;
    writeByteVector(bytes: Uint8Array | number[], length?: number): void;
    writeVector<ElementType>(elements: ElementType[], elementWriteFunc: (element: ElementType) => void, length?: number): void;
    writeFunctionType(functionType: FunctionType): void;
    writeLimits(resizableLimits: ResizableLimits, writeFlags?: boolean): void;
    writeMemoryType(memoryType: MemoryType): void;
    writeTableType(tableType: TableType): void;
    writeGlobalType(globalType: GlobalType): void;
    writeInstruction(instruction: Instruction): void;
    writeInstructionExpression(expression: InstructionExpression): void;
    writeTypeEntry(typeEntry: FunctionType): void;
    writeImportEntry(importEntry: ImportEntry): void;
    writeFunctionEntry(funcDescription: FunctionDescription): void;
    writeTableEntry(tableType: TableType): void;
    writeMemoryEntry(memoryType: MemoryType): void;
    writeGlobalEntry(globalEntry: GlobalEntry): void;
    writeExportEntry(exportEntry: ExportEntry): void;
    writeElementEntry(segment: ElementSegment): void;
    writeCodeEntry(functionCode: FunctionCode): void;
    writeDataEntry(segment: DataSegment): void;
    hasSpace(amount?: number): boolean;
    assert(check: boolean, message: string): void;
    write(): Uint8Array;
}
export declare class WasmBuilder extends WasmWriter {
    private constructor();
    buildHeader(): void;
    buildSection<EntryType>(id: SectionId, entryWriterFunc: (entry: EntryType) => void, entries: EntryType[]): void;
    static buildModule(wasmModule: WasmModule): Uint8Array;
}
