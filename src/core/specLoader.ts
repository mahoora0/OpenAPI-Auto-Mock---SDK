import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';

export type OpenAPISpec = OpenAPIV3.Document;

/**
 * OpenAPI 명세 파일을 로드하고 검증합니다.
 * @param filepath OpenAPI 파일 경로 (.yaml 또는 .json)
 * @returns 파싱된 OpenAPI 명세 객체
 */
export async function loadOpenAPISpec(filepath: string): Promise<OpenAPISpec> {
  try {
    console.log(`🔍 Validating OpenAPI specification...`);

    // swagger-parser를 사용하여 파일을 로드하고 검증
    const spec = await SwaggerParser.validate(filepath) as OpenAPISpec;

    console.log(`✅ OpenAPI specification loaded successfully`);
    console.log(`📊 Version: ${spec.info.version}`);
    console.log(`📝 Title: ${spec.info.title}`);
    console.log(`🔗 Total endpoints: ${Object.keys(spec.paths || {}).length}`);

    return spec;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Failed to load OpenAPI specification: ${error.message}`);
    } else {
      console.error(`❌ Failed to load OpenAPI specification:`, error);
    }
    throw error;
  }
}
