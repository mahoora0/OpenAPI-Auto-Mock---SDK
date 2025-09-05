"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockCommand = mockCommand;
const server_1 = require("../server/server");
const specLoader_1 = require("../core/specLoader");
async function mockCommand(filepath, options) {
    const { port, seed } = options;
    console.log(`🚀 Starting OAM Mock Server...`);
    console.log(`📄 Loading OpenAPI spec from: ${filepath}`);
    console.log(`🌐 Server will run on port: ${port}`);
    console.log(`🎲 Mock data seed: ${seed}`);
    try {
        // OpenAPI 명세 파일 로드
        const spec = await (0, specLoader_1.loadOpenAPISpec)(filepath);
        // Mock 서버 생성 및 시작
        const server = (0, server_1.createMockServer)(spec, {
            port: parseInt(port),
            seed: parseInt(seed)
        });
        await server.listen({ port: parseInt(port), host: '127.0.0.1' });
        console.log(`✅ Mock server is running at http://127.0.0.1:${port}`);
        console.log(`💡 Press Ctrl+C to stop the server`);
    }
    catch (error) {
        console.error('❌ Failed to start mock server:', error);
        process.exit(1);
    }
}
//# sourceMappingURL=mock.js.map