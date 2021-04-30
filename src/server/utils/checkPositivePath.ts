export default function(path: string): boolean {
    return path.startsWith("http://") || path.startsWith("https:");
}