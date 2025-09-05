import { OptionValues } from 'commander';
import { generateSDK } from '../sdk/generator';
import { loadOpenAPISpec } from '../core/specLoader';

export async function generateCommand(filepath: string, options: OptionValues) {
  const { output, baseUrl } = options;

  console.log(`🚀 Generating TypeScript SDK...`);
  console.log(`📄 Loading OpenAPI spec from: ${filepath}`);
  console.log(`📝 Output file: ${output}`);
  console.log(`🌐 Base URL: ${baseUrl}`);

  try {
    // OpenAPI 명세 파일 로드
    const spec = await loadOpenAPISpec(filepath);

    // SDK 생성
    const sdkCode = generateSDK(spec, { baseUrl });

    // 파일로 출력
    const fs = require('fs');
    const path = require('path');

    // 출력 디렉토리가 없으면 생성
    const outputDir = path.dirname(output);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 파일 쓰기
    fs.writeFileSync(output, sdkCode, 'utf-8');

    console.log(`✅ SDK generated successfully at: ${output}`);

  } catch (error) {
    console.error('❌ Failed to generate SDK:', error);
    process.exit(1);
  }
}
