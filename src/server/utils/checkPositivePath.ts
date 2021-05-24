export default function(path: string): boolean {
    return /^(?:https?:)?\/\//i.test(path); // path.startsWith("http://") || path.startsWith("https:") || path.startsWith("//");
}