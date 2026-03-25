import { setupServer } from 'msw/node'
import { monitorHandlers } from './handlers/monitors'
import { userHandlers } from './handlers/users'
import { notificationHandlers } from './handlers/notifications'

export const server = setupServer(...monitorHandlers, ...userHandlers, ...notificationHandlers)
