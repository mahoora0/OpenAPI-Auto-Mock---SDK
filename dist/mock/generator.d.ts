import { OpenAPIV3 } from 'openapi-types';
export interface MockGeneratorOptions {
    seed?: number;
}
/**
 * OpenAPI 스키마를 기반으로 Mock 데이터를 생성합니다.
 */
export declare class MockGenerator {
    private options;
    constructor(options?: MockGeneratorOptions);
    /**
     * 스키마로부터 Mock 데이터를 생성합니다.
     */
    generate(schema: OpenAPIV3.SchemaObject): any;
    private generateString;
    private generateNumber;
    private generateObject;
    private generateArray;
    private generateDefaultValue;
}
/**
 * 편의를 위한 헬퍼 함수
 */
export declare function generateMockData(schema: OpenAPIV3.SchemaObject, options?: MockGeneratorOptions): any;
//# sourceMappingURL=generator.d.ts.map