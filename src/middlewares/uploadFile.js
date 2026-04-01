const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'RTC_P10_FullStackJavaScript/default'

    if (req.originalUrl.includes('events')) {
      folderName = 'RTC_P10_FullStackJavaScript/events'
    } else if (req.originalUrl.includes('users')) {
      folderName = 'RTC_P10_FullStackJavaScript/users'
    }

    return {
      folder: folderName,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
  }
})

const fileFilter = (req, file, cb) => {
  // Comprobamos si el formato está en nuestra lista de "formatos permitidos"
  if (
    ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
      file.mimetype
    )
  ) {
    cb(null, true) // ✅ "Todo ok Multer, sube la foto!" (Sin error, aceptado)
  } else {
    cb(new Error('Formato no permitido. Solo JPG, PNG o WEBP'), false) // ❌ "¡Para todo!" (Con error, rechazado)
  }
}

const uploadFile = multer({ storage, fileFilter })

// Por defecto, multer espera el "donde" y, como segundo parámetro, un filtro (en caso de que lo queramos). Dicho filtro, por omisión, nos "inyectará" req, file y cb (callback), así que deberemos tenerlo en cuenta y utilizarlos como argumentos al definir la función de filtro (en este caso fileFilter).

module.exports = uploadFile
