export default function(query: any): boolean {
    return ('_notssr' in query);
}