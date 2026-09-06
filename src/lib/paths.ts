/** Every internal URL needs the same prefix on GitHub project Pages. */
export function withBase(path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}

export function postPath(id: string): string {
  return withBase(`posts/${id.split('/').map(encodeURIComponent).join('/')}/`);
}
