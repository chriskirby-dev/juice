export function isRelative(pathStr) {
    return !/^(\/|\\|[a-zA-Z]:)/.test(pathStr);
}

export function extention(pathStr) {
    return pathStr.replace(/.*\./, "");
}

export function directory(pathStr) {
    return pathStr.replace(/\/?[^\/]*$/, "");
}

export function filename(path) {
    return path.replace(/.*\./, "");
}

export function basename(path) {
    return path.replace(/\/?[^\/]*$/, "");
}

const fileSignatures = [
    { signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], fileType: "PNG", mimeType: "image/png" },
    { signature: [0xff, 0xd8, 0xff], fileType: "JPEG", mimeType: "image/jpeg" },
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], fileType: "GIF87a", mimeType: "image/gif" },
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], fileType: "GIF89a", mimeType: "image/gif" },
    { signature: [0x25, 0x50, 0x44, 0x46, 0x2d], fileType: "PDF", mimeType: "application/pdf" },
    { signature: [0x42, 0x4d], fileType: "BMP", mimeType: "image/bmp" },
    { signature: [0x49, 0x49, 0x2a, 0x00], fileType: "TIFF (little-endian)", mimeType: "image/tiff" },
    { signature: [0x4d, 0x4d, 0x00, 0x2a], fileType: "TIFF (big-endian)", mimeType: "image/tiff" },
    { signature: [0x50, 0x4b, 0x03, 0x04], fileType: "ZIP", mimeType: "application/zip" },
    {
        signature: [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00],
        fileType: "RAR",
        mimeType: "application/x-rar-compressed",
    },
    { signature: [0x1f, 0x8b, 0x08], fileType: "GZIP", mimeType: "application/gzip" },
    { signature: [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], fileType: "7Z", mimeType: "application/x-7z-compressed" },
    { signature: [0x50, 0x4b, 0x03, 0x04], fileType: "JAR", mimeType: "application/java-archive" },
    { signature: [0x43, 0x57, 0x53], fileType: "SWF", mimeType: "application/x-shockwave-flash" },
    { signature: [0x46, 0x57, 0x53], fileType: "SWF", mimeType: "application/x-shockwave-flash" },
    { signature: [0x25, 0x21], fileType: "PS", mimeType: "application/postscript" },
    {
        signature: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
        fileType: "DOC/XLS",
        mimeType: "application/vnd.ms-office",
    },
    {
        signature: [0x50, 0x4b, 0x03, 0x04],
        fileType: "DOCX/PPTX/XLSX",
        mimeType: "application/vnd.openxmlformats-officedocument",
    },
    { signature: [0x49, 0x44, 0x33], fileType: "MP3", mimeType: "audio/mpeg" },
    { signature: [0x00, 0x00, 0x01, 0xba], fileType: "MPEG", mimeType: "video/mpeg" },
    { signature: [0x00, 0x00, 0x01, 0xb3], fileType: "MPEG", mimeType: "video/mpeg" },
    { signature: [0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d], fileType: "MP4", mimeType: "video/mp4" },
    { signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], fileType: "MP4", mimeType: "video/mp4" },
    { signature: [0x4f, 0x67, 0x67, 0x53], fileType: "OGG", mimeType: "application/ogg" },
    { signature: [0x00, 0x00, 0x01, 0xba], fileType: "VOB", mimeType: "video/dvd" },
    { signature: [0x1a, 0x45, 0xdf, 0xa3], fileType: "MKV", mimeType: "video/x-matroska" },
    { signature: [0x52, 0x49, 0x46, 0x46], fileType: "AVI", mimeType: "video/x-msvideo" },
    { signature: [0x42, 0x4d], fileType: "BMP", mimeType: "image/bmp" },
    { signature: [0x49, 0x20, 0x49], fileType: "TIFF", mimeType: "image/tiff" },
    { signature: [0xff, 0xfb], fileType: "MP3", mimeType: "audio/mpeg" },
    { signature: [0x42, 0x4d], fileType: "BMP", mimeType: "image/bmp" },
    { signature: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], fileType: "MP4", mimeType: "video/mp4" },
    { signature: [0x1f, 0x9d], fileType: "Z", mimeType: "application/x-compress" },
    { signature: [0x1f, 0xa0], fileType: "Z", mimeType: "application/x-compress" },
    { signature: [0x7f, 0x45, 0x4c, 0x46], fileType: "ELF", mimeType: "application/x-elf" },
    { signature: [0x52, 0x49, 0x46, 0x46], fileType: "WAV", mimeType: "audio/x-wav" },
    { signature: [0x52, 0x49, 0x46, 0x46], fileType: "WEBP", mimeType: "image/webp" },
    { signature: [0x49, 0x44, 0x33], fileType: "MP3", mimeType: "audio/mpeg" },
    { signature: [0x4f, 0x67, 0x67, 0x53], fileType: "OGG", mimeType: "audio/ogg" },
    { signature: [0x38, 0x42, 0x50, 0x53], fileType: "PSD", mimeType: "image/vnd.adobe.photoshop" },
];

export async function filetype(url) {
    const response = await fetch(url, {
        method: "GET",
        headers: {
            Range: "bytes=0-4095", // Request the first 4 KB of the file
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);

    return detectMimeType(byteArray);
}

function detectMimeType(byteArray) {}
