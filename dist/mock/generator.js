"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockGenerator = void 0;
exports.generateMockData = generateMockData;
const faker_1 = require("@faker-js/faker");
/**
 * OpenAPI 스키마를 기반으로 Mock 데이터를 생성합니다.
 */
class MockGenerator {
    constructor(options = {}) {
        this.options = options;
        // 시드 설정으로 결정성 보장
        if (options.seed) {
            faker_1.faker.seed(options.seed);
        }
    }
    /**
     * 스키마로부터 Mock 데이터를 생성합니다.
     */
    generate(schema) {
        if (!schema) {
            return null;
        }
        // 기본 타입 처리
        switch (schema.type) {
            case 'string':
                return this.generateString(schema);
            case 'number':
            case 'integer':
                return this.generateNumber(schema);
            case 'boolean':
                return faker_1.faker.datatype.boolean();
            case 'object':
                return this.generateObject(schema);
            case 'array':
                return this.generateArray(schema);
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
    generateObject(schema) {
        const result = {};
        if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                // required가 지정되지 않았거나 required에 포함된 경우에만 생성
                if (!schema.required || schema.required.includes(key)) {
                    result[key] = this.generate(propSchema);
                }
                else {
                    // 선택적 필드는 70% 확률로 생성
                    if (faker_1.faker.datatype.boolean(0.7)) {
                        result[key] = this.generate(propSchema);
                    }
                }
            }
        }
        return result;
    }
    generateArray(schema) {
        const minItems = schema.minItems || 1;
        const maxItems = schema.maxItems || 5;
        const itemCount = faker_1.faker.number.int({ min: minItems, max: Math.min(maxItems, 10) });
        const result = [];
        // ArraySchemaObject 타입인지 확인
        const arraySchema = schema;
        if (arraySchema.items) {
            for (let i = 0; i < itemCount; i++) {
                result.push(this.generate(arraySchema.items));
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
 * 편의를 위한 헬퍼 함수
 */
function generateMockData(schema, options) {
    const generator = new MockGenerator(options);
    return generator.generate(schema);
}
//# sourceMappingURL=generator.js.map