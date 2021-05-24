export default function(query: any): boolean {
    return ('_nossr' in query);
}