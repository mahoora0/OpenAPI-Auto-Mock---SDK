import Fastify, { FastifyInstance } from 'fastify';
import { OpenAPISpec } from '../core/specLoader';
import { MockGenerator } from '../mock/generator';
import { OpenAPIV3 } from 'openapi-types';

export interface ServerOptions {
  port: number;
  seed: number;
}

/**
 * Mock 서버를 생성합니다.
 */
export function createMockServer(spec: OpenAPISpec, options: ServerOptions): FastifyInstance {
  const app = Fastify({
    logger: false, // 간단한 로그로 시작
  });

  // MockGenerator 인스턴스를 서버에서 공유하여 재사용
  const mockGenerator = new MockGenerator({ seed: options.seed });

  // CORS 허용 (개발용) - 일단 제거하고 기본 기능 테스트
  // app.register(require('@fastify/cors'), {
  //   origin: true,
  // });


  // 루트 경로 핸들러 추가
  app.get('/', async (request, reply) => {
    const endpoints = [];
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (pathItem) {
          const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
          for (const method of methods) {
            if (pathItem[method]) {
              endpoints.push(`${method.toUpperCase()} ${path}`);
            }
          }
        }
      }
    }

    reply.send({
      message: 'OAM Mock Server is running!',
      spec: {
        title: spec.info.title,
        version: spec.info.version,
        description: spec.info.description
      },
      endpoints: endpoints,
      example: {
        users: 'GET /users',
        userById: 'GET /users/123',
        posts: 'GET /posts'
      }
    });
  });

  // OpenAPI paths를 순회하며 동적 라우터 생성
  if (spec.paths) {
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      if (pathItem) {
        registerPathRoutes(app, path, pathItem, spec, mockGenerator);
      }
    }
  }

  return app;
}

/**
 * 단일 경로에 대한 라우터들을 등록합니다.
 */
function registerPathRoutes(
  app: FastifyInstance,
  path: string,
  pathItem: OpenAPIV3.PathItemObject,
  spec: OpenAPISpec,
  mockGenerator: MockGenerator
) {
  // 지원하는 HTTP 메서드들
  const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

  for (const method of methods) {
    const operation = pathItem[method];
    if (operation) {
      registerOperationRoute(app, method, path, operation, spec, mockGenerator);
    }
  }
}

/**
 * 단일 operation에 대한 라우터를 등록합니다.
 */
function registerOperationRoute(
  app: FastifyInstance,
  method: string,
  path: string,
  operation: OpenAPIV3.OperationObject,
  spec: OpenAPISpec,
  mockGenerator: MockGenerator
) {
  // Fastify 라우터 등록
  app.route({
    method: method.toUpperCase() as any, // Fastify HTTPMethods 타입으로 캐스팅
    url: convertOpenAPIPathToFastify(path),
    handler: async (request, reply) => {
      try {
        // 응답 스키마 선택 (기본적으로 200 응답 사용)
        const responseSchema = selectResponseSchema(operation);

        if (responseSchema) {
          // 경로 기반 시드를 사용하여 Mock 데이터 생성
          const fullPath = `${method.toUpperCase()} ${path}`;
          const mockData = mockGenerator.generateWithSeed(responseSchema, fullPath);
          reply.send(mockData);
        } else {
          // 응답 스키마가 없는 경우 빈 객체 반환
          reply.send({});
        }
      } catch (error) {
        console.error(`Error generating mock data for ${method.toUpperCase()} ${path}:`, error);
        reply.code(500).send({ error: 'Internal server error' });
      }
    },
  });

  console.log(`📍 Registered route: ${method.toUpperCase()} ${path}`);
}

/**
 * OpenAPI 경로를 Fastify 경로 형식으로 변환합니다.
 * 예: /users/{id} -> /users/:id
 */
function convertOpenAPIPathToFastify(openAPIPath: string): string {
  return openAPIPath.replace(/\{([^}]+)\}/g, ':$1');
}

/**
 * Operation에서 응답 스키마를 선택합니다.
 * Phase 1에서는 200 응답을 우선적으로 사용합니다.
 */
function selectResponseSchema(operation: OpenAPIV3.OperationObject): OpenAPIV3.SchemaObject | null {
  // 200 응답 우선
  if (operation.responses?.['200']) {
    const response = operation.responses['200'] as OpenAPIV3.ResponseObject;
    if (response.content?.['application/json']?.schema) {
      return response.content['application/json'].schema as OpenAPIV3.SchemaObject;
    }
  }

  // 200이 없으면 다른 성공 응답 찾기 (201, 202 등)
  const successCodes = ['201', '202', '203', '204'];
  for (const code of successCodes) {
    if (operation.responses?.[code]) {
      const response = operation.responses[code] as OpenAPIV3.ResponseObject;
      if (response.content?.['application/json']?.schema) {
        return response.content['application/json'].schema as OpenAPIV3.SchemaObject;
      }
    }
  }

  // 성공 응답이 없으면 default 응답 사용
  if (operation.responses?.default) {
    const response = operation.responses.default as OpenAPIV3.ResponseObject;
    if (response.content?.['application/json']?.schema) {
      return response.content['application/json'].schema as OpenAPIV3.SchemaObject;
    }
  }

  return null;
}
