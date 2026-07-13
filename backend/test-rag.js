import ragService from './src/services/rag.js';
import githubService from './src/services/github.js';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    console.log("Starting test...");
    try {
        const res = await ragService.processRepository("sankri15", "codenova-ai", githubService, process.env.GITHUB_TOKEN);
        console.log("SUCCESS:", res);
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
})();
