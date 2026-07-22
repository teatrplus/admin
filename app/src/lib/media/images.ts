const imageExtension = /\.(jpe?g|png|gif|webp|avif|bmp|svg)$/i

export const isImageFile = (file: File) =>
  file.type.startsWith('image/') || (!file.type && imageExtension.test(file.name))

export const filterImageFiles = (files: Iterable<File>) =>
  [...files].filter((file) => isImageFile(file))
