import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';

export type OpenAPISpec = OpenAPIV3.Document;

/**
 * OpenAPI 명세 파일을 로드하고 검증합니다.
 * @param filepath OpenAPI 파일 경로 (.yaml 또는 .json)
 * @returns 파싱된 OpenAPI 명세 객체 (모든 $ref가 해석됨)
 */
export async function loadOpenAPISpec(filepath: string): Promise<OpenAPISpec> {
  try {
    console.log(`🔍 Validating and dereferencing OpenAPI specification...`);

    // swagger-parser를 사용하여 파일을 로드하고 검증
    const spec = await SwaggerParser.validate(filepath) as OpenAPISpec;

    // 모든 $ref를 인라인으로 펼쳐서 해석 (dereference)
    const dereferencedSpec = await SwaggerParser.dereference(spec) as OpenAPISpec;

    console.log(`✅ OpenAPI specification loaded and dereferenced successfully`);
    console.log(`📊 Version: ${dereferencedSpec.info.version}`);
    console.log(`📝 Title: ${dereferencedSpec.info.title}`);
    console.log(`🔗 Total endpoints: ${Object.keys(dereferencedSpec.paths || {}).length}`);

    return dereferencedSpec;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to load OpenAPI specification: ${error.message}`);
    } else {
      console.error(`❌ Failed to load OpenAPI specification:`, error);
    }
    throw error;
  }
}
