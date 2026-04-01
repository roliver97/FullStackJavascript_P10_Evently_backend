const { isAuth, isOrganizerOrAdmin } = require('../../middlewares/auth')
const uploadFile = require('../../middlewares/uploadFile')
const {
  getEvents,
  createEvent,
  deleteEvent,
  toggleAttendees,
  updateEvent,
  getEventById,
  toggleFavorites,
  getEventFiltersData
} = require('../controllers/events')

const eventsRouter = require('express').Router()

eventsRouter.get('/event-filters-data', getEventFiltersData)
eventsRouter.get('/', getEvents)
eventsRouter.post('/', [isAuth], uploadFile.single('poster'), createEvent)
eventsRouter.get('/:id', getEventById)
eventsRouter.delete('/:id', [isAuth, isOrganizerOrAdmin], deleteEvent)
eventsRouter.put(
  '/:id',
  [isAuth, isOrganizerOrAdmin],
  uploadFile.single('poster'),
  updateEvent
)
eventsRouter.patch('/:eventId/attendees', [isAuth], toggleAttendees)
eventsRouter.patch('/favorites/:eventId', [isAuth], toggleFavorites)

module.exports = eventsRouter
