import { FastifyInstance } from 'fastify';
import { OpenAPISpec } from '../core/specLoader';
export interface ServerOptions {
    port: number;
    seed: number;
}
/**
 * Mock 서버를 생성합니다.
 */
export declare function createMockServer(spec: OpenAPISpec, options: ServerOptions): FastifyInstance;
//# sourceMappingURL=server.d.ts.map