declare module '*.worker.min.js?url' {
  const url: string;
  export default url;
}

declare module '*.worker.js?url' {
  const url: string;
  export default url;
}

declare module 'pdf-parse'; 