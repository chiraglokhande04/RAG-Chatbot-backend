const fs = require("fs-extra");
const path = require("path");
const { getEmbedding } = require("../src/services/getEmbedding");
const { chunkText } = require("../src/utils/chunker");
// const { upsertEmbeddings } = require("../services/vectorDBService");

const INPUT_FILE = path.resolve("news_articles.jsonl");
const OUTPUT_FILE = path.resolve("news_embeddings_openai.jsonl");


async function main(){
    if(!fs.existsSync(INPUT_FILE)){
        console.error("Input file not found:",INPUT_FILE);
        process.exit(1);
    }
    if(fs.existsSync(OUTPUT_FILE)){
        fs.remove(OUTPUT_FILE);
    }

    const lines = await fs.readFile(INPUT_FILE,"utf-8")
    const articles = lines.split('\n').filter(Boolean).map(JSON.parse);

    let total = 0
    
    for(const article of articles){
        const chunks = await chunkText(article.text,200,40);
        for (const chunk of chunks){
            const vector = await getEmbedding(chunk);
            if(!vector) continue;

            const record = {
                id: article.id,
                title: article.title,
                url: article.url,
                date: article.date,
                text: chunk,
                embedding: vector
            };

            await fs.appendFile(OUTPUT_FILE,JSON.stringify(record)+"\n");
            total += 1;
            console.log("Embedded chunk:", total, "from article:", article.title);

            // await upsertEmbeddings([record]);
        }
       
    }

    console.log("All done. Total chunks embedded:", total);

}

main()