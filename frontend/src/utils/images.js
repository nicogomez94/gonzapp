export const cloudinaryImage = (url, transform = 'f_auto,q_auto') => {
  if (!url || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
};
