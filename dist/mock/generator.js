"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGenerator = void 0;
exports.generateMockData = generateMockData;
exports.generateMockDataWithPath = generateMockDataWithPath;
const faker_1 = require("@faker-js/faker");
/**
 * OpenAPI 스키마를 기반으로 Mock 데이터를 생성합니다.
 */
class MockGenerator {
    constructor(options = {}) {
        this.baseSeed = options.seed || 12345;
    }
    /**
     * 경로 기반 시드를 생성합니다.
     * 동일한 경로에는 항상 같은 데이터를 반환하지만, 다른 경로에는 다른 데이터를 생성합니다.
     */
    generateSeedForPath(path) {
        // 경로를 해시하여 결정성 있는 시드를 생성
        let hash = 0;
        for (let i = 0; i < path.length; i++) {
            const char = path.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32비트 정수로 변환
        }
        // 기본 시드와 경로 해시를 결합
        return Math.abs(this.baseSeed + hash);
    }
    /**
     * 스키마로부터 Mock 데이터를 생성합니다.
     */
    generate(schema) {
        return this.generateWithSeed(schema, 'default');
    }
    /**
     * 경로 기반 시드를 사용하여 스키마로부터 Mock 데이터를 생성합니다.
     */
    generateWithSeed(schema, path = 'default') {
        if (!schema) {
            return null;
        }
        // 기본 타입의 경우 경로 기반 시드 설정
        if (schema.type !== 'object' && schema.type !== 'array') {
            const pathSeed = this.generateSeedForPath(path);
            faker_1.faker.seed(pathSeed);
        }
        // 기본 타입 처리
        switch (schema.type) {
            case 'string':
                return this.generateString(schema);
            case 'number':
            case 'integer':
                return this.generateNumber(schema);
            case 'boolean':
                return faker_1.faker.datatype.boolean({ probability: 0.5 });
            case 'object':
                return this.generateObject(schema, path);
            case 'array':
                return this.generateArray(schema, path);
            default:
                // 타입이 지정되지 않은 경우 기본값 반환
                return this.generateDefaultValue(schema);
        }
    }
    generateString(schema) {
        // format에 따른 특수 처리
        if (schema.format) {
            switch (schema.format) {
                case 'email':
                    return faker_1.faker.internet.email();
                case 'uuid':
                    return faker_1.faker.string.uuid();
                case 'uri':
                    return faker_1.faker.internet.url();
                case 'date-time':
                    return faker_1.faker.date.recent().toISOString();
                case 'date':
                    return faker_1.faker.date.recent().toISOString().split('T')[0];
                default:
                    // 지원하지 않는 format은 일반 문자열로 처리
                    break;
            }
        }
        // enum이 있는 경우
        if (schema.enum && schema.enum.length > 0) {
            return faker_1.faker.helpers.arrayElement(schema.enum);
        }
        // 기본 문자열 생성
        const minLength = schema.minLength || 1;
        const maxLength = schema.maxLength || 50;
        return faker_1.faker.string.alpha({ length: { min: minLength, max: Math.min(maxLength, 100) } });
    }
    generateNumber(schema) {
        const minimum = schema.minimum || 0;
        const maximum = schema.maximum || 1000;
        if (schema.type === 'integer') {
            return faker_1.faker.number.int({ min: minimum, max: maximum });
        }
        else {
            return faker_1.faker.number.float({ min: minimum, max: maximum, precision: 0.01 });
        }
    }
    generateObject(schema, path = '') {
        const result = {};
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                // required가 정의되고 key가 포함되어 있으면: 필수 필드 → 항상 생성
                const isRequired = schema.required && schema.required.includes(key);
                if (isRequired) {
                    // 필수 필드는 항상 생성 - 속성별 고유 경로 사용
                    const propertyPath = path ? `${path}.${key}` : key;
                    result[key] = this.generateWithSeed(propSchema, propertyPath);
                }
                else {
                    // 선택적 필드는 70% 확률로 생성
                    // 확률 계산을 위한 시드 생성 (속성 경로 기반)
                    const probabilityPath = path ? `${path}.${key}.probability` : `${key}.probability`;
                    const probSeed = this.generateSeedForPath(probabilityPath);
                    faker_1.faker.seed(probSeed);
                    if (faker_1.faker.datatype.boolean({ probability: 0.7 })) {
                        const propertyPath = path ? `${path}.${key}` : key;
                        result[key] = this.generateWithSeed(propSchema, propertyPath);
                    }
                }
            }
        }
        return result;
    }
    generateArray(schema, path = '') {
        const minItems = schema.minItems || 1;
        const maxItems = schema.maxItems || 5;
        // 배열 길이도 결정론적으로 생성하기 위해 경로 기반 시드 사용
        const lengthPath = path ? `${path}.length` : 'length';
        const lengthSeed = this.generateSeedForPath(lengthPath);
        faker_1.faker.seed(lengthSeed);
        const itemCount = faker_1.faker.number.int({ min: minItems, max: Math.min(maxItems, 10) });
        const result = [];
        // ArraySchemaObject 타입인지 확인
        const arraySchema = schema;
        if (arraySchema.items) {
            for (let i = 0; i < itemCount; i++) {
                // 각 배열 요소마다 고유한 경로 사용
                const itemPath = path ? `${path}[${i}]` : `[${i}]`;
                result.push(this.generateWithSeed(arraySchema.items, itemPath));
            }
        }
        return result;
    }
    generateDefaultValue(schema) {
        // example이 있는 경우 우선 사용
        if (schema.example !== undefined) {
            return schema.example;
        }
        // default 값이 있는 경우 사용
        if (schema.default !== undefined) {
            return schema.default;
        }
        // 타입이 불명확한 경우 기본값 반환
        return faker_1.faker.lorem.word();
    }
}
exports.MockGenerator = MockGenerator;
/**
 * 편의를 위한 헬퍼 함수 (기존 호환성 유지)
 */
function generateMockData(schema, options) {
    const generator = new MockGenerator(options);
    return generator.generate(schema);
}
/**
 * 경로 기반 시드를 사용하는 헬퍼 함수
 */
function generateMockDataWithPath(schema, path, options) {
    const generator = new MockGenerator(options);
    return generator.generateWithSeed(schema, path);
}
//# sourceMappingURL=generator.js.map