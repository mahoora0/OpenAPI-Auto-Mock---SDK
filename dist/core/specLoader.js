"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOpenAPISpec = loadOpenAPISpec;
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
/**
 * OpenAPI 명세 파일을 로드하고 검증합니다.
 * @param filepath OpenAPI 파일 경로 (.yaml 또는 .json)
 * @returns 파싱된 OpenAPI 명세 객체
 */
async function loadOpenAPISpec(filepath) {
    try {
        console.log(`🔍 Validating OpenAPI specification...`);
        // swagger-parser를 사용하여 파일을 로드하고 검증
        const spec = await swagger_parser_1.default.validate(filepath);
        console.log(`✅ OpenAPI specification loaded successfully`);
        console.log(`📊 Version: ${spec.info.version}`);
        console.log(`📝 Title: ${spec.info.title}`);
        console.log(`🔗 Total endpoints: ${Object.keys(spec.paths || {}).length}`);
        return spec;
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Failed to load OpenAPI specification: ${error.message}`);
        }
        else {
            console.error(`❌ Failed to load OpenAPI specification:`, error);
        }
        throw error;
    }
}
//# sourceMappingURL=specLoader.js.map