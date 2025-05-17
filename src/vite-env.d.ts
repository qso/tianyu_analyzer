/// <reference types="vite/client" />

declare module '*.csv?url' {
  const content: string;
  export default content;
}

declare module '*.csv' {
  const content: string;
  export default content;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.webm' {
  const src: string;
  export default src;
}

declare module '*.ogg' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
