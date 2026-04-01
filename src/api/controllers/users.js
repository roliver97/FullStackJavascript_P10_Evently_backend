const { generateToken } = require('../../config/jwt')
const { deleteFile } = require('../../utils/deleteFile')
const User = require('../models/user')
const Event = require('../models/event')
const bcrypt = require('bcrypt')

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, username, password } = req.body

    const userExists = await User.findOne({ $or: [{ email }, { username }] })
    if (userExists) {
      return res.status(400).json({ message: 'Ese usuario ya existe! 🙅🏼' })
    }

    const fullName = `${firstName} ${lastName}`

    const customAvatar = `https://ui-avatars.com/api/?name=${fullName.replace(/ /g, '+')}&background=random`

    const newUser = new User({
      firstName,
      lastName,
      email,
      username,
      password,
      avatar: customAvatar
    })

    if (req.file) {
      newUser.avatar = req.file.path // req.file.path es la URL de Cloudinary
    }

    const userSaved = await newUser.save()
    const token = generateToken(userSaved._id)
    const userResponse = userSaved.toObject()
    delete userResponse.password
    return res.status(201).json({
      message: '¡Usuario registrado con éxito! 🎉',
      token: token,
      user: userResponse
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al registrar el usuario ❌',
      error: error.message
    })
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const normalizedEmail = email.toLowerCase().trim()

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password'
    )
    if (!user) {
      return res
        .status(400)
        .json({ message: 'Email o contraseña incorrectos❌' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Email o contraseña incorrectos ❌' })
    }

    const token = generateToken(user._id)
    const userWithEvents = await User.findById(user._id)
      .populate('createdEvents')
      .populate('favorites')
      .populate('attendance')
    const userResponse = userWithEvents.toObject()
    delete userResponse.password
    return res.status(200).json({
      message: `¡Bienvenido de nuevo, ${userResponse.firstName}! 👋`,
      token,
      user: userResponse
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Error al loguear el usuario ❌',
      error: error.message
    })
  }
}

const checkSession = async (req, res) => {
  // Esta función solo sirve para saber si isAuth funciona y req.user existe. La usaremos para evitar que el usuario sienta que está logueado cuando realmente se ha caducado su token.
  const user = await User.findById(req.user._id).populate(
    'createdEvents favorites attendance'
  )
  return res.status(200).json(user)
}

const getUser = async (req, res, next) => {
  const { id } = req.params
  try {
    const user = await User.findById(id)
      .populate('createdEvents')
      .populate('favorites')
      .populate('attendance')
    // No será necesario borrar el password porque en el modelo hemos marcado password: {select:false}.
    return res.status(200).json(user)
  } catch (error) {
    console.error('Error al obtener los datos del usuario:', error.message)
    return res
      .status(400)
      .json({ message: 'Error al obtener los datos del usuario de la BBDD' })
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    await Event.deleteMany({ organizer: id })
    await Event.updateMany(
      { $or: [{ attendees: id }, { favorites: id }] },
      { $pull: { attendees: id, favorites: id } }
    )

    const userDeleted = await User.findByIdAndDelete(id)

    if (userDeleted.avatar) {
      deleteFile(userDeleted.avatar) // en caso de tener avatar por defecto (ui-avatars.com) la función deleteFile ignorará la eliminación de ninguna imagen (solo elimina si está en Cloudinary)
    }

    /* const userResponse = userDeleted.toObject() y
    delete userResponse.password no es necesario... En el modelo pusimos password: {select:false} */

    return res.status(200).json({
      message: `${userDeleted.username} and all associated events were deleted from our Database`
    })
  } catch (error) {
    console.error(
      `Error al eliminar el usuario con ID ${req.params.id}`,
      error.message
    )
    return res.status(400).json({
      message:
        'No se ha podido eliminar el usuario. Comprueba que el ID es correcto'
    })
  }
}

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, username, role } = req.body
    const updateData = { firstName, lastName, email, username }

    if (req.body.password) {
      return res.status(400).json({
        message:
          'La contraseña no se puede cambiar desde aquí. Usa la ruta específica.'
      })
    } // Para modificar el password haremos una ruta específica para ello

    if (role) {
      if (req.user.role === 'admin') {
        updateData.role = role // aunque no esté en la lista inicial, añadimos ahora role a updateData
      } else {
        return res
          .status(403)
          .json({ message: 'No tienes permiso para cambiar el rol.' })
      }
    }

    // LÓGICA DE AVATAR (Automático vs Cloudinary)
    const currentUser = await User.findById(id)
    if (!currentUser)
      return res.status(404).json({ message: 'Usuario no encontrado' })

    if (req.file) {
      updateData.avatar = req.file.path
    } else {
      delete updateData.avatar // así evitamos que se elimine el avatar por error si hacemos update de cualquier otro campo que no sea 'avatar'.
    }

    if (req.file) {
      if (currentUser.avatar && currentUser.avatar.includes('cloudinary')) {
        deleteFile(currentUser.avatar) // en caso de tener avatar por defecto (ui-avatars.com) la función deleteFile ignorará la eliminación de ninguna imagen (solo elimina si está en Cloudinary)
      }
      updateData.avatar = req.file.path
      // RECALCULAMOS EL AVATAR AUTOMÁTICO SI HAY UN UPDATE DE FIRSTNAME O LASTNAME
    } else {
      const isUsingCloudinary =
        currentUser.avatar && currentUser.avatar.includes('cloudinary')
      const nameChanged = req.body.firstName || req.body.lastName

      if (isUsingCloudinary) {
        delete updateData.avatar
      } else if (nameChanged) {
        const fName = req.body.firstName || currentUser.firstName
        const lName = req.body.lastName || currentUser.lastName
        updateData.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fName + '+' + lName)}&background=random` //encodeURIComponent para que las tíldes o puntos (si los hay) no rompan la URL
      } else {
        delete updateData.avatar
      }
    }

    const userUpdated = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true // Obliga a que Mongoose mire los enum del modelo (por defecto, solo los revisa si hacemos .save(), pero con el findByIdAndUpdate() los ignoraría. Aquí los necesitamos para que los valores de "role" solo puedan ser "user" o "admin".
    }).populate('createdEvents favorites attendance')

    return res.status(200).json({
      message: 'Perfil actualizado con éxito✨',
      user: userUpdated
    })
  } catch (error) {
    console.error('Error en updateUser:', error.message)
    return res.status(400).json({ message: 'Error al actualizar los datos' })
  }
}

const updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body
    const userId = req.user._id

    const user = await User.findById(userId).select('+password')
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'La contraseña actual no es correcta ❌' })
    }
    user.password = newPassword
    await user.save()
    // con las lineas user.password = newPassword y await user.save() Mongoose detecta que el campo password ha cambiado y ejecuta automáticamente la función que tenemos en el Model que hace el bcrypt.hash. Cabe recordar que la función bcrypt.hash era pre("save"), por eso usamos user.save() y no un Update directo con findByIdAndUpdate().
    return res
      .status(200)
      .json({ message: 'Contraseña actualizada con éxito 🔐' })
  } catch (error) {
    console.error('Error en updatePassword:', error.message)
    return res
      .status(400)
      .json({ message: 'No se ha podido cambiar la contraseña' })
  }
}

const changeRole = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json('Usuario no encontrado')
    }

    if (user.role === 'user') {
      user.role = 'admin'
    } else {
      user.role = 'user'
    }

    const updatedUser = await user.save()
    const userResponse = updatedUser.toObject()
    return res.status(200).json({
      message: 'El rol del usuario ha sido actualizado con éxito',
      user: userResponse
    })
  } catch (error) {
    console.error('Error en el controlador changeRole:', error.message)
    return res
      .status(400)
      .json({ message: 'Error al cambiar el rol del usuario' })
  }
}

const toggleFavorite = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const userId = req.user._id

    const user = await User.findById(userId)

    const isFavorite = user.favorites.includes(eventId)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { [isFavorite ? '$pull' : '$addToSet']: { favorites: eventId } }, // Si queremos que el nombre de una clave sea el resultado de una operación o variable usamos los claudátors. Computed Property Names (Nombres de Propiedades Calculadas)
      { new: true }
    ).populate('createdEvents favorites attendance')

    return res.status(200).json({
      message:
        'El evento ha sido añadido a la lista de favoritos del usuario correctamente 🎉',
      user: updatedUser
    })
  } catch (error) {
    return res.status(400).json({
      message:
        'No ha sido posible añadir el evento a la lista de favoritos del usuario ❌'
    })
  }
}

const toggleAttendance = async (req, res, next) => {
  try {
    const { eventId } = req.params
    const userId = req.user._id

    const user = await User.findById(userId)

    const isAttending = user.attendance.includes(eventId)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { [isAttending ? '$pull' : '$addToSet']: { attendance: eventId } }, // Si queremos que el nombre de una clave sea el resultado de una operación o variable usamos los claudátors. Computed Property Names (Nombres de Propiedades Calculadas)
      { new: true }
    ).populate('createdEvents favorites attendance')

    return res.status(200).json({
      message:
        'La lista de eventos a asistir del usuario ha sido actualizada correctamente 🎉',
      user: updatedUser
    })
  } catch (error) {
    return res.status(400).json({
      message:
        'No ha sido posible actualizar la lista de eventos a asistir del usuario ❌'
    })
  }
}

module.exports = {
  register,
  login,
  checkSession,
  getUser,
  deleteUser,
  updateUser,
  updatePassword,
  changeRole,
  toggleFavorite,
  toggleAttendance
}
