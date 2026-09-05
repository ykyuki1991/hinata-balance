/** Resolve public assets identically on localhost and repository-scoped Pages. */
export const assetURL=(path:string)=>import.meta.env.BASE_URL+path.replace(/^\/+/, '');
