import { createContext } from 'react'

export const AppContext = createContext({
    userInfo: {},
    setUserInfo: () => {}
})