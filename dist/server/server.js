"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockServer = createMockServer;
const fastify_1 = __importDefault(require("fastify"));
const generator_1 = require("../mock/generator");
/**
 * Mock 서버를 생성합니다.
 */
function createMockServer(spec, options) {
    const app = (0, fastify_1.default)({
        logger: false, // 간단한 로그로 시작
    });
    // MockGenerator 인스턴스를 서버에서 공유하여 재사용
    const mockGenerator = new generator_1.MockGenerator({ seed: options.seed });
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
                    const methods = ['get', 'post', 'put', 'delete', 'patch'];
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
function registerPathRoutes(app, path, pathItem, spec, mockGenerator) {
    // 지원하는 HTTP 메서드들
    const methods = ['get', 'post', 'put', 'delete', 'patch'];
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
function registerOperationRoute(app, method, path, operation, spec, mockGenerator) {
    // OpenAPI 파라미터들을 Fastify schema로 변환
    const schema = buildFastifySchema(operation, spec);
    // Fastify 라우터 등록
    app.route({
        method: method.toUpperCase(), // Fastify HTTPMethods 타입으로 캐스팅
        url: convertOpenAPIPathToFastify(path),
        schema: schema,
        handler: async (request, reply) => {
            try {
                // POST/PUT/PATCH의 경우 요청 body 검증
                if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
                    const validationError = validateRequestBody(operation, request);
                    if (validationError) {
                        // 400 응답 스키마를 사용하여 에러 응답 생성
                        const errorSchema = selectResponseSchema(operation, 400);
                        if (errorSchema) {
                            const fullPath = `${method.toUpperCase()} ${path}`;
                            const errorData = mockGenerator.generateWithSeed(errorSchema, fullPath);
                            return reply.code(400).send(errorData);
                        }
                        else {
                            return reply.code(400).send({
                                error: 'Bad Request',
                                message: validationError
                            });
                        }
                    }
                }
                // 응답 스키마 선택 (기본적으로 200 응답 사용)
                const responseSchema = selectResponseSchema(operation, 200);
                if (responseSchema) {
                    // 경로 기반 시드를 사용하여 Mock 데이터 생성
                    const fullPath = `${method.toUpperCase()} ${path}`;
                    const mockData = mockGenerator.generateWithSeed(responseSchema, fullPath);
                    reply.send(mockData);
                }
                else {
                    // 응답 스키마가 없는 경우 빈 객체 반환
                    reply.send({});
                }
            }
            catch (error) {
                console.error(`Error generating mock data for ${method.toUpperCase()} ${path}:`, error);
                reply.code(500).send({ error: 'Internal server error' });
            }
        },
    });
    console.log(`📍 Registered route: ${method.toUpperCase()} ${path}`);
}
/**
 * 요청 body를 검증합니다.
 */
function validateRequestBody(operation, request) {
    if (!operation.requestBody) {
        return null; // requestBody가 없으면 검증하지 않음
    }
    const requestBody = operation.requestBody;
    const body = request.body;
    console.log('🔍 Validating request body:', { hasBody: !!body, bodyKeys: body ? Object.keys(body) : [] });
    // 필수 requestBody인 경우 body가 있는지 확인
    if (requestBody.required && (!body || Object.keys(body).length === 0)) {
        return 'Request body is required';
    }
    // content-type에 따른 기본적인 검증
    if (requestBody.content?.['application/json']) {
        const schema = requestBody.content['application/json'].schema;
        // 간단한 필수 필드 검증
        if (schema?.required) {
            console.log('📋 Required fields:', schema.required);
            for (const requiredField of schema.required) {
                if (!(requiredField in body)) {
                    return `Missing required field: ${requiredField}`;
                }
            }
        }
    }
    return null; // 검증 통과
}
/**
 * OpenAPI operation의 파라미터들을 Fastify schema로 변환합니다.
 */
function buildFastifySchema(operation, spec) {
    const schema = {};
    if (!operation.parameters) {
        return schema;
    }
    // 파라미터들을 그룹화
    const params = {};
    const querystring = {};
    const headers = {};
    for (const param of operation.parameters) {
        const paramSchema = param.schema;
        switch (param.in) {
            case 'path':
                params[param.name] = paramSchema;
                break;
            case 'query':
                querystring[param.name] = paramSchema;
                break;
            case 'header':
                headers[param.name] = paramSchema;
                break;
        }
    }
    // Fastify schema에 적용
    if (Object.keys(params).length > 0) {
        schema.params = params;
    }
    if (Object.keys(querystring).length > 0) {
        schema.querystring = querystring;
    }
    if (Object.keys(headers).length > 0) {
        schema.headers = headers;
    }
    return schema;
}
/**
 * OpenAPI 경로를 Fastify 경로 형식으로 변환합니다.
 * 예: /users/{id} -> /users/:id
 */
function convertOpenAPIPathToFastify(openAPIPath) {
    return openAPIPath.replace(/\{([^}]+)\}/g, ':$1');
}
/**
 * Operation에서 응답 스키마를 선택합니다.
 * 지정된 상태 코드의 응답을 우선적으로 사용합니다.
 */
function selectResponseSchema(operation, statusCode = 200) {
    // 지정된 상태 코드의 응답 우선
    const statusCodeStr = statusCode.toString();
    if (operation.responses?.[statusCodeStr]) {
        const response = operation.responses[statusCodeStr];
        if (response.content?.['application/json']?.schema) {
            return response.content['application/json'].schema;
        }
    }
    // 지정된 상태 코드가 없으면 기본 로직 사용
    if (statusCode === 200) {
        // 200이 없으면 다른 성공 응답 찾기 (201, 202 등)
        const successCodes = ['201', '202', '203', '204'];
        for (const code of successCodes) {
            if (operation.responses?.[code]) {
                const response = operation.responses[code];
                if (response.content?.['application/json']?.schema) {
                    return response.content['application/json'].schema;
                }
            }
        }
    }
    // 해당 상태 코드나 성공 응답이 없으면 default 응답 사용
    if (operation.responses?.default) {
        const response = operation.responses.default;
        if (response.content?.['application/json']?.schema) {
            return response.content['application/json'].schema;
        }
    }
    return null;
}
//# sourceMappingURL=server.js.map