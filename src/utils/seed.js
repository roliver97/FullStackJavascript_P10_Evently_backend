const mongoose = require('mongoose')
const User = require('../api/models/user')
const Event = require('../api/models/event')
const eventsData = require('../data/events')
const { deleteFile } = require('./deleteFile')
const { connectCloudinary } = require('../config/cloudinary')
require('dotenv').config()

const launchSeed = async () => {
  try {
    await mongoose.connect(process.env.DB_URL)
    console.log('🔗 Conectado a la BBDD...')
    await connectCloudinary()

    //LIMPIEZA CLOUDINARY
    const allEvents = await Event.find()
    const allUsers = await User.find()

    let deletedEvents = 0
    let deletedUsers = 0
    console.log('🗑️ Iniciando limpieza de Cloudinary...')

    for (const event of allEvents) {
      if (event.poster?.includes('cloudinary')) {
        await deleteFile(event.poster)
        deletedEvents++
      }
    }

    for (const user of allUsers) {
      if (user.avatar?.includes('cloudinary')) {
        await deleteFile(user.avatar)
        deletedUsers++
      }
    }

    console.log(
      `✅ Se han limpiado ${deletedEvents} imágenes de eventos y ${deletedUsers} avatares de usuarios del almacenamiento en Cloudinary.`
    )

    //LIMPIEZA BBDD
    await User.collection
      .drop()
      .catch(() => console.log('La colección de usuarios ya estaba vacía'))
    await Event.collection
      .drop()
      .catch(() => console.log('La colección de eventos ya estaba vacía'))
    console.log('🧹 Base de datos limpia')

    //CREACIÓN DE DEFAULT ADMIN I EVENTOS
    console.log('Iniciando la creación de las colecciones por defecto...🧙')
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'Seed',
      email: process.env.DEFAULT_ADMIN_EMAIL,
      username: 'admin_seed',
      password: process.env.DEFAULT_ADMIN_PASSWORD,
      role: 'admin',
      avatar: 'https://ui-avatars.com/api/?name=Admin+Seed&background=random',
      favorites: [],
      attendance: [],
      createdEvents: []
    })

    const savedAdmin = await adminUser.save()
    console.log(`👤 Admin creado: ${savedAdmin.email}`)

    const eventsToInsert = eventsData.map((event) => ({
      ...event,
      organizer: savedAdmin._id,
      attendees: [savedAdmin._id]
    }))

    const insertedEvents = await Event.insertMany(eventsToInsert)
    console.log('🌱 Eventos sembrados y asignados al Admin')

    savedAdmin.createdEvents = insertedEvents.map((event) => event._id)
    savedAdmin.attendance = insertedEvents.map((event) => event._id)
    await savedAdmin.save()
    console.log('🔗 Relación Admin-Eventos establecida con éxito')
  } catch (error) {
    console.error('❌ Error en la siembra:', error)
  } finally {
    //! EL BLOQUE FINALLY SE EJECUTA SIEMPRE
    await mongoose.disconnect()
    console.log('🔌 Desconectado de la DB de forma segura')
  }
}

launchSeed()
