async function chunkText(text,maxWords=200,overlapWords=40){
    const words = text.split(/s+/);

    const chunks  = []
    
    i = 0

    while(i<words.length){
        const chunk = words.slice(i,i+maxWords).join(" ")
        chunks.push(chunk)
        i += (maxWords - overlapWords)
    }

    return chunks
    

} 

module.exports = { chunkText };