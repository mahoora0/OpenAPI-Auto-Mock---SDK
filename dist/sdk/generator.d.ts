import { OpenAPISpec } from '../core/specLoader';
export interface SDKOptions {
    baseUrl: string;
}
/**
 * OpenAPI 스펙으로부터 TypeScript SDK를 생성합니다.
 */
export declare function generateSDK(spec: OpenAPISpec, options: SDKOptions): string;
//# sourceMappingURL=generator.d.ts.map