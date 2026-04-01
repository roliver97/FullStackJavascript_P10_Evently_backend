const { deleteFile } = require('../../utils/deleteFile')
const Event = require('../models/event')
const User = require('../models/user')

const createEvent = async (req, res, next) => {
  try {
    const userId = req.user._id
    const newEvent = new Event(req.body)

    if (req.file) {
      newEvent.poster = req.file.path // req.file.path es la URL de Cloudinary
    }

    newEvent.organizer = userId
    newEvent.attendees = [userId]

    const eventSaved = await newEvent.save()

    const userUpdated = await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: {
          createdEvents: eventSaved._id,
          attendance: eventSaved._id
        }
      },
      { new: true, runValidators: true }
    ).populate('createdEvents attendance')

    return res.status(201).json({
      message: '¡Event created and added to your profile! 🎉',
      event: eventSaved,
      user: userUpdated
    })
  } catch (error) {
    console.error(`Error con el controlador createEvent`, error.message)
    return res.status(500).json({
      message: 'No se ha podido crear el evento ❌',
      error: error.message
    })
  }
}

const getEvents = async (req, res, next) => {
  try {
    // Recogemos los possibles filtros de la URL ⬅️
    // Ej: /api/events?category=Music&city=Barcelona
    const { query, category, city, date } = req.query
    let queryConditions = {}

    if (query) {
      const words = query.trim().split(/\s+/)

      // Busquem usuaris que coincideixin per si busquen per organitzador
      const users = await User.find({
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } }
        ]
      }).select('_id')
      const userIds = users.map((user) => user._id)

      // Creem les condicions per a cada paraula cercada
      const searchConditions = words.map((word) => ({
        $or: [
          //$or === que la query cumpla con ALGUNA de las condiciones
          { title: { $regex: word, $options: 'i' } }, //$regex === 'regular expresion'. Busca patrones de texto en vez de concidencias exactas ('bar' para barcelona, por ejemplo)
          { city: { $regex: word, $options: 'i' } }, //$options: 'i' === 'i' de insensitive === case insensitive
          { location: { $regex: word, $options: 'i' } },
          { description: { $regex: word, $options: 'i' } }, // Afegim descripció per si de cas
          { organizer: { $in: userIds } }
        ]
      }))

      // Afegim la cerca a les condicions globals usant $and
      queryConditions.$and = searchConditions
    }

    if (category) {
      queryConditions.category = category
    }

    if (city) {
      queryConditions.city = { $regex: city, $options: 'i' }
    }

    if (date) {
      queryConditions.date = { $gte: new Date(date) } // $gte = Greater Than or Equal
    }

    const events = await Event.find(queryConditions) // si queryCond es null, devolverá todos
      .populate('organizer', 'username firstName lastName avatar')
      .populate('attendees', 'username firstName lastName avatar')
      .populate('favorites', 'username firstName lastName avatar')
      .sort({ date: 1 }) // Ordena por fecha más próxima

    return res.status(200).json(events)
  } catch (error) {
    console.error(`Error con el controlador getEvents`, error.message)
    return res.status(500).json({
      message: 'No se han podido obtener los eventos ❌',
      error: error.message
    })
  }
}

const getEventFiltersData = async (req, res, next) => {
  // Lo usaremos para refrescar los campos de los filtros en el front relacionandolos con los datos actualizados del back que obtendremos bajo esta petición
  try {
    const cities = await Event.distinct('city')
    const categories = await Event.distinct('category')

    return res.status(200).json({
      cities: cities.sort(), // Ordenadas alfabéticamente
      categories: categories.sort()
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error recuperando los datos disponibles para los filtros ❌',
      error: error.message
    })
  }
}

const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)
      .populate('organizer', 'username firstName lastName avatar')
      .populate('attendees', 'username firstName lastName avatar')
      .populate('favorites', 'username firstName lastName avatar')

    if (!event) {
      res.status(404).json({ message: 'Event not found ❌' })
    }
    return res.status(200).json(event)
  } catch (error) {
    return res.status(400).json({ message: 'Error fetching event details ❌' })
  }
}

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params

    const eventDeleted = await Event.findByIdAndDelete(id)

    if (!eventDeleted) {
      return res.status(404).json({ message: 'Evento no encontrado' })
    }

    if (eventDeleted.poster) {
      deleteFile(eventDeleted.poster)
      // deleteFile ya tiene su propio "portero" que mira si la url es de Cloudinary
    }

    const userUpdated = await User.findByIdAndUpdate(
      eventDeleted.organizer,
      { $pull: { createdEvents: id } },
      { new: true, runValidators: true }
    )

    return res.status(200).json({
      message: 'Evento eliminado con éxito🗑️',
      event: eventDeleted,
      user: userUpdated
    })
  } catch (error) {
    console.error('Error en el controlador deleteEvent:', error.message)
    return res
      .status(400)
      .json({ message: 'No se ha podido eliminar el evento ❌' })
  }
}

const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params

    const { date, hour } = req.body
    const newEvent = { ...req.body }

    if (date && hour) {
      // "2026-03-05" + "T" + "18:30" + ":00" => ISO Format
      newEvent.date = new Date(`${date}T${hour}:00`)
      newEvent.hour = hour
    }

    if (req.file) {
      const oldEvent = await Event.findById(id)

      if (oldEvent && oldEvent.poster) {
        deleteFile(oldEvent.poster)
      }

      newEvent.poster = req.file.path
    }

    const eventUpdated = await Event.findByIdAndUpdate(id, newEvent, {
      new: true,
      runValidators: true
    })
      .populate('organizer', 'username firstName lastName avatar')
      .populate('attendees', 'username firstName lastName avatar')
      .populate('favorites', 'username firstName lastName avatar')

    if (!eventUpdated) {
      return res.status(404).json({ message: 'Evento no encontrado' })
    }

    return res.status(200).json({
      message: 'Los datos del evento han sido actualizados con éxito ✅',
      updatedEvent: eventUpdated
    })
  } catch (error) {
    console.error('Error en el controlador updateEvent:', error.message)
    return res.status(400).json({
      message: 'No ha sido posible actualizar los datos del evento ❌'
    })
  }
}

const toggleAttendees = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const userId = req.user._id

    const event = await Event.findById(eventId)

    const isAttendee = event.attendees.includes(userId)

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { [isAttendee ? '$pull' : '$addToSet']: { attendees: userId } }, // Si queremos que el nombre de una clave sea el resultado de una operación o variable usamos los claudátors. Computed Property Names (Nombres de Propiedades Calculadas)
      { new: true }
    )
      .populate('organizer', 'username firstName lastName avatar')
      .populate('attendees', 'username firstName lastName avatar')
      .populate('favorites', 'username firstName lastName avatar')

    return res.status(200).json({
      message:
        'La lista de asistentes de este evento ha sido actualizada correctamente 🎉',
      event: updatedEvent
    })
  } catch (error) {
    console.error(
      'Error en el controlador toggleAttendees de Events:',
      error.message
    )
    return res.status(400).json({
      message:
        'No ha sido posible actualizar la lista de asistentes de este evento ❌'
    })
  }
}

const toggleFavorites = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const userId = req.user._id

    const event = await Event.findById(eventId)

    const isFavorite = event.favorites.includes(userId)

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { [isFavorite ? '$pull' : '$addToSet']: { favorites: userId } }, // Si queremos que el nombre de una clave sea el resultado de una operación o variable usamos los claudátors. Computed Property Names (Nombres de Propiedades Calculadas)
      { new: true }
    )
      .populate('organizer', 'username firstName lastName avatar')
      .populate('attendees', 'username firstName lastName avatar')
      .populate('favorites', 'username firstName lastName avatar')

    return res.status(200).json({
      message:
        'La lista de favoritos de este evento ha sido actualizada correctamente 🎉',
      event: updatedEvent
    })
  } catch (error) {
    console.error(
      'Error en el controlador toggleFavorites de Events:',
      error.message
    )
    return res.status(400).json({
      message:
        'No ha sido posible actualizar la lista de favoritos de este evento ❌'
    })
  }
}

module.exports = {
  createEvent,
  getEvents,
  getEventFiltersData,
  getEventById,
  deleteEvent,
  updateEvent,
  toggleAttendees,
  toggleFavorites
}
