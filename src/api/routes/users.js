const { isAuth, isAdmin, isOwnerOrAdmin } = require('../../middlewares/auth')
const uploadFile = require('../../middlewares/uploadFile')
const {
  register,
  login,
  getUser,
  deleteUser,
  updateUser,
  updatePassword,
  changeRole,
  toggleFavorite,
  checkSession,
  toggleAttendance
} = require('../controllers/users')
const usersRouter = require('express').Router()

usersRouter.post('/register', uploadFile.single('avatar'), register)
usersRouter.post('/login', uploadFile.none(), login)
//uploadFile.none porque cuando hagamos login no subiremos ningún fichero pero necesitaremos que nuestro controller siga sabiendo leer un multipart/form-data. Si no pusieramos uploadFile.none(), nuestro controller esperaria un JSON, pero como desde el Front le enviamos un new FormData(form) dejaría el req.body vacío.
usersRouter.get('/check-session', [isAuth], checkSession)

usersRouter.get('/:id', getUser)
usersRouter.delete('/:id', [isAuth, isOwnerOrAdmin], deleteUser)
usersRouter.put(
  '/:id',
  [isAuth, isOwnerOrAdmin],
  uploadFile.single('avatar'),
  updateUser
)

usersRouter.patch('/:id/role', [isAuth, isAdmin], changeRole)

usersRouter.patch('/:eventId/attendance', [isAuth], toggleAttendance)
usersRouter.patch('/favorites/:eventId', [isAuth], toggleFavorite)

usersRouter.patch('/update-password', [isAuth], updatePassword)

module.exports = usersRouter
