import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        const text = "This is a test document. It should be split into smaller chunks. Let's see if it works perfectly without hanging!";
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 10,
            chunkOverlap: 2,
        });
        const chunks = await splitter.splitText(text);
        console.log("CHUNKS:", chunks);
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
})();
