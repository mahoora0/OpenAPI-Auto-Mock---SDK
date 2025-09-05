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
 * @returns 파싱된 OpenAPI 명세 객체 (모든 $ref가 해석됨)
 */
async function loadOpenAPISpec(filepath) {
    try {
        console.log(`🔍 Validating and dereferencing OpenAPI specification...`);
        // swagger-parser를 사용하여 파일을 로드하고 검증
        const spec = await swagger_parser_1.default.validate(filepath);
        // 모든 $ref를 인라인으로 펼쳐서 해석 (dereference)
        const dereferencedSpec = await swagger_parser_1.default.dereference(spec);
        console.log(`✅ OpenAPI specification loaded and dereferenced successfully`);
        console.log(`📊 Version: ${dereferencedSpec.info.version}`);
        console.log(`📝 Title: ${dereferencedSpec.info.title}`);
        console.log(`🔗 Total endpoints: ${Object.keys(dereferencedSpec.paths || {}).length}`);
        return dereferencedSpec;
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