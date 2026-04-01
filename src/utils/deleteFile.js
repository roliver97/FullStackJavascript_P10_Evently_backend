const cloudinary = require('cloudinary').v2

const deleteFile = async (imgUrl) => {
  if (!imgUrl || !imgUrl.includes('cloudinary')) {
    return
  }
  // Para eliminar el archivo de Cloudinary necesitamos el nombre de la carpeta y el nombre de dicho archivo. Entonces, si por ejemplo tenemos esta url: "https://res.cloudinary.com/djjxjezsu/image/upload/v1768293112/consoles/volv2ypitzywdzcc1etn.jpg" necesitaremos extraer "consoles/volv2ypitzywdzcc1etn".

  try {
    const imgSplitted = imgUrl.split('/')

    // Buscamos en qué posición del array está el nombre del proyecto
    const folderIndex = imgSplitted.findIndex(
      (part) => part === 'RTC_P10_FullStackJavaScript'
    )

    const publicPath = imgSplitted.slice(folderIndex).join('/')

    // Quitamos la extensión (.jpg, .png...) para quedarnos solo con el ID que pide Cloudinary, cortando el publicPath por el "." creando un array de dos trozos y nos quedamos con el primero [0].
    const public_id = publicPath.split('.')[0]

    console.log(`🗑️ Intentando borrar de Cloudinary: ${public_id}`)

    const result = await cloudinary.uploader.destroy(public_id)
    console.log('✅ Foto eliminada de Cloudinary:', result)
    return result
  } catch (error) {
    console.error('❌ Error al borrar en Cloudinary:', error.message)
  }
}

module.exports = { deleteFile }
