import { Project, StructureKind } from 'ts-morph';
import { OpenAPISpec } from '../core/specLoader';

export interface SDKOptions {
  baseUrl: string;
}

/**
 * OpenAPI 스펙으로부터 TypeScript SDK를 생성합니다.
 */
export function generateSDK(spec: OpenAPISpec, options: SDKOptions): string {
  const project = new Project();
  const sourceFile = project.createSourceFile('sdk.ts', '', { overwrite: true });

  // 에러 타입 정의 추가
  addErrorTypes(sourceFile);

  // 타입 정의 추가
  addTypeDefinitions(sourceFile, spec);

  // API 클라이언트 클래스 추가
  addAPIClient(sourceFile, spec, options);

  // 함수들 추가
  addAPIFunctions(sourceFile, spec, options);

  return sourceFile.getFullText();
}

/**
 * 에러 타입들을 추가합니다.
 */
function addErrorTypes(sourceFile: any) {
  // APIError 클래스
  sourceFile.addClass({
    name: 'APIError',
    extends: 'Error',
    properties: [
      {
        name: 'status',
        type: 'number',
        isReadonly: true,
      },
      {
        name: 'statusText',
        type: 'string',
        isReadonly: true,
      },
      {
        name: 'data',
        type: 'any',
        isReadonly: true,
      },
    ],
    constructors: [
      {
        parameters: [
          { name: 'status', type: 'number' },
          { name: 'statusText', type: 'string' },
          { name: 'data', type: 'any', hasQuestionToken: true },
        ],
        statements: `
          super(\`HTTP \${status}: \${statusText}\`);
          this.name = 'APIError';
          this.status = status;
          this.statusText = statusText;
          this.data = data;
        `,
      },
    ],
    isExported: true,
  });

  // 에러 타입 union
  sourceFile.addTypeAlias({
    name: 'APIResponse',
    type: 'unknown',
    isExported: true,
  });

  // 에러 처리 헬퍼 함수
  sourceFile.addFunction({
    name: 'isAPIError',
    parameters: [
      { name: 'error', type: 'unknown' },
    ],
    returnType: 'error is APIError',
    statements: `
      return error instanceof APIError;
    `,
    isExported: true,
  });
}

/**
 * 스키마들을 TypeScript 타입으로 변환합니다.
 */
function addTypeDefinitions(sourceFile: any, spec: OpenAPISpec) {
  if (!spec.components?.schemas) {
    return;
  }

  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    const tsType = convertSchemaToTSType(schema as any, name);
    sourceFile.addInterface({
      name: name,
      properties: tsType.properties,
      isExported: true,
    });
  }
}

/**
 * API 클라이언트 클래스를 추가합니다.
 */
function addAPIClient(sourceFile: any, spec: OpenAPISpec, options: SDKOptions) {
  sourceFile.addClass({
    name: 'APIClient',
    properties: [
      {
        name: 'baseURL',
        type: 'string',
        initializer: `"${options.baseUrl}"`,
      },
    ],
    methods: [
      {
        name: 'request',
        parameters: [
          { name: 'method', type: 'string' },
          { name: 'path', type: 'string' },
          { name: 'options', type: '{ body?: any; params?: Record<string, any> }', hasQuestionToken: true },
        ],
        statements: `
          const url = new URL(path, this.baseURL);
          if (options?.params) {
            Object.entries(options.params).forEach(([key, value]) => {
              if (value !== undefined) {
                url.searchParams.append(key, String(value));
              }
            });
          }

          const config: RequestInit = {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
          };

          if (options?.body) {
            config.body = JSON.stringify(options.body);
          }

          const response = await fetch(url.toString(), config);
          if (!response.ok) {
            let errorData;
            try {
              errorData = await response.json();
            } catch {
              errorData = { message: response.statusText };
            }
            throw new APIError(response.status, response.statusText, errorData);
          }

          return response.json();
        `,
        isAsync: true,
      },
    ],
    isExported: true,
  });

  // 기본 클라이언트 인스턴스 추가
  sourceFile.addVariableStatement({
    declarations: [
      {
        name: 'client',
        initializer: 'new APIClient()',
      },
    ],
    isExported: true,
  });
}

/**
 * API 함수들을 추가합니다.
 */
function addAPIFunctions(sourceFile: any, spec: OpenAPISpec, options: SDKOptions) {
  if (!spec.paths) {
    return;
  }

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;

    const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;

    for (const method of methods) {
      const operation = pathItem[method];
      if (operation) {
        const functionName = generateFunctionName(operation, path, method);
        const functionCode = generateFunction(operation, path, method, spec);

        sourceFile.addFunction({
          name: functionName,
          parameters: functionCode.parameters,
          returnType: functionCode.returnType,
          statements: functionCode.statements,
          isExported: true,
          isAsync: true,
        });
      }
    }
  }
}

/**
 * 스키마를 TypeScript 타입으로 변환합니다.
 */
function convertSchemaToTSType(schema: any, name: string): any {
  const properties: any[] = [];

  if (schema.type === 'object' && schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const isRequired = schema.required?.includes(propName) || false;
      const tsType = getTypeScriptType(propSchema as any);

      properties.push({
        name: propName,
        type: tsType,
        hasQuestionToken: !isRequired,
      });
    }
  }

  return { properties };
}

/**
 * JSON Schema 타입을 TypeScript 타입으로 변환합니다.
 */
function getTypeScriptType(schema: any): string {
  if (!schema) return 'any';

  switch (schema.type) {
    case 'string':
      if (schema.format === 'date-time') return 'string';
      if (schema.format === 'email') return 'string';
      if (schema.format === 'uuid') return 'string';
      return 'string';
    case 'number':
    case 'integer':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      const itemType = getTypeScriptType(schema.items);
      return `${itemType}[]`;
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}

/**
 * 함수명을 생성합니다.
 */
function generateFunctionName(operation: any, path: string, method: string): string {
  // operationId 우선 사용
  if (operation.operationId) {
    return operation.operationId;
  }

  // 경로 기반 함수명 생성
  const pathParts = path.split('/').filter(p => p && !p.startsWith('{'));
  const baseName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'api';

  return `${method}${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}`;
}

/**
 * 함수 코드를 생성합니다.
 */
function generateFunction(operation: any, path: string, method: string, spec: OpenAPISpec) {
  const parameters: any[] = [];
  const statements: string[] = [];

  // 파라미터 처리
  if (operation.parameters) {
    for (const param of operation.parameters) {
      if (param.in === 'path') {
        parameters.push({
          name: param.name,
          type: getTypeScriptType(param.schema),
        });
      } else if (param.in === 'query') {
        // 쿼리 파라미터들은 options 객체에 포함
        continue;
      }
    }
  }

  // 요청 body 처리
  if (operation.requestBody) {
    parameters.push({
      name: 'body',
      type: 'any',
    });
  }

  // 쿼리 파라미터들을 위한 options 파라미터
  parameters.push({
    name: 'options',
    type: '{ params?: Record<string, any> }',
    hasQuestionToken: true,
  });

  // 함수 본문 생성
  const pathWithParams = path.replace(/\{([^}]+)\}/g, '${$1}');
  const queryParams = operation.parameters?.filter((p: any) => p.in === 'query') || [];

  statements.push(`
    const path = \`${pathWithParams}\`;
    const queryParams: Record<string, any> = {};

    ${queryParams.map((p: any) => `
    if (options?.params?.${p.name} !== undefined) {
      queryParams.${p.name} = options.params.${p.name};
    }`).join('\n    ')}

    return client.request('${method.toUpperCase()}', path, {
      body: ${operation.requestBody ? 'body' : 'undefined'},
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });
  `);

  // 반환 타입 결정
  let returnType = 'Promise<any>';
  if (operation.responses?.['200']?.content?.['application/json']?.schema) {
    const responseSchema = operation.responses['200'].content['application/json'].schema;
    const tsType = getTypeScriptType(responseSchema);
    returnType = `Promise<${tsType}>`;
  }

  return {
    parameters,
    returnType,
    statements: statements.join('\n'),
  };
}
