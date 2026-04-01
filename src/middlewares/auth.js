const Event = require('../api/models/event')
const User = require('../api/models/user')
const { verifyToken } = require('../config/jwt')

const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization

    if (!token) {
      return res.status(401).json({ message: 'No estás autorizado ❌' })
    }

    const parsedToken = token.replace('Bearer ', '')
    const { user_id } = verifyToken(parsedToken)
    const user = await User.findById(user_id)

    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Error en middleware isAuth:', error.message)
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      next()
    } else {
      return res
        .status(403)
        .json('Acceso denegado. Se requieren permisos de administrador')
    }
  } catch (error) {
    console.error('Error en middleware isAdmin:', error.message)
    return res.status(500).json({ message: 'Error interno de autorización' })
  }
}

const isOwnerOrAdmin = async (req, res, next) => {
  try {
    const user = req.user

    const { id } = req.params // (ej: /api/v1/users/:id El id que queremos modificar/eliminar viene dentro de req.params)

    if (user.role === 'admin') {
      return next()
    }

    if (user._id.toString() !== id) {
      return res.status(403).json({
        message: 'No tienes permiso para modificar a otros usuarios ⛔'
      })
    }

    next()
  } catch (error) {
    console.error('Error en middleware isOwnerOrAdmin:', error.message)
    return res.status(500).json({ message: 'Error interno de autorización' })
  }
}

const isOrganizerOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)

    if (!event) {
      return res.status(404).json({ message: 'Evento no encontrado🤔' })
    }

    const isOrganizer = event.organizer.toString() === req.user._id.toString()
    const isAdmin = req.user.role === 'admin'

    if (isOrganizer || isAdmin) {
      return next()
    } else {
      return res.status(403).json({
        message: 'No tienes permiso para modificar o eliminar este evento ⛔'
      })
    }
  } catch (error) {
    console.error('Error en middleware isOrganizerOrAdmin:', error.message)
    return res
      .status(500)
      .json({ message: 'Error en la validación de permisos' })
  }
}

module.exports = { isAuth, isAdmin, isOwnerOrAdmin, isOrganizerOrAdmin }
