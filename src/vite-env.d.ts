/// <reference types="vite/client" />

// Allow importing CSS files as raw strings
declare module "*.css?raw" {
  const content: string;
  export default content;
}
