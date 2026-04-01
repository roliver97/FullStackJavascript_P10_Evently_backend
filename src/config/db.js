const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL)
    console.log('La conexión con la BBDD se ha realizado correctamente🤩')
  } catch (error) {
    console.log('No se ha podido establecer la conexión con la BBDD😰')
  }
}

module.exports = { connectDB }
