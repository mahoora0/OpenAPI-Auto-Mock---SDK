import { OpenAPIV3 } from 'openapi-types';
export interface MockGeneratorOptions {
    seed?: number;
}
/**
 * OpenAPI 스키마를 기반으로 Mock 데이터를 생성합니다.
 */
export declare class MockGenerator {
    private baseSeed;
    constructor(options?: MockGeneratorOptions);
    /**
     * 경로 기반 시드를 생성합니다.
     * 동일한 경로에는 항상 같은 데이터를 반환하지만, 다른 경로에는 다른 데이터를 생성합니다.
     */
    private generateSeedForPath;
    /**
     * 스키마로부터 Mock 데이터를 생성합니다.
     */
    generate(schema: OpenAPIV3.SchemaObject): any;
    /**
     * 경로 기반 시드를 사용하여 스키마로부터 Mock 데이터를 생성합니다.
     */
    generateWithSeed(schema: OpenAPIV3.SchemaObject, path?: string): any;
    private generateString;
    private generateNumber;
    private generateObject;
    private generateArray;
    private generateDefaultValue;
}
/**
 * 편의를 위한 헬퍼 함수 (기존 호환성 유지)
 */
export declare function generateMockData(schema: OpenAPIV3.SchemaObject, options?: MockGeneratorOptions): any;
/**
 * 경로 기반 시드를 사용하는 헬퍼 함수
 */
export declare function generateMockDataWithPath(schema: OpenAPIV3.SchemaObject, path: string, options?: MockGeneratorOptions): any;
//# sourceMappingURL=generator.d.ts.map