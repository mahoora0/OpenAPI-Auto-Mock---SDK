import { OpenAPIV3 } from 'openapi-types';
export type OpenAPISpec = OpenAPIV3.Document;
/**
 * OpenAPI 명세 파일을 로드하고 검증합니다.
 * @param filepath OpenAPI 파일 경로 (.yaml 또는 .json)
 * @returns 파싱된 OpenAPI 명세 객체
 */
export declare function loadOpenAPISpec(filepath: string): Promise<OpenAPISpec>;
//# sourceMappingURL=specLoader.d.ts.map